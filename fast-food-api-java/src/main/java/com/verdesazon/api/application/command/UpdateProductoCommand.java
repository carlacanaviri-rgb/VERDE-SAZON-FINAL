package com.verdesazon.api.application.command;

public record UpdateProductoCommand(
        String nombre,
        String descripcion,
        Double precio,
        String categoria,
        Boolean disponible) {}

