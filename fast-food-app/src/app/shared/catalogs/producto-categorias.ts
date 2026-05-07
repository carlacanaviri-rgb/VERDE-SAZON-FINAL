export const PRODUCTO_CATEGORIAS_FALLBACK = [
  'Ensalada',
  'Plato Fuerte',
  'Version Vegetariana',
  'Sopas',
  'Smoothies',
  'Bebidas',
  'Postres',
  'Bowls',
  'Wraps',
  'Snacks',
  'Hamburguesas',
  'Pizza'
] as const;

const CATEGORIAS_POR_ALIAS = new Map<string, string>([
  ['ensalada', 'Ensalada'],
  ['ensaladas', 'Ensalada'],
  ['plato fuerte', 'Plato Fuerte'],
  ['platos fuertes', 'Plato Fuerte'],
  ['version vegetariana', 'Version Vegetariana'],
  ['vegetariano', 'Version Vegetariana'],
  ['vegetariana', 'Version Vegetariana'],
  ['sopa', 'Sopas'],
  ['sopas', 'Sopas'],
  ['smoothie', 'Smoothies'],
  ['smoothies', 'Smoothies'],
  ['bebida', 'Bebidas'],
  ['bebidas', 'Bebidas'],
  ['postre', 'Postres'],
  ['postres', 'Postres'],
  ['bowl', 'Bowls'],
  ['bowls', 'Bowls'],
  ['wrap', 'Wraps'],
  ['wraps', 'Wraps'],
  ['snack', 'Snacks'],
  ['snacks', 'Snacks'],
  ['hamburguesa', 'Hamburguesas'],
  ['hamburguesas', 'Hamburguesas'],
  ['pizza', 'Pizza'],
]);

for (const categoria of PRODUCTO_CATEGORIAS_FALLBACK) {
  CATEGORIAS_POR_ALIAS.set(normalizarClaveCategoria(categoria), categoria);
}

export function normalizarCategoriaProducto(categoria: string | null | undefined): string {
  const valor = (categoria ?? '').trim();
  if (!valor) {
    return '';
  }

  return CATEGORIAS_POR_ALIAS.get(normalizarClaveCategoria(valor)) ?? valor;
}

export function esCategoriaProductoValida(
  categoria: string | null | undefined,
  categoriasDisponibles: readonly string[] = PRODUCTO_CATEGORIAS_FALLBACK,
): boolean {
  const categoriaNormalizada = normalizarCategoriaProducto(categoria);
  if (!categoriaNormalizada) {
    return false;
  }

  return categoriasDisponibles.some(
    (opcion) => normalizarCategoriaProducto(opcion) === categoriaNormalizada,
  );
}

export function normalizarListaCategorias(categorias: readonly string[]): string[] {
  return [...new Set(categorias.map((categoria) => normalizarCategoriaProducto(categoria)).filter(Boolean))];
}

function normalizarClaveCategoria(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export {};

