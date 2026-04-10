package com.verdesazon.api.adapters.in.web;

import com.verdesazon.api.application.command.CreateProductoCommand;
import com.verdesazon.api.application.command.UpdateProductoCommand;
import com.verdesazon.api.application.port.in.ProductosUseCase;
import com.verdesazon.api.domain.model.Producto;
import com.verdesazon.api.productos.dto.CreateProductoDto;
import com.verdesazon.api.productos.dto.DeleteProductoRequest;
import com.verdesazon.api.productos.dto.UpdateProductoDto;
import com.verdesazon.api.productos.dto.UpdateProductoRequest;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/productos")
public class ProductosController {

    private final ProductosUseCase useCase;

    public ProductosController(ProductosUseCase useCase) {
        this.useCase = useCase;
    }

    @GetMapping
    public List<Producto> getAll() {
        return useCase.getAll();
    }

    @GetMapping("/{id}")
    public Producto getOne(@PathVariable String id) {
        return useCase.getOne(id);
    }

    @PostMapping
    public Producto create(@RequestBody CreateProductoDto dto) {
        return useCase.create(toCreateCommand(dto));
    }

    @PutMapping("/{id}")
    public Producto update(@PathVariable String id, @RequestBody UpdateProductoRequest body) {
        return useCase.update(id, toUpdateCommand(body == null ? null : body.getDto()));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id, @RequestBody DeleteProductoRequest body) {
        boolean eliminado = useCase.delete(id, body == null ? null : body.getNombre());
        return Map.of("eliminado", eliminado, "id", id);
    }

    private CreateProductoCommand toCreateCommand(CreateProductoDto dto) {
        if (dto == null) {
            return new CreateProductoCommand(null, null, null, null, null);
        }
        return new CreateProductoCommand(
                dto.getNombre(),
                dto.getDescripcion(),
                dto.getPrecio(),
                dto.getCategoria(),
                dto.getDisponible());
    }

    private UpdateProductoCommand toUpdateCommand(UpdateProductoDto dto) {
        if (dto == null) {
            return new UpdateProductoCommand(null, null, null, null, null);
        }
        return new UpdateProductoCommand(
                dto.getNombre(),
                dto.getDescripcion(),
                dto.getPrecio(),
                dto.getCategoria(),
                dto.getDisponible());
    }
}
