-- ============================================================
-- SOCCER CAGE — Base de datos compartida (fase de prueba)
--
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo
-- este archivo → Run. Se puede volver a ejecutar sin perder datos.
--
-- Diseño de la prueba:
--   · Todo el estado de la plataforma (productos, stock, pedidos,
--     compras, movimientos…) vive en un solo documento JSON con
--     número de revisión. Si dos personas guardan a la vez, la que
--     llega tarde recibe "conflicto" y recarga: nadie pisa a nadie.
--   · Las tablas NO se exponen directamente. Solo se accede por
--     funciones con permisos revisados:
--       - visitantes de la tienda (anon): catálogo y stock, sin
--         costos, pedidos ni clientes;
--       - equipo autorizado (tabla staff): leer y guardar;
--       - administradores: además, gestionar el equipo y restaurar.
--   · Cada guardado deja una copia de la versión anterior (últimas
--     100), para poder volver atrás si algo sale mal.
-- ============================================================

-- ---------- Tablas ----------
create table if not exists public.staff (
  email      text primary key check (email = lower(email) and email like '%@%'),
  name       text not null default '',
  role       text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.app_state (
  id         int primary key default 1 check (id = 1),
  rev        bigint not null default 0,
  data       jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.app_state_history (
  id       bigserial primary key,
  rev      bigint not null,
  data     jsonb not null,
  saved_at timestamptz not null default now(),
  saved_by text
);

insert into public.app_state (id, rev, data) values (1, 0, null) on conflict (id) do nothing;

-- Sin acceso directo: RLS activo y sin políticas; los permisos se dan solo a funciones.
alter table public.staff enable row level security;
alter table public.app_state enable row level security;
alter table public.app_state_history enable row level security;
revoke all on table public.staff, public.app_state, public.app_state_history from public, anon, authenticated;

-- ---------- Identidad ----------
create or replace function public.current_email() returns text
language sql stable set search_path = '' as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.staff_role() returns text
language sql stable security definer set search_path = '' as $$
  select s.role from public.staff s where s.email = public.current_email()
$$;

create or replace function public.require_staff() returns text
language plpgsql stable security definer set search_path = '' as $$
declare r text := public.staff_role();
begin
  if r is null then raise exception 'not_staff' using errcode = '42501'; end if;
  return r;
end $$;

create or replace function public.require_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if public.require_staff() <> 'admin' then raise exception 'not_admin' using errcode = '42501'; end if;
end $$;

-- Quién soy (para el panel). null si la cuenta no está autorizada.
create or replace function public.whoami() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('email', s.email, 'name', s.name, 'role', s.role)
  from public.staff s where s.email = public.current_email()
$$;

-- ---------- Estado compartido ----------
create or replace function public.load_state() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare st public.app_state;
begin
  perform public.require_staff();
  select * into st from public.app_state where id = 1;
  return jsonb_build_object('rev', st.rev, 'data', st.data, 'updated_at', st.updated_at, 'updated_by', st.updated_by);
end $$;

-- Para sondear barato: devuelve null si no hay cambios desde p_rev.
create or replace function public.load_state_if_newer(p_rev bigint) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare cur bigint;
begin
  perform public.require_staff();
  select rev into cur from public.app_state where id = 1;
  if cur = p_rev then return null; end if;
  return public.load_state();
end $$;

-- Guarda solo si nadie guardó después de p_rev (control optimista).
create or replace function public.save_state(p_rev bigint, p_data jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare st public.app_state; who text;
begin
  perform public.require_staff();
  who := public.current_email();
  -- coalesce: si falta la clave, jsonb_typeof da NULL y la comparación no sería "verdadera".
  if coalesce(jsonb_typeof(p_data), '') <> 'object' or coalesce(jsonb_typeof(p_data -> 'products'), '') <> 'array' then
    raise exception 'invalid_state' using errcode = '22023';
  end if;
  if pg_column_size(p_data) > 8 * 1024 * 1024 then
    raise exception 'state_too_large' using errcode = '54000';
  end if;

  select * into st from public.app_state where id = 1 for update;
  if st.rev <> p_rev then
    return jsonb_build_object('ok', false, 'conflict', true, 'rev', st.rev, 'updated_by', st.updated_by);
  end if;

  if st.data is not null then
    insert into public.app_state_history (rev, data, saved_by) values (st.rev, st.data, st.updated_by);
    delete from public.app_state_history h
     where h.id in (select x.id from public.app_state_history x order by x.id desc offset 100);
  end if;

  update public.app_state set rev = st.rev + 1, data = p_data, updated_at = now(), updated_by = who where id = 1;
  return jsonb_build_object('ok', true, 'rev', st.rev + 1);
end $$;

-- ---------- Tienda pública (sin sesión) ----------
-- Catálogo, tiendas y stock. Nunca costos, mínimos, clientes, pedidos ni cuentas de cobro.
create or replace function public.public_catalog() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when st.data is null then jsonb_build_object('rev', st.rev, 'empty', true) else jsonb_build_object(
    'rev', st.rev,
    'version', st.data -> 'version',
    'settings', jsonb_build_object(
      'company',  st.data -> 'settings' -> 'company',
      'city',     st.data -> 'settings' -> 'city',
      'currency', st.data -> 'settings' -> 'currency'),
    'stores', coalesce((select jsonb_agg(s - 'stripeAccount') from jsonb_array_elements(st.data -> 'stores') s), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(p - 'cost' - 'minStock' - 'reorderPoint' - 'weightOz')
      from jsonb_array_elements(st.data -> 'products') p
      where coalesce((p ->> 'active')::boolean, false)), '[]'::jsonb)
  ) end
  from public.app_state st where st.id = 1
$$;

-- ---------- Equipo (solo administradores) ----------
create or replace function public.list_staff() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('email', s.email, 'name', s.name, 'role', s.role, 'created_at', s.created_at) order by s.created_at)
                   from public.staff s), '[]'::jsonb);
