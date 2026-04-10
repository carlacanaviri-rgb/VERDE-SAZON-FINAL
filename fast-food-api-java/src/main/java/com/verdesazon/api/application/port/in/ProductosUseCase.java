package com.verdesazon.api.application.port.in;

import com.verdesazon.api.application.command.CreateProductoCommand;
import com.verdesazon.api.application.command.UpdateProductoCommand;
import com.verdesazon.api.domain.model.Producto;
import java.util.List;

public interface ProductosUseCase {
    List<Producto> getAll();

    Producto getOne(String id);

    Producto create(CreateProductoCommand command);

    Producto update(String id, UpdateProductoCommand command);

    boolean delete(String id, String nombre);
}

