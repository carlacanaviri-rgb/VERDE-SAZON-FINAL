package com.verdesazon.api.pagos;

import com.verdesazon.api.clientes.PedidoCreateRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

public class MercadoPagoPaymentProvider implements PaymentProvider {

    private final PaymentProperties properties;
    private final RestClient restClient;

    public MercadoPagoPaymentProvider(PaymentProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.getMercadoPago().getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public String getProviderName() {
        return "mercadopago";
    }

    @Override
    public PaymentCheckoutData crearCheckout(String pedidoId, String numeroPedido, PedidoCreateRequest request, double total) {
        String token = token();

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("title", "Pedido " + numeroPedido);
        item.put("quantity", 1);
        item.put("currency_id", properties.getCurrency());
        item.put("unit_price", total);

        Map<String, Object> payer = new LinkedHashMap<>();
        payer.put("name", safe(request.getClienteNombre(), "Cliente"));
        if (StringUtils.hasText(request.getClienteEmail())) {
            payer.put("email", request.getClienteEmail().trim());
        }

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("pedidoId", pedidoId);
        metadata.put("numeroPedido", numeroPedido);
        metadata.put("clienteId", safe(request.getClienteId(), ""));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("external_reference", pedidoId);
        payload.put("items", List.of(item));
        payload.put("payer", payer);
        payload.put("metadata", metadata);

        if (StringUtils.hasText(properties.getMercadoPago().getNotificationUrl())) {
            payload.put("notification_url", properties.getMercadoPago().getNotificationUrl().trim());
        }

        Map<String, Object> response;
        try {
            response = restClient.post()
                    .uri("/checkout/preferences")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            throw new PaymentProviderException("No se pudo crear el checkout en Mercado Pago", e);
        }

        if (response == null) {
            throw new PaymentProviderException("Mercado Pago no devolvio datos del checkout.");
        }

        String preferenceId = asString(response.get("id"));
        String initPoint = properties.getMercadoPago().isSandbox()
                ? firstNotBlank(asString(response.get("sandbox_init_point")), asString(response.get("init_point")))
                : firstNotBlank(asString(response.get("init_point")), asString(response.get("sandbox_init_point")));

        if (!StringUtils.hasText(preferenceId) || !StringUtils.hasText(initPoint)) {
            throw new PaymentProviderException("Mercado Pago no devolvio preference id o init_point.");
        }

        return new PaymentCheckoutData(
                getProviderName(),
                preferenceId,
                initPoint,
                initPoint
        );
    }

    @Override
    public PaymentStatusData consultarEstadoPago(String providerPaymentId) {
        String token = token();
        Map<String, Object> response;
        try {
            response = restClient.get()
                    .uri("/v1/payments/{id}", providerPaymentId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            throw new PaymentProviderException("No se pudo consultar el estado del pago en Mercado Pago", e);
        }

        if (response == null) {
            throw new PaymentProviderException("Mercado Pago no devolvio datos del pago.");
        }

        String status = asString(response.get("status"));
        String pedidoId = asString(response.get("external_reference"));

        return new PaymentStatusData(
                "approved".equalsIgnoreCase(status),
                status,
                pedidoId,
                providerPaymentId
        );
    }

    private String token() {
        String token = properties.getMercadoPago().getAccessToken();
        if (!StringUtils.hasText(token)) {
            throw new PaymentProviderException("Falta configurar payments.mercadopago.access-token");
        }
        return token.trim();
    }

    private String safe(String value, String fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback;
        }
        return value.trim();
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String firstNotBlank(String first, String second) {
        return StringUtils.hasText(first) ? first : second;
    }
}

