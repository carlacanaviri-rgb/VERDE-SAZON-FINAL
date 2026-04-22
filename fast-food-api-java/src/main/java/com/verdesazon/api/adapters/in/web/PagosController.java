package com.verdesazon.api.adapters.in.web;

import com.verdesazon.api.pagos.PaymentWebhookService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pagos")
public class PagosController {

    private final PaymentWebhookService paymentWebhookService;

    public PagosController(PaymentWebhookService paymentWebhookService) {
        this.paymentWebhookService = paymentWebhookService;
    }

    @PostMapping("/mercadopago/webhook")
    public Map<String, Object> webhookMercadoPago(
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam Map<String, String> queryParams) {
        Map<String, Object> payload = body == null ? new LinkedHashMap<>() : body;
        return paymentWebhookService.procesarWebhookMercadoPago(payload, queryParams);
    }
}

