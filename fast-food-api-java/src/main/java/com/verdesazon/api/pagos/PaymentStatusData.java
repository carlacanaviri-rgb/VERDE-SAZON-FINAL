package com.verdesazon.api.pagos;

public class PaymentStatusData {

    private final boolean aprobado;
    private final String estado;
    private final String pedidoId;
    private final String providerPaymentId;

    public PaymentStatusData(boolean aprobado, String estado, String pedidoId, String providerPaymentId) {
        this.aprobado = aprobado;
        this.estado = estado;
        this.pedidoId = pedidoId;
        this.providerPaymentId = providerPaymentId;
    }

    public boolean isAprobado() {
        return aprobado;
    }

    public String getEstado() {
        return estado;
    }

    public String getPedidoId() {
        return pedidoId;
    }

    public String getProviderPaymentId() {
        return providerPaymentId;
    }
}

