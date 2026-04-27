package com.verdesazon.api.domain.model;

import java.util.List;

public class Producto {
    private final String id;
    private final String nombre;
    private final String descripcion;
    private final Double precio;
    private final String categoria;
    private final Boolean disponible;
    private final String creadoEn;
    private final String imagen;
    private final List<String> ingredientes;

    public Producto(
            String id,
            String nombre,
            String descripcion,
            Double precio,
            String categoria,
            Boolean disponible,
            String creadoEn,
            String imagen,
            List<String> ingredientes) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.categoria = categoria;
        this.disponible = disponible;
        this.creadoEn = creadoEn;
        this.imagen = imagen;
        this.ingredientes = ingredientes != null ? ingredientes : List.of();
    }

    // Constructor de compatibilidad sin imagen/ingredientes (para tests o código legacy)
    public Producto(
            String id,
            String nombre,
            String descripcion,
            Double precio,
            String categoria,
            Boolean disponible,
            String creadoEn) {
        this(id, nombre, descripcion, precio, categoria, disponible, creadoEn, null, List.of());
    }

    public String getId()          { return id; }
    public String getNombre()      { return nombre; }
    public String getDescripcion() { return descripcion; }
    public Double getPrecio()      { return precio; }
    public String getCategoria()   { return categoria; }
    public Boolean getDisponible() { return disponible; }
    public String getCreadoEn()    { return creadoEn; }
    public String getImagen()      { return imagen; }
    public List<String> getIngredientes() { return ingredientes; }
}
