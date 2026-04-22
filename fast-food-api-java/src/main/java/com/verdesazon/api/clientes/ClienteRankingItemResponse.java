package com.verdesazon.api.clientes;

public class ClienteRankingItemResponse {

    private final String clienteId;
    private final String nombre;
    private final String email;
    private final String clasificacion;
    private final long pedidosCompletados;
    private final double montoTotalCompletado;

    public ClienteRankingItemResponse(
            String clienteId,
            String nombre,
            String email,
            String clasificacion,
            long pedidosCompletados,
            double montoTotalCompletado) {
        this.clienteId = clienteId;
        this.nombre = nombre;
        this.email = email;
        this.clasificacion = clasificacion;
        this.pedidosCompletados = pedidosCompletados;
        this.montoTotalCompletado = montoTotalCompletado;
    }

    public String getClienteId() {
        return clienteId;
    }

    public String getNombre() {
        return nombre;
    }

    public String getEmail() {
        return email;
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

