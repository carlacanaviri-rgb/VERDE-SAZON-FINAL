package com.verdesazon.api.application.port.out;

import com.verdesazon.api.clientes.PedidoAuditEntry;
import java.util.List;
import java.util.Map;

/**
 * Puerto de salida (hexagonal) para la auditoría de pedidos.
 *
 * Define el contrato que debe cumplir cualquier adaptador de persistencia
 * de auditoría (actualmente implementado por FirestorePedidoAuditAdapter).
 *
 * Colección Firestore destino: "auditoria_pedidos"
 */
public interface PedidoAuditPort {

    /**
     * Registra un evento de cambio de estado en la colección auditoria_pedidos.
     * Si ocurre un error de persistencia, el flujo principal del pedido
     * NO debe verse interrumpido.
     *
     * @param entry Evento de auditoría con todos los campos del cambio.
     */
    void registrarEvento(PedidoAuditEntry entry);

    /**
     * Devuelve todos los eventos de auditoría de un pedido específico,
     * ordenados cronológicamente.
     *
     * @param pedidoId ID del documento en la colección pedidos.
     * @return Lista de mapas con los datos crudos de Firestore.
     */
    List<Map<String, Object>> buscarPorPedidoId(String pedidoId);

    /**
     * Devuelve eventos de auditoría cuyo clienteNombre contenga el texto
     * indicado (búsqueda case-insensitive aproximada).
     *
     * @param nombreCliente Texto parcial o completo del nombre del cliente.
     * @return Lista de mapas con los datos crudos de Firestore.
     */
    List<Map<String, Object>> buscarPorNombreCliente(String nombreCliente);

    /**
     * Devuelve todos los registros de auditoría, ordenados por timestamp
     * descendente. Limitado a los últimos 200 registros.
     *
     * @return Lista de mapas con los datos crudos de Firestore.
     */
    List<Map<String, Object>> obtenerTodos();
}
