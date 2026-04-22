package com.verdesazon.api.clientes;

import java.util.List;

public class PedidoCreateRequest {

    private String clienteId;
    private String clienteNombre;
    private String clienteEmail;
    private String notaGeneral;
    private Double total;
    private List<PedidoCreateItemRequest> items;

    public String getClienteId() {
        return clienteId;
    }

    public void setClienteId(String clienteId) {
        this.clienteId = clienteId;
    }

    public String getClienteNombre() {
        return clienteNombre;
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    public String getClienteEmail() {
        return clienteEmail;
    }

    public void setClienteEmail(String clienteEmail) {
        this.clienteEmail = clienteEmail;
    }

    public String getNotaGeneral() {
        return notaGeneral;
    }

    public void setNotaGeneral(String notaGeneral) {
        this.notaGeneral = notaGeneral;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public List<PedidoCreateItemRequest> getItems() {
        return items;
    }

    public void setItems(List<PedidoCreateItemRequest> items) {
        this.items = items;
    }
}

