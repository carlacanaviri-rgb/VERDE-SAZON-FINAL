package com.verdesazon.api.domain.model;

public class Producto {
    private final String id;
    private final String nombre;
    private final String descripcion;
    private final Double precio;
    private final String categoria;
    private final Boolean disponible;
    private final String creadoEn;

    public Producto(
            String id,
            String nombre,
            String descripcion,
            Double precio,
            String categoria,
            Boolean disponible,
            String creadoEn) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.categoria = categoria;
        this.disponible = disponible;
        this.creadoEn = creadoEn;
    }

    public String getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public Double getPrecio() {
        return precio;
    }

    public String getCategoria() {
        return categoria;
    }

    public Boolean getDisponible() {
        return disponible;
    }

    public String getCreadoEn() {
        return creadoEn;
    }
}

