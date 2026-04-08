import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';

@Controller('productos')
export class ProductosController {


  constructor(private readonly svc: ProductosService) {}

  @Get()
  getAll() {
    return this.svc.getAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.svc.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductoDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { dto: UpdateProductoDto, original: any }) {
    return this.svc.update(id, body.dto, body.original);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Body() body: { nombre: string }) {
    return this.svc.delete(id, body.nombre);
  }
}
