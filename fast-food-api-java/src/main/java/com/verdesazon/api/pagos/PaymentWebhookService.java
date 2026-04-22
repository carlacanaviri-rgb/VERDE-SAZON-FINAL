package com.verdesazon.api.pagos;

import com.verdesazon.api.clientes.ClienteClasificacionService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class PaymentWebhookService {

    private final PaymentProvider paymentProvider;
    private final ClienteClasificacionService clienteClasificacionService;

    public PaymentWebhookService(PaymentProvider paymentProvider, ClienteClasificacionService clienteClasificacionService) {
        this.paymentProvider = paymentProvider;
        this.clienteClasificacionService = clienteClasificacionService;
    }

    public Map<String, Object> procesarWebhookMercadoPago(Map<String, Object> body, Map<String, String> queryParams) {
        String paymentId = resolverPaymentId(body, queryParams);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("provider", paymentProvider.getProviderName());
        response.put("paymentId", paymentId);

        if (!StringUtils.hasText(paymentId)) {
            response.put("processed", false);
            response.put("reason", "Evento sin payment id.");
            return response;
        }

        PaymentStatusData status = paymentProvider.consultarEstadoPago(paymentId);
        response.put("processed", true);
        response.put("paymentStatus", status.getEstado());
        response.put("pedidoId", status.getPedidoId());

        if (status.isAprobado() && StringUtils.hasText(status.getPedidoId())) {
            Map<String, Object> confirmacion = clienteClasificacionService.confirmarPagoPedido(status.getPedidoId());
            response.put("pedidoActualizado", confirmacion);
        }

        return response;
    }

    private String resolverPaymentId(Map<String, Object> body, Map<String, String> queryParams) {
        String paymentId = firstNotBlank(
                fromMap(queryParams, "data.id"),
                fromMap(queryParams, "id")
        );

        if (StringUtils.hasText(paymentId)) {
            return paymentId;
        }

        if (body == null) {
            return null;
        }

        Object dataObj = body.get("data");
        if (dataObj instanceof Map<?, ?> dataMap) {
            Object idValue = dataMap.get("id");
            if (idValue != null && StringUtils.hasText(String.valueOf(idValue))) {
                return String.valueOf(idValue);
            }
        }

        Object idValue = body.get("id");
        if (idValue != null && StringUtils.hasText(String.valueOf(idValue))) {
            return String.valueOf(idValue);
        }

        return null;
    }

    private String fromMap(Map<String, String> values, String key) {
        if (values == null) {
            return null;
        }
        String value = values.get(key);
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String firstNotBlank(String first, String second) {
        return StringUtils.hasText(first) ? first : second;
    }
}

