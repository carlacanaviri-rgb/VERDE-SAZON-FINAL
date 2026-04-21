package com.verdesazon.api.adapters.in.web;

import com.verdesazon.api.clientes.ClienteClasificacionService;
import com.verdesazon.api.clientes.PedidoEstadoUpdateRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pedidos")
public class PedidosController {

    private final ClienteClasificacionService clienteClasificacionService;

    public PedidosController(ClienteClasificacionService clienteClasificacionService) {
        this.clienteClasificacionService = clienteClasificacionService;
    }

    @PatchMapping("/{pedidoId}/estado")
    public Map<String, Object> actualizarEstado(
            @PathVariable String pedidoId,
            @RequestBody PedidoEstadoUpdateRequest request) {
        if (request == null || request.getEstado() == null || request.getEstado().isBlank()) {
            throw new IllegalArgumentException("El estado es requerido");
        }
        return clienteClasificacionService.actualizarEstadoPedido(pedidoId, request.getEstado().trim());
    }
}

