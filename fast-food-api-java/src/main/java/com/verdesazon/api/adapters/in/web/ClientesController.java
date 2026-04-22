package com.verdesazon.api.adapters.in.web;

import com.verdesazon.api.clientes.ClienteClasificacionService;
import com.verdesazon.api.clientes.ClientePerfilResponse;
import com.verdesazon.api.clientes.ClienteRankingItemResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/clientes")
public class ClientesController {

    private final ClienteClasificacionService clienteClasificacionService;

    public ClientesController(ClienteClasificacionService clienteClasificacionService) {
        this.clienteClasificacionService = clienteClasificacionService;
    }

    @GetMapping("/{clienteId}/perfil")
    public ClientePerfilResponse getPerfil(@PathVariable String clienteId) {
        return clienteClasificacionService.obtenerPerfilCliente(clienteId);
    }

    @GetMapping("/ranking")
    public List<ClienteRankingItemResponse> getRanking(@RequestParam(defaultValue = "10") int limit) {
        return clienteClasificacionService.obtenerRankingTopClientes(limit);
    }
}

