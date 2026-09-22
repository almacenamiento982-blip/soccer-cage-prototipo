/* ============================================================
   SOCCER CAGE — Datos semilla del prototipo
   Empresa ficticia de confección y venta de uniformes (Miami, FL)

   MODELO DE DATOS
   Producto (padre)  →  Variantes (hijas)
   El STOCK VIVE EN LA VARIANTE, nunca en el producto.
   Esta es la decisión estructural más importante del sistema:
   "Camiseta Halcones talla M / Azul" es la unidad real de inventario.
   ============================================================ */

const SEED = {};

/* ---------- Catálogos ---------- */
SEED.categories = [
  { id: 'uniformes',   name: 'Uniformes completos' },
  { id: 'camisetas',   name: 'Camisetas' },
  { id: 'pantalones',  name: 'Pantalonetas' },
  { id: 'medias',      name: 'Medias' },
  { id: 'chaquetas',   name: 'Chaquetas' },
  { id: 'sudaderas',   name: 'Sudaderas' },
  { id: 'accesorios',  name: 'Accesorios' },
  { id: 'personalizado', name: 'Personalizados' }
];

SEED.sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

SEED.colorMap = {
  'Negro':    '#16181d',
  'Blanco':   '#f2f3f5',
  'Dorado':   '#c9a227',
  'Azul Rey': '#1e40af',
  'Rojo':     '#b3261e',
  'Verde':    '#0f7b52',
  'Gris':     '#6b7280',
  'Naranja':  '#d97706',
  'Celeste':  '#38bdf8',
  'Vinotinto':'#6d1220'
};

/* Usuarios del panel (roles) */
SEED.users = [
  { id: 'u1', name: 'Carlos Méndez',  email: 'carlos@soccercage.com', role: 'Administrador', initials: 'CM' },
  { id: 'u2', name: 'Andrea Rivas',   email: 'andrea@soccercage.com', role: 'Inventario',    initials: 'AR' },
  { id: 'u3', name: 'Luis Ortega',    email: 'luis@soccercage.com',   role: 'Ventas',        initials: 'LO' },
  { id: 'sys',name: 'Sistema',        email: 'automatico',            role: 'Automático',    initials: 'SY' }
];

/* ---------- Helpers de construcción ---------- */
let _vseq = 1;

/**
 * Genera variantes talla × color.
 * qtyMatrix: { 'Color': [qtyXS, qtyS, qtyM, qtyL, qtyXL, qtyXXL] }
 * Un null significa que esa combinación no se fabrica (no existe la variante).
 */
function buildVariants(skuBase, sizes, qtyMatrix, priceOverrides = {}) {
  const out = [];
  Object.keys(qtyMatrix).forEach(color => {
    const row = qtyMatrix[color];
    sizes.forEach((size, i) => {
      const qty = row[i];
      if (qty === null || qty === undefined) return;
      const colorCode = color.replace(/[^A-Za-zÁÉÍÓÚÑ]/g, '').slice(0, 3).toUpperCase();
      out.push({
        id: 'v' + (_vseq++),
        sku: `${skuBase}-${colorCode}-${size}`,
        size,
        color,
        colorHex: SEED.colorMap[color] || '#6b7280',
        stock: qty,
        reserved: 0,
        priceDelta: priceOverrides[size] || 0
      });
    });
  });
  return out;
}

