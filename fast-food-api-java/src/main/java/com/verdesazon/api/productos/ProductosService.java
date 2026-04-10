package com.verdesazon.api.productos;

import com.verdesazon.api.application.command.CreateProductoCommand;
import com.verdesazon.api.application.command.UpdateProductoCommand;
import com.verdesazon.api.application.port.in.ProductosUseCase;
import com.verdesazon.api.domain.model.Producto;
import com.verdesazon.api.productos.dto.CreateProductoDto;
import com.verdesazon.api.productos.dto.UpdateProductoDto;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ProductosService {

    private final ProductosUseCase useCase;

    public ProductosService(ProductosUseCase useCase) {
        this.useCase = useCase;
    }

    public List<Producto> getAll() {
        return useCase.getAll();
    }

    public Producto getOne(String id) {
        return useCase.getOne(id);
    }

    public Producto create(CreateProductoDto dto) {
        return useCase.create(new CreateProductoCommand(
                dto == null ? null : dto.getNombre(),
                dto == null ? null : dto.getDescripcion(),
                dto == null ? null : dto.getPrecio(),
                dto == null ? null : dto.getCategoria(),
                dto == null ? null : dto.getDisponible()));
    }

    public Producto update(String id, UpdateProductoDto dto, Map<String, Object> ignoredOriginal) {
        return useCase.update(id, new UpdateProductoCommand(
                dto == null ? null : dto.getNombre(),
                dto == null ? null : dto.getDescripcion(),
                dto == null ? null : dto.getPrecio(),
                dto == null ? null : dto.getCategoria(),
                dto == null ? null : dto.getDisponible()));
    }

    public Map<String, Object> delete(String id, String nombre) {
        boolean eliminado = useCase.delete(id, nombre);
        return Map.of("eliminado", eliminado, "id", id);
    }
}
