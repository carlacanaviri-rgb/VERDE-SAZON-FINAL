package com.verdesazon.api.clientes;

public class PedidoCreateResponse {

    private final String id;
    private final String numero;
    private final String estado;
    private final String hora;
    private final double total;

    public PedidoCreateResponse(String id, String numero, String estado, String hora, double total) {
        this.id = id;
        this.numero = numero;
        this.estado = estado;
        this.hora = hora;
        this.total = total;
    }

    public String getId() {
        return id;
    }

    public String getNumero() {
        return numero;
    }

    public String getEstado() {
        return estado;
    }

    public String getHora() {
        return hora;
    }

    public double getTotal() {
        return total;
    }
}

