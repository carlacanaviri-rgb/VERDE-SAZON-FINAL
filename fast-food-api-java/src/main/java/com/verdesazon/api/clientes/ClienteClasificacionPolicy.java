package com.verdesazon.api.clientes;

import java.util.Locale;

public final class ClienteClasificacionPolicy {

    private static final int RECURRENTE_MIN_PEDIDOS = 3;
    private static final int VIP_MIN_PEDIDOS = 10;
    private static final double RECURRENTE_MIN_MONTO = 200.0;
    private static final double VIP_MIN_MONTO = 1000.0;

    private ClienteClasificacionPolicy() {
    }

    public static String clasificar(long pedidosCompletados, double montoTotalCompletado) {
        if (pedidosCompletados >= VIP_MIN_PEDIDOS || montoTotalCompletado >= VIP_MIN_MONTO) {
            return "VIP";
        }
        if (pedidosCompletados >= RECURRENTE_MIN_PEDIDOS || montoTotalCompletado >= RECURRENTE_MIN_MONTO) {
            return "Recurrente";
        }
        return "Nuevo";
    }

    public static boolean esEstadoEntregado(String estado) {
        if (estado == null || estado.isBlank()) {
            return false;
        }
        String normalizado = estado.trim().toLowerCase(Locale.ROOT);
        return "entregado".equals(normalizado);
    }
}

