package com.verdesazon.api.clientes;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.WriteResult;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ClienteClasificacionService {

    private static final String COLECCION_PEDIDOS = "pedidos";
    private static final String COLECCION_USUARIOS = "usuarios";
    private static final DateTimeFormatter HORA_FORMATTER = DateTimeFormatter.ofPattern("HH:mm")
            .withZone(ZoneId.systemDefault());

    private final Firestore firestore;

    public ClienteClasificacionService(Firestore firestore) {
        this.firestore = firestore;
    }

    public PedidoCreateResponse crearPedido(PedidoCreateRequest request) {
        validarPedido(request);

        try {
            DocumentReference pedidoRef = firestore.collection(COLECCION_PEDIDOS).document();
            String numeroPedido = generarNumeroPedido();
            String hora = HORA_FORMATTER.format(Instant.now());
            double totalCalculado = calcularTotalPedido(request);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("numero", numeroPedido);
            payload.put("estado", "pendiente");
            payload.put("hora", hora);
            payload.put("tiempoEstimado", 20);
            payload.put("clienteId", request.getClienteId().trim());
            payload.put("clienteNombre", safeTrim(request.getClienteNombre(), "Cliente"));
            payload.put("clienteEmail", safeTrim(request.getClienteEmail(), ""));
            payload.put("cliente", Map.of(
                    "id", request.getClienteId().trim(),
                    "nombre", safeTrim(request.getClienteNombre(), "Cliente"),
                    "email", safeTrim(request.getClienteEmail(), "")));
            payload.put("notaGeneral", safeTrim(request.getNotaGeneral(), ""));
            payload.put("items", mapearItemsPedido(request.getItems()));
            payload.put("total", totalCalculado);
            payload.put("creadoEn", Instant.now().toString());

            pedidoRef.set(payload, SetOptions.merge()).get();

            return new PedidoCreateResponse(pedidoRef.getId(), numeroPedido, "pendiente", hora, totalCalculado);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo crear el pedido", e);
        }
    }

    public List<PedidoHistorialResponse> obtenerPedidosPorCliente(String clienteId) {
        if (clienteId == null || clienteId.isBlank()) {
            return List.of();
        }

        try {
            QuerySnapshot snapshot = firestore.collection(COLECCION_PEDIDOS)
                    .whereEqualTo("clienteId", clienteId.trim())
                    .get()
                    .get();

            List<PedidoHistorialResponse> pedidos = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                String numero = safeTrim(asString(doc.get("numero")), doc.getId());
                String estado = safeTrim(asString(doc.get("estado")), "pendiente");
                String hora = safeTrim(asString(doc.get("hora")), "");
                double total = extraerMontoPedido(doc.getData());
                String creadoEn = safeTrim(asString(doc.get("creadoEn")), "");
                pedidos.add(new PedidoHistorialResponse(doc.getId(), numero, estado, hora, total, creadoEn));
            }

            pedidos.sort((a, b) -> parseInstantSafe(b.getCreadoEn()).compareTo(parseInstantSafe(a.getCreadoEn())));
            return pedidos;
        } catch (Exception e) {
            throw new RuntimeException("No se pudo obtener el historial de pedidos", e);
        }
    }

    public Map<String, Object> actualizarEstadoPedido(String pedidoId, String estado) {
        try {
            DocumentReference pedidoRef = firestore.collection(COLECCION_PEDIDOS).document(pedidoId);
            DocumentSnapshot pedidoSnapshot = pedidoRef.get().get();
            if (!pedidoSnapshot.exists()) {
                throw new IllegalArgumentException("Pedido no encontrado: " + pedidoId);
            }

            WriteResult writeResult = pedidoRef.update("estado", estado).get();
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("pedidoId", pedidoId);
            response.put("estado", estado);
            response.put("actualizadoEn", writeResult.getUpdateTime().toString());

            if (ClienteClasificacionPolicy.esEstadoEntregado(estado)) {
                String clienteId = extraerClienteId(pedidoSnapshot.getData(), pedidoSnapshot.getId());
                if (clienteId != null && !clienteId.isBlank()) {
                    ClientePerfilResponse perfil = recalcularClasificacionCliente(clienteId);
                    response.put("clasificacion", perfil.getClasificacion());
                    response.put("pedidosCompletados", perfil.getPedidosCompletados());
                    response.put("montoTotalCompletado", perfil.getMontoTotalCompletado());
                }
            }

            return response;
        } catch (Exception e) {
            throw new RuntimeException("No se pudo actualizar el estado del pedido", e);
        }
    }

    public ClientePerfilResponse obtenerPerfilCliente(String clienteId) {
        try {
            DocumentSnapshot userSnapshot = firestore.collection(COLECCION_USUARIOS).document(clienteId).get().get();
            if (!userSnapshot.exists()) {
                return new ClientePerfilResponse(clienteId, "Nuevo", 0, 0);
            }

            Map<String, Object> data = userSnapshot.getData();
            long pedidosCompletados = asLong(data == null ? null : data.get("pedidosCompletados"));
            double montoTotalCompletado = asDouble(data == null ? null : data.get("montoTotalCompletado"));
            String clasificacion = asString(data == null ? null : data.get("clasificacionCliente"));
            if (clasificacion == null || clasificacion.isBlank()) {
                clasificacion = ClienteClasificacionPolicy.clasificar(pedidosCompletados, montoTotalCompletado);
            }

            return new ClientePerfilResponse(clienteId, clasificacion, pedidosCompletados, montoTotalCompletado);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo obtener el perfil del cliente", e);
        }
    }

    public List<ClienteRankingItemResponse> obtenerRankingTopClientes(int limit) {
        try {
            List<QueryDocumentSnapshot> entregados = obtenerPedidosEntregados();
            Map<String, ClienteStats> statsPorCliente = new HashMap<>();

            for (QueryDocumentSnapshot pedido : entregados) {
                String clienteId = extraerClienteId(pedido.getData(), pedido.getId());
                if (clienteId == null || clienteId.isBlank()) {
                    continue;
                }

                ClienteStats stats = statsPorCliente.computeIfAbsent(clienteId, ignored -> new ClienteStats());
                stats.pedidosCompletados++;
                stats.montoTotalCompletado += extraerMontoPedido(pedido.getData());
            }

            int max = limit <= 0 ? 10 : Math.min(limit, 50);
            return statsPorCliente.entrySet().stream()
                    .map(entry -> toRankingItem(entry.getKey(), entry.getValue()))
                    .sorted(Comparator.comparingLong(ClienteRankingItemResponse::getPedidosCompletados)
                            .reversed()
                            .thenComparing(Comparator.comparingDouble(ClienteRankingItemResponse::getMontoTotalCompletado).reversed()))
                    .limit(max)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el ranking de clientes", e);
        }
    }

    private ClientePerfilResponse recalcularClasificacionCliente(String clienteId) {
        try {
            List<QueryDocumentSnapshot> entregados = obtenerPedidosEntregados();
            long pedidosCompletados = 0;
            double montoTotalCompletado = 0;

            for (QueryDocumentSnapshot pedido : entregados) {
                String pedidoClienteId = extraerClienteId(pedido.getData(), pedido.getId());
                if (!Objects.equals(clienteId, pedidoClienteId)) {
                    continue;
                }
                pedidosCompletados++;
                montoTotalCompletado += extraerMontoPedido(pedido.getData());
            }

            String clasificacion = ClienteClasificacionPolicy.clasificar(pedidosCompletados, montoTotalCompletado);
            Map<String, Object> patch = new LinkedHashMap<>();
            patch.put("clasificacionCliente", clasificacion);
            patch.put("pedidosCompletados", pedidosCompletados);
            patch.put("montoTotalCompletado", montoTotalCompletado);
            patch.put("clasificacionActualizadaEn", Instant.now().toString());
            firestore.collection(COLECCION_USUARIOS).document(clienteId).set(patch, SetOptions.merge()).get();

            return new ClientePerfilResponse(clienteId, clasificacion, pedidosCompletados, montoTotalCompletado);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo recalcular la clasificacion del cliente " + clienteId, e);
        }
    }

    private ClienteRankingItemResponse toRankingItem(String clienteId, ClienteStats stats) {
        String nombre = "Cliente " + clienteId;
        String email = "";

        try {
            DocumentSnapshot usuario = firestore.collection(COLECCION_USUARIOS).document(clienteId).get().get();
            if (usuario.exists() && usuario.getData() != null) {
                Map<String, Object> data = usuario.getData();
                String nombreDoc = firstNotBlank(
                        asString(data.get("nombre")),
                        asString(data.get("displayName")),
                        asString(data.get("nombreCompleto")));
                String emailDoc = asString(data.get("email"));
                if (nombreDoc != null && !nombreDoc.isBlank()) {
                    nombre = nombreDoc;
                }
                if (emailDoc != null) {
                    email = emailDoc;
                }
            }
        } catch (Exception ignored) {
            // Se conserva fallback para no romper el ranking por un perfil incompleto.
        }

        String clasificacion = ClienteClasificacionPolicy.clasificar(stats.pedidosCompletados, stats.montoTotalCompletado);
        return new ClienteRankingItemResponse(
                clienteId,
                nombre,
                email,
                clasificacion,
                stats.pedidosCompletados,
                stats.montoTotalCompletado);
    }

    private List<QueryDocumentSnapshot> obtenerPedidosEntregados() throws Exception {
        QuerySnapshot snapshot = firestore.collection(COLECCION_PEDIDOS).get().get();
        List<QueryDocumentSnapshot> entregados = new ArrayList<>();
        for (QueryDocumentSnapshot pedido : snapshot.getDocuments()) {
            String estado = asString(pedido.get("estado"));
            if (ClienteClasificacionPolicy.esEstadoEntregado(estado)) {
                entregados.add(pedido);
            }
        }
        return entregados;
    }

    private String extraerClienteId(Map<String, Object> pedido, String fallbackPedidoId) {
        if (pedido == null) {
            return null;
        }

        List<String> camposDirectos = List.of("clienteId", "usuarioId", "uid", "userId", "clienteUid", "idCliente");
        for (String campo : camposDirectos) {
            String valor = asString(pedido.get(campo));
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }

        Object clienteObj = pedido.get("cliente");
        if (clienteObj instanceof Map<?, ?> clienteMap) {
            for (String campo : List.of("id", "uid", "clienteId", "usuarioId")) {
                String valor = asString(clienteMap.get(campo));
                if (valor != null && !valor.isBlank()) {
                    return valor;
                }
            }
        }

        // Compatibilidad: algunos datasets usan el mismo id de pedido y cliente para pruebas.
        Object clienteAsString = pedido.get("cliente");
        if (clienteAsString instanceof String valor && !valor.isBlank()) {
            return valor;
        }

        return fallbackPedidoId;
    }

    private double extraerMontoPedido(Map<String, Object> pedido) {
        if (pedido == null) {
            return 0;
        }

        for (String key : List.of("total", "montoTotal", "totalPedido", "importe", "subtotal")) {
            double monto = asDouble(pedido.get(key));
            if (monto > 0) {
                return monto;
            }
        }

        Object itemsObj = pedido.get("items");
        if (!(itemsObj instanceof List<?> items)) {
            return 0;
        }

        double total = 0;
        for (Object itemObj : items) {
            if (!(itemObj instanceof Map<?, ?> item)) {
                continue;
            }
            double precio = asDouble(firstNonNull(item.get("precio"), item.get("precioUnitario"), item.get("price")));
            double cantidad = asDouble(firstNonNull(item.get("cantidad"), item.get("qty"), item.get("quantity")));
            if (precio > 0 && cantidad > 0) {
                total += precio * cantidad;
            }
        }
        return total;
    }

    private void validarPedido(PedidoCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("El pedido es requerido");
        }
        if (request.getClienteId() == null || request.getClienteId().isBlank()) {
            throw new IllegalArgumentException("El clienteId es requerido");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("El pedido debe incluir al menos un item");
        }

        for (PedidoCreateItemRequest item : request.getItems()) {
            if (item == null || item.getNombre() == null || item.getNombre().isBlank()) {
                throw new IllegalArgumentException("Todos los items deben tener nombre");
            }
            if (item.getCantidad() == null || item.getCantidad() <= 0) {
                throw new IllegalArgumentException("Todos los items deben tener cantidad valida");
            }
        }
    }

    private double calcularTotalPedido(PedidoCreateRequest request) {
        double totalItems = 0;
        for (PedidoCreateItemRequest item : request.getItems()) {
            totalItems += asDouble(item.getPrecio()) * asLong(item.getCantidad());
        }
        return totalItems > 0 ? totalItems : asDouble(request.getTotal());
    }

    private List<Map<String, Object>> mapearItemsPedido(List<PedidoCreateItemRequest> items) {
        List<Map<String, Object>> payload = new ArrayList<>();
        for (PedidoCreateItemRequest item : items) {
            Map<String, Object> itemPayload = new LinkedHashMap<>();
            itemPayload.put("nombre", item.getNombre().trim());
            itemPayload.put("cantidad", item.getCantidad());
            itemPayload.put("nota", safeTrim(item.getNota(), ""));
            itemPayload.put("precio", asDouble(item.getPrecio()));
            payload.add(itemPayload);
        }
        return payload;
    }

    private String generarNumeroPedido() {
        return "VS-" + Instant.now().toEpochMilli();
    }

    private String safeTrim(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    private Instant parseInstantSafe(String value) {
        try {
            return value == null || value.isBlank() ? Instant.EPOCH : Instant.parse(value);
        } catch (Exception ignored) {
            return Instant.EPOCH;
        }
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String firstNotBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value);
    }

    private long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return 0;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null) {
            return 0;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private static class ClienteStats {
        private long pedidosCompletados;
        private double montoTotalCompletado;
    }
}

