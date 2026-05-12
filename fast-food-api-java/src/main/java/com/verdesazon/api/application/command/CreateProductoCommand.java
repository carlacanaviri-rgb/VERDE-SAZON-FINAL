package com.verdesazon.api.application.command;

import java.util.List;

public record CreateProductoCommand(
        String nombre,
        String descripcion,
        Double precio,
        String categoria,
        Boolean disponible,
        String imagen,
        List<String> ingredientes,
        List<String> etiquetas,
        Integer calorias) {

    // Constructor de compatibilidad con los 5 campos originales
    public CreateProductoCommand(String nombre, String descripcion, Double precio, String categoria, Boolean disponible) {
        this(nombre, descripcion, precio, categoria, disponible, null, List.of(), List.of(), null);
    }
}
