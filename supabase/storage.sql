-- ============================================================
-- SOCCER CAGE — Fotos de productos y logos de tiendas
--
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo
-- este archivo → Run. Se puede volver a ejecutar sin problema.
-- Requiere haber aplicado antes supabase/schema.sql.
--
-- Las fotos que se suben desde el panel se reducen en el navegador
-- (600 px, JPEG) y se guardan aquí, no dentro de los datos
-- compartidos. En los datos queda solo el enlace.
--   · Cualquiera puede VER las fotos (las muestra la tienda pública).
--   · Solo el equipo autorizado (tabla staff) puede SUBIR o BORRAR.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ¿La sesión actual es del equipo? (solo responde por uno mismo)
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.staff_role() is not null
$$;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

drop policy if exists "fotos: el equipo sube" on storage.objects;
create policy "fotos: el equipo sube" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and public.is_staff());

drop policy if exists "fotos: el equipo borra" on storage.objects;
create policy "fotos: el equipo borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and public.is_staff());