/* ---------- PRODUCTOS ----------
   12 productos. Incluye deliberadamente:
   - stock sano, stock bajo y agotado total (para probar alertas)
   - un producto inactivo (no visible en tienda)
   - un producto personalizado (fabricación bajo pedido)
------------------------------------------------ */
SEED.products = [
  {
    id: 'p1',
    name: 'Uniforme Completo Halcones FC',
    sku: 'UNI-HALC',
    category: 'uniformes',
    description: 'Kit completo de local: camiseta en poliéster microperforado, pantaloneta con cintura elástica y medias altas con refuerzo. Sublimación de escudo y números incluida.',
    price: 89.00, cost: 41.50,
    minStock: 4, active: true, featured: true,
    tags: ['Más vendido'],
    variants: buildVariants('UNI-HALC', SEED.sizes, {
      'Azul Rey': [8, 14, 22, 16, 7, 3],
      'Blanco':   [5, 11, 18, 12, 6, null]
    })
  },
  {
    id: 'p2',
    name: 'Camiseta Halcones FC — Local 2026',
    sku: 'CAM-HALC-L',
    category: 'camisetas',
    description: 'Camiseta oficial de local. Tejido transpirable de 145 g/m², corte atlético y cuello reforzado. Admite dorsal y número personalizados.',
    price: 42.00, cost: 17.80,
    minStock: 5, active: true, featured: true,
    tags: [],
    variants: buildVariants('CAM-HALC-L', SEED.sizes, {
      'Azul Rey': [10, 20, 15, 8, 3, 2],   // el ejemplo del enunciado
      'Blanco':   [6, 12, 9, 14, 5, null]
    })
  },
  {
    id: 'p3',
    name: 'Camiseta Halcones FC — Visitante 2026',
    sku: 'CAM-HALC-V',
    category: 'camisetas',
    description: 'Camiseta de visitante en blanco con detalles dorados. Mismo tejido técnico de la línea local.',
    price: 42.00, cost: 17.80,
    minStock: 6, active: true, featured: false,
    tags: [],
    variants: buildVariants('CAM-HALC-V', SEED.sizes, {
      'Blanco': [4, 7, 3, 2, 1, null],     // stock bajo generalizado → dispara alertas
      'Dorado': [2, 5, 4, 3, null, null]
    })
  },
  {
    id: 'p4',
    name: 'Camiseta Portero Pro Shield',
    sku: 'CAM-PORT',
    category: 'camisetas',
    description: 'Camiseta de arquero con acolchado en codos y manga larga. Tejido antiabrasión para superficies sintéticas.',
    price: 54.00, cost: 24.00,
    minStock: 3, active: true, featured: false,
    tags: [],
    variants: buildVariants('CAM-PORT', SEED.sizes, {
      'Verde':   [null, 3, 6, 5, 2, null],
      'Naranja': [null, 2, 4, 4, 1, null]
    })
  },
  {
    id: 'p5',
    name: 'Pantaloneta Match Pro',
    sku: 'PAN-MTCH',
    category: 'pantalones',
    description: 'Pantaloneta de competición con cintura elástica interna y bolsillo oculto. Secado rápido.',
    price: 26.00, cost: 9.40,
    minStock: 8, active: true, featured: false,
    tags: [],
    variants: buildVariants('PAN-MTCH', SEED.sizes, {
      'Negro':    [12, 26, 34, 28, 14, 6],
      'Azul Rey': [8, 18, 24, 19, 9, null],
      'Blanco':   [6, 14, 17, 12, 5, null]
    })
  },
  {
    id: 'p6',
    name: 'Medias Altas Grip Control',
    sku: 'MED-GRIP',
    category: 'medias',
    description: 'Medias con bandas antideslizantes internas, compresión en arco y puntera reforzada. Tallaje por rango de calzado.',
    price: 14.50, cost: 4.60,
    minStock: 12, active: true, featured: false,
    tags: [],
    variants: buildVariants('MED-GRIP', ['S', 'M', 'L'], {
      'Negro':    [40, 55, 32],
      'Blanco':   [28, 44, 25],
      'Azul Rey': [22, 30, 18],
      'Rojo':     [9, 12, 7]
    })
  },
  {
    id: 'p7',
    name: 'Chaqueta Técnica Sideline',
    sku: 'CHA-SIDE',
    category: 'chaquetas',
    description: 'Chaqueta cortavientos con forro térmico ligero, capucha plegable y cierre completo. Uso en banca y entrenamiento.',
    price: 78.00, cost: 36.00,
    minStock: 3, active: true, featured: true,
    tags: [],
    variants: buildVariants('CHA-SIDE', SEED.sizes, {
      'Negro': [3, 6, 9, 7, 4, 2],
      'Gris':  [2, 4, 6, 5, 3, null]
    })
  },
  {
    id: 'p8',
    name: 'Sudadera Entrenamiento Club',
    sku: 'SUD-CLUB',
    category: 'sudaderas',
    description: 'Conjunto de sudadera en felpa francesa con puños elásticos. Bordado del escudo en pecho.',
    price: 64.00, cost: 28.50,
    minStock: 4, active: true, featured: false,
    tags: [],
    variants: buildVariants('SUD-CLUB', SEED.sizes, {
      'Negro': [4, 8, 11, 9, 5, null],
      'Gris':  [3, 5, 8, 6, 3, null]
    })
  },
  {
    id: 'p9',
    name: 'Camiseta Leones del Sur — Edición Aniversario',
    sku: 'CAM-LEON-A',
    category: 'camisetas',
    description: 'Edición conmemorativa en vinotinto con detalles dorados. Producción limitada por temporada.',
    price: 58.00, cost: 26.00,
    minStock: 5, active: true, featured: true,
    tags: ['Edición limitada'],
    variants: buildVariants('CAM-LEON-A', SEED.sizes, {
      'Vinotinto': [0, 0, 0, 0, 0, null]   // AGOTADO TOTAL → prueba de bloqueo de venta
    })
  },
  {
    id: 'p10',
    name: 'Balón Match Oficial Talla 5',
    sku: 'ACC-BAL5',
    category: 'accesorios',
    description: 'Balón termosellado talla 5, homologado para competición. Cámara de butilo y retención de aire superior.',
    price: 38.00, cost: 16.00,
    minStock: 8, active: true, featured: false,
    tags: [],
    variants: [
      { id: 'v900', sku: 'ACC-BAL5-BLA-U', size: 'Única', color: 'Blanco', colorHex: '#f2f3f5', stock: 24, reserved: 0, priceDelta: 0 },
      { id: 'v901', sku: 'ACC-BAL5-DOR-U', size: 'Única', color: 'Dorado', colorHex: '#c9a227', stock: 6,  reserved: 0, priceDelta: 4 }
    ]
  },
  {
    id: 'p11',
    name: 'Maleta Equipo Pro Kitbag',
    sku: 'ACC-MAL',
    category: 'accesorios',
    description: 'Maleta de 55 L con compartimento ventilado para botines y bandolera acolchada. Serigrafía del club opcional.',
    price: 49.00, cost: 21.00,
    minStock: 3, active: true, featured: false,
    tags: [],
    variants: [
      { id: 'v910', sku: 'ACC-MAL-NEG-U', size: 'Única', color: 'Negro',    colorHex: '#16181d', stock: 3, reserved: 0, priceDelta: 0 },
      { id: 'v911', sku: 'ACC-MAL-AZU-U', size: 'Única', color: 'Azul Rey', colorHex: '#1e40af', stock: 2, reserved: 0, priceDelta: 0 }
    ]
  },
  {
    id: 'p12',
    name: 'Uniforme Personalizado — Diseño a Medida',
    sku: 'PER-CUSTOM',
    category: 'personalizado',
    description: 'Diseño exclusivo para tu club: elección de paleta, escudo, patrocinadores y tipografía de dorsales. Pedido mínimo de 12 unidades, producción de 15 a 20 días hábiles.',
    price: 76.00, cost: 38.00,
    minStock: 0, active: true, featured: true,
    tags: ['Bajo pedido'],
    madeToOrder: true,
    variants: buildVariants('PER-CUSTOM', SEED.sizes, {
      'Negro': [99, 99, 99, 99, 99, 99]   // fabricación bajo pedido: no limita por stock físico
    })
  },
  {
    id: 'p13',
    name: 'Camiseta Halcones FC — Temporada 2024 (descatalogada)',
    sku: 'CAM-HALC-24',
    category: 'camisetas',
    description: 'Modelo de temporada anterior. Producto desactivado: permanece en el sistema por historial y trazabilidad contable.',
    price: 28.00, cost: 17.80,
    minStock: 0, active: false, featured: false,
    tags: [],
    variants: buildVariants('CAM-HALC-24', SEED.sizes, {
      'Azul Rey': [1, 2, 0, 1, 0, null]
    })
  }
];

