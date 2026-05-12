package com.verdesazon.api.clientes;

public class MensajeCreateRequest {
    private String pedidoId;
    private String autorId;
    private String autorNombre;
    private String rol;
    private String contenido;

    public String getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(String pedidoId) {
        this.pedidoId = pedidoId;
    }

    public String getAutorId() {
        return autorId;
    }

    public void setAutorId(String autorId) {
        this.autorId = autorId;
    }

    public String getAutorNombre() {
        return autorNombre;
    }

    public void setAutorNombre(String autorNombre) {
        this.autorNombre = autorNombre;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public String getContenido() {
        return contenido;
    }

    public void setContenido(String contenido) {
        this.contenido = contenido;
    }
}

