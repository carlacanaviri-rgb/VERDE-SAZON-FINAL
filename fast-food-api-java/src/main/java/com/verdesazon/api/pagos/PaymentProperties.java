package com.verdesazon.api.pagos;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "payments")
public class PaymentProperties {

    private String provider = "mock";
    private String currency = "BOB";
    private final MercadoPago mercadoPago = new MercadoPago();

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public MercadoPago getMercadoPago() {
        return mercadoPago;
    }

    public static class MercadoPago {
        private String baseUrl = "https://api.mercadopago.com";
        private String accessToken = "";
        private String notificationUrl = "";
        private boolean sandbox = true;

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getAccessToken() {
            return accessToken;
        }

        public void setAccessToken(String accessToken) {
            this.accessToken = accessToken;
        }

        public String getNotificationUrl() {
            return notificationUrl;
        }

        public void setNotificationUrl(String notificationUrl) {
            this.notificationUrl = notificationUrl;
        }

        public boolean isSandbox() {
            return sandbox;
        }

        public void setSandbox(boolean sandbox) {
            this.sandbox = sandbox;
        }
    }
}

