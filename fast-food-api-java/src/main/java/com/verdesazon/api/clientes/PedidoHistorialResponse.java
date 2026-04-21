package com.verdesazon.api.clientes;

public class PedidoHistorialResponse {

    private final String id;
    private final String numero;
    private final String estado;
    private final String hora;
    private final double total;
    private final String creadoEn;

    public PedidoHistorialResponse(String id, String numero, String estado, String hora, double total, String creadoEn) {
        this.id = id;
        this.numero = numero;
        this.estado = estado;
        this.hora = hora;
        this.total = total;
        this.creadoEn = creadoEn;
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

    public String getCreadoEn() {
        return creadoEn;
    }
}

