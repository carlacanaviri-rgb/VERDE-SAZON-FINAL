package com.verdesazon.api.clientes;

public class PagoCheckoutResponse {

    private final String proveedor;
    private final String referencia;
    private final String paymentUrl;
    private final String qrData;

    public PagoCheckoutResponse(String proveedor, String referencia, String paymentUrl, String qrData) {
        this.proveedor = proveedor;
        this.referencia = referencia;
        this.paymentUrl = paymentUrl;
        this.qrData = qrData;
    }

    public String getProveedor() {
        return proveedor;
    }

    public String getReferencia() {
        return referencia;
    }

    public String getPaymentUrl() {
        return paymentUrl;
    }

    public String getQrData() {
        return qrData;
    }
}

