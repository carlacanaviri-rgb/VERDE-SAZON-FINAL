package com.verdesazon.api.adapters.in.web;

import com.verdesazon.api.clientes.ClienteClasificacionService;
import com.verdesazon.api.clientes.PedidoCreateRequest;
import com.verdesazon.api.clientes.PedidoCreateResponse;
import com.verdesazon.api.clientes.PedidoEstadoUpdateRequest;
import com.verdesazon.api.clientes.PedidoHistorialResponse;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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

    @PostMapping
    public PedidoCreateResponse crearPedido(@RequestBody PedidoCreateRequest request) {
        return clienteClasificacionService.crearPedido(request);
    }

    @GetMapping("/cliente/{clienteId}")
    public List<PedidoHistorialResponse> getPedidosCliente(@PathVariable String clienteId) {
        return clienteClasificacionService.obtenerPedidosPorCliente(clienteId);
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

