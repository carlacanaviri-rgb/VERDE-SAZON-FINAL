package com.verdesazon.api.clientes;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class PedidoCreateRequestTest {

    @Test
    void conservaCamposBasicosDelPedido() {
        PedidoCreateItemRequest item = new PedidoCreateItemRequest();
        item.setNombre("Ensalada");
        item.setCantidad(2);
        item.setNota("Sin cebolla");
        item.setPrecio(30.0);

        PedidoCreateRequest request = new PedidoCreateRequest();
        request.setClienteId("cliente-1");
        request.setClienteNombre("Ana");
        request.setClienteEmail("ana@test.com");
        request.setDireccionEntrega("Calle 10 #20-30");
        request.setReferenciaEntrega("Porton verde");
        request.setZonaCobertura("Centro");
        request.setLatEntrega(4.6097);
        request.setLngEntrega(-74.0817);
        request.setNotaGeneral("Entregar rapido");
        request.setTotal(60.0);
        request.setItems(java.util.List.of(item));

        assertEquals("cliente-1", request.getClienteId());
        assertEquals("Calle 10 #20-30", request.getDireccionEntrega());
        assertEquals("Porton verde", request.getReferenciaEntrega());
        assertEquals("Centro", request.getZonaCobertura());
        assertEquals(4.6097, request.getLatEntrega());
        assertEquals(-74.0817, request.getLngEntrega());
        assertEquals(1, request.getItems().size());
        assertEquals("Ensalada", request.getItems().get(0).getNombre());
        assertEquals(60.0, request.getTotal());
    }
}

