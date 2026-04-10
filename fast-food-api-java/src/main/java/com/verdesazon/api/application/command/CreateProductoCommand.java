package com.verdesazon.api.application.command;

public record CreateProductoCommand(
        String nombre,
        String descripcion,
        Double precio,
        String categoria,
        Boolean disponible) {}

