package com.verdesazon.api.application.port.out;

import com.verdesazon.api.application.command.CreateProductoCommand;
import com.verdesazon.api.application.command.UpdateProductoCommand;
import com.verdesazon.api.domain.model.Producto;
import java.util.List;
import java.util.Optional;

public interface ProductoRepositoryPort {
    List<Producto> findAll();

    Optional<Producto> findById(String id);

    Producto create(CreateProductoCommand command);

    Producto update(String id, UpdateProductoCommand command);

    void delete(String id);
}

