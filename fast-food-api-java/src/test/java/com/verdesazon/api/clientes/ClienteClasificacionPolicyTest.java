package com.verdesazon.api.clientes;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ClienteClasificacionPolicyTest {

    @Test
    void clasificaComoNuevoCuandoNoCumpleUmbrales() {
        assertEquals("Nuevo", ClienteClasificacionPolicy.clasificar(1, 100));
    }

    @Test
    void clasificaComoRecurrentePorFrecuencia() {
        assertEquals("Recurrente", ClienteClasificacionPolicy.clasificar(3, 50));
    }

    @Test
    void clasificaComoVipPorMonto() {
        assertEquals("VIP", ClienteClasificacionPolicy.clasificar(2, 1000));
    }

    @Test
    void identificaEstadosEntregadoCompatibles() {
        assertTrue(ClienteClasificacionPolicy.esEstadoEntregado("Entregado"));
        assertFalse(ClienteClasificacionPolicy.esEstadoEntregado("listo"));
        assertFalse(ClienteClasificacionPolicy.esEstadoEntregado("pendiente"));
    }
}