/* ---------- Clientes ---------- */
SEED.customers = [
  { id: 'c1', name: 'Academia Miami Strikers', email: 'compras@miamistrikers.com', phone: '(305) 555-0142', city: 'Miami, FL', type: 'Club', orders: 4, spent: 3241.00, since: '2024-03-12' },
  { id: 'c2', name: 'Jorge Ramírez',           email: 'jramirez@gmail.com',        phone: '(786) 555-0198', city: 'Hialeah, FL', type: 'Particular', orders: 2, spent: 168.00, since: '2025-01-08' },
  { id: 'c3', name: 'Coral Gables United',     email: 'admin@cgunited.org',        phone: '(305) 555-0177', city: 'Coral Gables, FL', type: 'Club', orders: 6, spent: 5890.50, since: '2023-09-21' },
  { id: 'c4', name: 'Marisol Peña',            email: 'marisol.p@outlook.com',     phone: '(954) 555-0163', city: 'Doral, FL', type: 'Particular', orders: 1, spent: 89.00, since: '2026-06-02' },
  { id: 'c5', name: 'Kendall Youth League',    email: 'gear@kendallyouth.com',     phone: '(305) 555-0121', city: 'Kendall, FL', type: 'Liga', orders: 3, spent: 2470.00, since: '2024-11-14' },
  { id: 'c6', name: 'Andrés Gómez',            email: 'agomez88@yahoo.com',        phone: '(786) 555-0155', city: 'Miami Beach, FL', type: 'Particular', orders: 2, spent: 214.50, since: '2025-07-19' }
];

