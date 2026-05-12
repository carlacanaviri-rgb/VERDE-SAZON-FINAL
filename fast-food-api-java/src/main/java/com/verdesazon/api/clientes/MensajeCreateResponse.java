package com.verdesazon.api.clientes;

public class MensajeCreateResponse {
    private String id;
    private String pedidoId;
    private String timestamp;
    private String estado;

    public MensajeCreateResponse() {
    }

    public MensajeCreateResponse(String id, String pedidoId, String timestamp, String estado) {
        this.id = id;
        this.pedidoId = pedidoId;
        this.timestamp = timestamp;
        this.estado = estado;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(String pedidoId) {
        this.pedidoId = pedidoId;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}

