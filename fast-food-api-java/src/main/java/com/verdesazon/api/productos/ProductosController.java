package com.verdesazon.api.productos;

import com.verdesazon.api.productos.dto.CreateProductoDto;
import com.verdesazon.api.productos.dto.DeleteProductoRequest;
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

    private final ProductosService service;

    public ProductosController(ProductosService service) {
        this.service = service;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() throws Exception {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getOne(@PathVariable String id) throws Exception {
        return service.getOne(id);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody CreateProductoDto dto) throws Exception {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable String id, @RequestBody UpdateProductoRequest body) throws Exception {
        return service.update(id, body.getDto(), body.getOriginal());
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id, @RequestBody DeleteProductoRequest body) throws Exception {
        return service.delete(id, body.getNombre());
    }
}