/* ---------- Pedidos ---------- */
SEED.orders = [
  {
    id: 'o1', number: 'SC-10241', customerId: 'c3', date: '2026-09-19T09:14:00',
    status: 'pendiente', paymentStatus: 'pagado', paymentMethod: 'Stripe · Visa ···4242',
    items: [
      { productId: 'p2', variantId: null, sku: 'CAM-HALC-L-AZU-M', name: 'Camiseta Halcones FC — Local 2026', variant: 'M / Azul Rey', qty: 12, price: 42.00 },
      { productId: 'p5', variantId: null, sku: 'PAN-MTCH-NEG-M',   name: 'Pantaloneta Match Pro',             variant: 'M / Negro',    qty: 12, price: 26.00 }
    ],
    subtotal: 816.00, shipping: 0, tax: 0, total: 816.00
  },
  {
    id: 'o2', number: 'SC-10240', customerId: 'c4', date: '2026-09-19T08:02:00',
    status: 'procesando', paymentStatus: 'pagado', paymentMethod: 'Stripe · Mastercard ···8891',
    items: [
      { productId: 'p1', variantId: null, sku: 'UNI-HALC-AZU-L', name: 'Uniforme Completo Halcones FC', variant: 'L / Azul Rey', qty: 1, price: 89.00 }
    ],
    subtotal: 89.00, shipping: 0, tax: 0, total: 89.00
  },
  {
    id: 'o3', number: 'SC-10239', customerId: 'c1', date: '2026-09-18T16:40:00',
    status: 'enviado', paymentStatus: 'pagado', paymentMethod: 'PayPal',
    items: [
      { productId: 'p7', variantId: null, sku: 'CHA-SIDE-NEG-L', name: 'Chaqueta Técnica Sideline', variant: 'L / Negro', qty: 6, price: 78.00 },
      { productId: 'p6', variantId: null, sku: 'MED-GRIP-NEG-M', name: 'Medias Altas Grip Control', variant: 'M / Negro', qty: 18, price: 14.50 }
    ],
    subtotal: 729.00, shipping: 0, tax: 0, total: 729.00
  },
  {
    id: 'o4', number: 'SC-10238', customerId: 'c2', date: '2026-09-17T11:25:00',
    status: 'completado', paymentStatus: 'pagado', paymentMethod: 'Stripe · Visa ···1109',
    items: [
      { productId: 'p2', variantId: null, sku: 'CAM-HALC-L-BLA-S', name: 'Camiseta Halcones FC — Local 2026', variant: 'S / Blanco', qty: 2, price: 42.00 }
    ],
    subtotal: 84.00, shipping: 9.00, tax: 0, total: 93.00
  },
  {
    id: 'o5', number: 'SC-10237', customerId: 'c5', date: '2026-09-16T14:08:00',
    status: 'completado', paymentStatus: 'pagado', paymentMethod: 'Transferencia ACH',
    items: [
      { productId: 'p5', variantId: null, sku: 'PAN-MTCH-NEG-L', name: 'Pantaloneta Match Pro', variant: 'L / Negro', qty: 24, price: 26.00 },
      { productId: 'p6', variantId: null, sku: 'MED-GRIP-BLA-L', name: 'Medias Altas Grip Control', variant: 'L / Blanco', qty: 24, price: 14.50 }
    ],
    subtotal: 972.00, shipping: 0, tax: 0, total: 972.00
  },
  {
    id: 'o6', number: 'SC-10236', customerId: 'c6', date: '2026-09-15T19:33:00',
    status: 'cancelado', paymentStatus: 'reembolsado', paymentMethod: 'Stripe · Visa ···3320',
    items: [
      { productId: 'p8', variantId: null, sku: 'SUD-CLUB-NEG-M', name: 'Sudadera Entrenamiento Club', variant: 'M / Negro', qty: 1, price: 64.00 }
    ],
    subtotal: 64.00, shipping: 9.00, tax: 0, total: 73.00
  },
  {
    id: 'o7', number: 'SC-10235', customerId: 'c1', date: '2026-09-14T10:11:00',
    status: 'completado', paymentStatus: 'pagado', paymentMethod: 'Stripe · Amex ···7001',
    items: [
      { productId: 'p10', variantId: 'v900', sku: 'ACC-BAL5-BLA-U', name: 'Balón Match Oficial Talla 5', variant: 'Única / Blanco', qty: 10, price: 38.00 }
    ],
    subtotal: 380.00, shipping: 0, tax: 0, total: 380.00
  }
];

