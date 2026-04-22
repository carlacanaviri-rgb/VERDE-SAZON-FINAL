package com.verdesazon.api.pagos;

import com.verdesazon.api.clientes.PedidoCreateRequest;

public interface PaymentProvider {

    String getProviderName();

    PaymentCheckoutData crearCheckout(String pedidoId, String numeroPedido, PedidoCreateRequest request, double total);

    PaymentStatusData consultarEstadoPago(String providerPaymentId);
}

