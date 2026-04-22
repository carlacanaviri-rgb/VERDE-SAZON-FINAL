package com.verdesazon.api.pagos;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(PaymentProperties.class)
public class PaymentProviderConfig {

    @Bean
    public PaymentProvider paymentProvider(PaymentProperties properties) {
        String provider = properties.getProvider() == null ? "mock" : properties.getProvider().trim().toLowerCase();
        if ("mercadopago".equals(provider)) {
            return new MercadoPagoPaymentProvider(properties);
        }
        return new MockPaymentProvider();
    }
}