end $$;

create or replace function public.upsert_staff(p_email text, p_name text, p_role text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare e text := lower(trim(p_email));
begin
  perform public.require_admin();
  if coalesce(e, '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email' using errcode = '22023'; end if;
  if coalesce(p_role, '') not in ('admin', 'staff') then raise exception 'invalid_role' using errcode = '22023'; end if;
  if p_role = 'staff' and exists (select 1 from public.staff where email = e and role = 'admin')
     and (select count(*) from public.staff where role = 'admin') = 1 then
    raise exception 'last_admin' using errcode = '22023';
  end if;
  insert into public.staff (email, name, role) values (e, coalesce(trim(p_name), ''), p_role)
  on conflict (email) do update set name = excluded.name, role = excluded.role;
  return public.list_staff();
end $$;

create or replace function public.remove_staff(p_email text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare e text := lower(trim(p_email));
begin
  perform public.require_admin();
  if e = public.current_email() then raise exception 'cannot_remove_self' using errcode = '22023'; end if;
  if exists (select 1 from public.staff where email = e and role = 'admin')
     and (select count(*) from public.staff where role = 'admin') = 1 then
    raise exception 'last_admin' using errcode = '22023';
  end if;
  delete from public.staff where email = e;
  return public.list_staff();
end $$;

-- ---------- Copias de seguridad (solo administradores) ----------
create or replace function public.list_history() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'rev', h.rev, 'saved_at', h.saved_at, 'saved_by', h.saved_by) order by h.id desc)
                   from (select * from public.app_state_history order by id desc limit 30) h), '[]'::jsonb);
end $$;

-- Vuelve a una versión anterior. La actual también queda guardada en el historial.
create or replace function public.restore_state(p_history_id bigint) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare old jsonb; cur bigint;
begin
  perform public.require_admin();
  select data into old from public.app_state_history where id = p_history_id;
  if old is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  select rev into cur from public.app_state where id = 1;
  return public.save_state(cur, old);
end $$;

-- ---------- Permisos: nada por defecto, solo lo necesario ----------
revoke execute on function
  public.current_email(), public.staff_role(), public.require_staff(), public.require_admin(),
  public.whoami(), public.load_state(), public.load_state_if_newer(bigint), public.save_state(bigint, jsonb),
  public.public_catalog(), public.list_staff(), public.upsert_staff(text, text, text), public.remove_staff(text),
  public.list_history(), public.restore_state(bigint)
from public, anon, authenticated;

grant execute on function public.public_catalog() to anon, authenticated;
grant execute on function
  public.whoami(), public.load_state(), public.load_state_if_newer(bigint), public.save_state(bigint, jsonb),
  public.list_staff(), public.upsert_staff(text, text, text), public.remove_staff(text),
  public.list_history(), public.restore_state(bigint)
to authenticated;

-- ---------- Primer administrador ----------
-- La cuenta compartida de la empresa. Desde el panel se agregan los demás.
insert into public.staff (email, name, role)
values ('juventuspreacademymiami@gmail.com', 'Soccer Cage', 'admin')
on conflict (email) do nothing;
