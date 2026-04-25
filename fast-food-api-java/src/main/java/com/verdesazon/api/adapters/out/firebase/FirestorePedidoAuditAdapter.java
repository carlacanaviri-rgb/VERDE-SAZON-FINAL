package com.verdesazon.api.adapters.out.firebase;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.verdesazon.api.application.port.out.PedidoAuditPort;
import com.verdesazon.api.clientes.PedidoAuditEntry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

/**
 * Adaptador de salida que persiste eventos de auditoría de pedidos
 * en la colección "auditoria_pedidos" de Firestore.
 *
 * Sigue el mismo patrón que FirestoreProductoAuditAdapter.
 * Los errores de escritura son silenciados para no interrumpir el flujo principal.
 */
@Component
public class FirestorePedidoAuditAdapter implements PedidoAuditPort {

    private static final String COLECCION = "auditoria_pedidos";
    private static final long TIMEOUT_SEGUNDOS = 10;
    private static final int LIMITE_CONSULTA = 200;

    private final Firestore firestore;

    public FirestorePedidoAuditAdapter(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public void registrarEvento(PedidoAuditEntry entry) {
        try {
            Map<String, Object> payload = toMap(entry);
            firestore.collection(COLECCION).add(payload).get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS);
        } catch (Exception ignored) {
            // El flujo principal del pedido NO debe romperse por errores de auditoría.
        }
    }

    @Override
    public List<Map<String, Object>> buscarPorPedidoId(String pedidoId) {
        try {
            QuerySnapshot snapshot = firestore.collection(COLECCION)
                    .whereEqualTo("pedidoId", pedidoId)
                    .orderBy("timestamp", Query.Direction.ASCENDING)
                    .get()
                    .get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS);
            return toListOfMaps(snapshot);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo consultar la auditoría del pedido " + pedidoId, e);
        }
    }

    @Override
    public List<Map<String, Object>> buscarPorNombreCliente(String nombreCliente) {
        try {
            // Firestore no tiene LIKE, usamos rango lexicográfico para búsqueda aproximada.
            String fin = nombreCliente + "\uf8ff";
            QuerySnapshot snapshot = firestore.collection(COLECCION)
                    .whereGreaterThanOrEqualTo("clienteNombre", nombreCliente)
                    .whereLessThanOrEqualTo("clienteNombre", fin)
                    .orderBy("clienteNombre")
                    .orderBy("timestamp", Query.Direction.DESCENDING)
                    .limit(LIMITE_CONSULTA)
                    .get()
                    .get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS);
            return toListOfMaps(snapshot);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo buscar auditoría por cliente: " + nombreCliente, e);
        }
    }

    @Override
    public List<Map<String, Object>> obtenerTodos() {
        try {
            QuerySnapshot snapshot = firestore.collection(COLECCION)
                    .orderBy("timestamp", Query.Direction.DESCENDING)
                    .limit(LIMITE_CONSULTA)
                    .get()
                    .get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS);
            return toListOfMaps(snapshot);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo obtener el historial de auditoría", e);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers privados
    // ──────────────────────────────────────────────────────────────

    private Map<String, Object> toMap(PedidoAuditEntry entry) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("pedidoId", entry.getPedidoId());
        map.put("numeroPedido", entry.getNumeroPedido());
        map.put("clienteId", entry.getClienteId());
        map.put("clienteNombre", entry.getClienteNombre());
        map.put("clienteEmail", entry.getClienteEmail());
        map.put("estadoAnterior", entry.getEstadoAnterior());
        map.put("estadoNuevo", entry.getEstadoNuevo());
        map.put("cambiadoPor", entry.getCambiadoPor());
        map.put("rolCambio", entry.getRolCambio());
        map.put("timestamp", entry.getTimestamp());
        map.put("tiempoDesdeCreacion", entry.getTiempoDesdeCreacion());
        return map;
    }

    private List<Map<String, Object>> toListOfMaps(QuerySnapshot snapshot) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
            Map<String, Object> data = new HashMap<>(doc.getData());
            data.put("id", doc.getId()); // incluir el id del doc para el frontend
            result.add(data);
        }
        return result;
    }
}
