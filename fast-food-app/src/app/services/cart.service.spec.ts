import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    service = new CartService();
  });

  it('agrega un producto y acumula cantidad cuando se repite', () => {
    service.addProducto({
      id: '1',
      nombre: 'Ensalada',
      descripcion: 'Fresca',
      precio: 20,
      categoria: 'Ensaladas',
      disponible: true
    });
    service.addProducto({
      id: '1',
      nombre: 'Ensalada',
      descripcion: 'Fresca',
      precio: 20,
      categoria: 'Ensaladas',
      disponible: true
    });

    expect(service.items).toHaveLength(1);
    expect(service.items[0].cantidad).toBe(2);
    expect(service.totalItems).toBe(2);
    expect(service.totalMonto).toBe(40);
  });

  it('separa carrito por usuario al cambiar de sesion', () => {
    service.setStorageOwner('user-a');
    service.addProducto({
      id: '1',
      nombre: 'Ensalada',
      descripcion: 'Fresca',
      precio: 20,
      categoria: 'Ensaladas',
      disponible: true
    });
    expect(service.totalItems).toBe(1);

    service.setStorageOwner('user-b');
    expect(service.totalItems).toBe(0);

    service.setStorageOwner('user-a');
    expect(service.totalItems).toBe(1);
  });
});