/* ---------- Movimientos de inventario (historial previo) ----------
   Cada registro responde: qué, cuánto, entrada o salida, por qué,
   cuándo, quién, y el stock ANTES y DESPUÉS. Eso es trazabilidad.
------------------------------------------------------------------ */
SEED.movements = [
  { id: 'm1',  date: '2026-09-19T09:14:22', sku: 'CAM-HALC-L-AZU-M', product: 'Camiseta Halcones FC — Local 2026', variant: 'M / Azul Rey', type: 'salida',  qty: 12, reason: 'Venta',              ref: 'SC-10241', before: 27, after: 15, user: 'Sistema' },
  { id: 'm2',  date: '2026-09-19T09:14:22', sku: 'PAN-MTCH-NEG-M',   product: 'Pantaloneta Match Pro',             variant: 'M / Negro',    type: 'salida',  qty: 12, reason: 'Venta',              ref: 'SC-10241', before: 46, after: 34, user: 'Sistema' },
  { id: 'm3',  date: '2026-09-19T08:02:10', sku: 'UNI-HALC-AZU-L',   product: 'Uniforme Completo Halcones FC',     variant: 'L / Azul Rey', type: 'salida',  qty: 1,  reason: 'Venta',              ref: 'SC-10240', before: 17, after: 16, user: 'Sistema' },
  { id: 'm4',  date: '2026-09-18T17:30:00', sku: 'CAM-HALC-L-AZU-S', product: 'Camiseta Halcones FC — Local 2026', variant: 'S / Azul Rey', type: 'entrada', qty: 20, reason: 'Producción terminada', ref: 'OP-0418',  before: 0,  after: 20, user: 'Andrea Rivas' },
  { id: 'm5',  date: '2026-09-18T16:40:55', sku: 'CHA-SIDE-NEG-L',   product: 'Chaqueta Técnica Sideline',         variant: 'L / Negro',    type: 'salida',  qty: 6,  reason: 'Venta',              ref: 'SC-10239', before: 13, after: 7,  user: 'Sistema' },
  { id: 'm6',  date: '2026-09-18T16:40:55', sku: 'MED-GRIP-NEG-M',   product: 'Medias Altas Grip Control',         variant: 'M / Negro',    type: 'salida',  qty: 18, reason: 'Venta',              ref: 'SC-10239', before: 73, after: 55, user: 'Sistema' },
  { id: 'm7',  date: '2026-09-18T11:05:00', sku: 'CAM-LEON-A-VIN-M', product: 'Camiseta Leones del Sur — Aniversario', variant: 'M / Vinotinto', type: 'salida', qty: 14, reason: 'Venta mayorista', ref: 'SC-10233', before: 14, after: 0, user: 'Luis Ortega' },
  { id: 'm8',  date: '2026-09-17T15:22:00', sku: 'CAM-HALC-V-BLA-M', product: 'Camiseta Halcones FC — Visitante',  variant: 'M / Blanco',   type: 'salida',  qty: 2,  reason: 'Merma por defecto',  ref: 'AJ-0091',  before: 5,  after: 3,  user: 'Andrea Rivas' },
  { id: 'm9',  date: '2026-09-17T11:25:33', sku: 'CAM-HALC-L-BLA-S', product: 'Camiseta Halcones FC — Local 2026', variant: 'S / Blanco',   type: 'salida',  qty: 2,  reason: 'Venta',              ref: 'SC-10238', before: 14, after: 12, user: 'Sistema' },
  { id: 'm10', date: '2026-09-16T14:08:41', sku: 'PAN-MTCH-NEG-L',   product: 'Pantaloneta Match Pro',             variant: 'L / Negro',    type: 'salida',  qty: 24, reason: 'Venta',              ref: 'SC-10237', before: 52, after: 28, user: 'Sistema' },
  { id: 'm11', date: '2026-09-16T09:00:00', sku: 'MED-GRIP-BLA-M',   product: 'Medias Altas Grip Control',         variant: 'M / Blanco',   type: 'entrada', qty: 50, reason: 'Compra a proveedor', ref: 'OC-2210',  before: 18, after: 68, user: 'Andrea Rivas' },
  { id: 'm12', date: '2026-09-15T19:33:00', sku: 'SUD-CLUB-NEG-M',   product: 'Sudadera Entrenamiento Club',       variant: 'M / Negro',    type: 'entrada', qty: 1,  reason: 'Devolución de cliente', ref: 'SC-10236', before: 10, after: 11, user: 'Luis Ortega' },
  { id: 'm13', date: '2026-09-14T10:11:09', sku: 'ACC-BAL5-BLA-U',   product: 'Balón Match Oficial Talla 5',       variant: 'Única / Blanco', type: 'salida', qty: 10, reason: 'Venta',             ref: 'SC-10235', before: 34, after: 24, user: 'Sistema' },
  { id: 'm14', date: '2026-09-13T08:45:00', sku: 'UNI-HALC-AZU-M',   product: 'Uniforme Completo Halcones FC',     variant: 'M / Azul Rey', type: 'entrada', qty: 25, reason: 'Producción terminada', ref: 'OP-0415', before: 0, after: 25, user: 'Andrea Rivas' },
  { id: 'm15', date: '2026-09-12T16:20:00', sku: 'ACC-MAL-NEG-U',    product: 'Maleta Equipo Pro Kitbag',          variant: 'Única / Negro', type: 'salida', qty: 4,  reason: 'Conteo físico (ajuste)', ref: 'AJ-0088', before: 7, after: 3, user: 'Carlos Méndez' }
];

/* Motivos de movimiento manual disponibles en el panel */
SEED.reasons = {
  entrada: ['Producción terminada', 'Compra a proveedor', 'Devolución de cliente', 'Conteo físico (ajuste)', 'Corrección de error'],
  salida:  ['Venta', 'Venta mayorista', 'Merma por defecto', 'Muestra / cortesía', 'Conteo físico (ajuste)', 'Robo o pérdida', 'Corrección de error']
};
