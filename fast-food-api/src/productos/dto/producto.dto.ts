export class CreateProductoDto {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  disponible: boolean;
}

export class UpdateProductoDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoria?: string;
  disponible?: boolean;
}
