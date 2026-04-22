package com.verdesazon.api.clientes;

public class ClientePerfilResponse {

    private final String clienteId;
    private final String clasificacion;
    private final long pedidosCompletados;
    private final double montoTotalCompletado;

    public ClientePerfilResponse(String clienteId, String clasificacion, long pedidosCompletados, double montoTotalCompletado) {
        this.clienteId = clienteId;
        this.clasificacion = clasificacion;
        this.pedidosCompletados = pedidosCompletados;
        this.montoTotalCompletado = montoTotalCompletado;
    }

    public String getClienteId() {
        return clienteId;
    }

    public String getClasificacion() {
        return clasificacion;
    }

    public long getPedidosCompletados() {
        return pedidosCompletados;
    }

    public double getMontoTotalCompletado() {
        return montoTotalCompletado;
    }
}

