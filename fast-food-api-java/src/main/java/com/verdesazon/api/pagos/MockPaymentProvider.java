package com.verdesazon.api.pagos;

import com.verdesazon.api.clientes.PedidoCreateRequest;

public class MockPaymentProvider implements PaymentProvider {

    @Override
    public String getProviderName() {
        return "mock";
    }

    @Override
    public PaymentCheckoutData crearCheckout(String pedidoId, String numeroPedido, PedidoCreateRequest request, double total) {
        String paymentUrl = "https://checkout.verdesazon.local/pagar?pedidoId=" + pedidoId;
        return new PaymentCheckoutData(
                getProviderName(),
                "MOCK-" + numeroPedido,
                paymentUrl,
                paymentUrl
        );
    }

    @Override
    public PaymentStatusData consultarEstadoPago(String providerPaymentId) {
        boolean aprobado = providerPaymentId != null && providerPaymentId.startsWith("ok-");
        return new PaymentStatusData(aprobado, aprobado ? "approved" : "pending", null, providerPaymentId);
    }
}


