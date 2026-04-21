package com.verdesazon.api.clientes;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class PedidoHistorialResponseTest {

    @Test
    void exponeCamposDelHistorial() {
        PedidoHistorialResponse response = new PedidoHistorialResponse(
                "p-1",
                "VS-123",
                "pendiente",
                "14:30",
                120.0,
                "2026-04-21T14:30:00Z");

        assertEquals("p-1", response.getId());
        assertEquals("VS-123", response.getNumero());
        assertEquals("pendiente", response.getEstado());
        assertEquals(120.0, response.getTotal());
    }
}

