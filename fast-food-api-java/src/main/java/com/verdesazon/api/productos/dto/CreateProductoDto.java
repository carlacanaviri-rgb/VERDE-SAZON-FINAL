package com.verdesazon.api.productos.dto;

import java.util.List;

public class CreateProductoDto {
    private String nombre;
    private String descripcion;
    private Double precio;
    private String categoria;
    private Boolean disponible;
    private String imagen;
    private List<String> ingredientes;
    private List<String> etiquetas;
    private Integer calorias;

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Boolean getDisponible() { return disponible; }
    public void setDisponible(Boolean disponible) { this.disponible = disponible; }

    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }

    public List<String> getIngredientes() { return ingredientes; }
    public void setIngredientes(List<String> ingredientes) { this.ingredientes = ingredientes; }

    public List<String> getEtiquetas() { return etiquetas; }
    public void setEtiquetas(List<String> etiquetas) { this.etiquetas = etiquetas; }

    public Integer getCalorias() { return calorias; }
    public void setCalorias(Integer calorias) { this.calorias = calorias; }
}
