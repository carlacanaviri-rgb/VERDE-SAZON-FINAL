package com.verdesazon.api.productos;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.verdesazon.api.logger.LocalLoggerService;
import com.verdesazon.api.productos.dto.CreateProductoDto;
import com.verdesazon.api.productos.dto.UpdateProductoDto;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
public class ProductosService {

    private final Firestore firestore;
    private final LocalLoggerService logger;

    public ProductosService(Firestore firestore, LocalLoggerService logger) {
        this.firestore = firestore;
        this.logger = logger;
    }

    public List<Map<String, Object>> getAll() throws Exception {
        try {
            QuerySnapshot snapshot = getProductosCollection().get().get();
            List<Map<String, Object>> productos = new ArrayList<>();
            for (DocumentSnapshot doc : snapshot.getDocuments()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", doc.getId());
                if (doc.getData() != null) {
                    item.putAll(doc.getData());
                }
                productos.add(item);
            }
            logger.log("GET_ALL", "/productos", Map.of("total", productos.size()));
            return productos;
        } catch (Exception e) {
            logger.log("GET_ALL", "/productos", Map.of("error", e.getMessage()), "ERROR");
            throw e;
        }
    }

    public Map<String, Object> getOne(String id) throws Exception {
        try {
            DocumentSnapshot doc = getProductosCollection().document(id).get().get();
            if (!doc.exists()) {
                return null;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", doc.getId());
            if (doc.getData() != null) {
                item.putAll(doc.getData());
            }
            logger.log("GET_ONE", "/productos/" + id, Map.of("producto", item));
            return item;
        } catch (Exception e) {
            logger.log("GET_ONE", "/productos/" + id, Map.of("error", e.getMessage()), "ERROR");
            throw e;
        }
    }

    public Map<String, Object> create(CreateProductoDto dto) throws Exception {
        logger.log("CREATE", "/productos", Map.of("payload", dto));
        try {
            Map<String, Object> payload = dtoToMap(dto);
            payload.put("creadoEn", Instant.now().toString());
            ApiFuture<DocumentReference> future = getProductosCollection().add(payload);
            String id = future.get().getId();

            addFirebaseLog("CREAR", id, dto.getNombre(), dtoToMap(dto));
            logger.log("CREATE", "/productos", Map.of("id", id, "nombre", dto.getNombre()));

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.putAll(dtoToMap(dto));
            return response;
        } catch (Exception e) {
            logger.log("CREATE", "/productos", Map.of("error", e.getMessage(), "payload", dto), "ERROR");
            throw e;
        }
    }

    public Map<String, Object> update(String id, UpdateProductoDto dto, Map<String, Object> original) throws Exception {
        logger.log("UPDATE", "/productos/" + id, Map.of("payload", dto, "original", original));
        try {
            Map<String, Object> updatePayload = dtoToMap(dto);
            if (!updatePayload.isEmpty()) {
                getProductosCollection().document(id).update(updatePayload).get();
            }

            Map<String, Object> cambios = new HashMap<>();
            Map<String, Object> anteriores = new HashMap<>();
            Map<String, Object> originalSafe = original == null ? Map.of() : original;
            for (Map.Entry<String, Object> entry : updatePayload.entrySet()) {
                Object oldValue = originalSafe.get(entry.getKey());
                if (!Objects.equals(entry.getValue(), oldValue)) {
                    cambios.put(entry.getKey(), entry.getValue());
                    anteriores.put(entry.getKey(), oldValue);
                }
            }

            String nombreLog = dto.getNombre() != null ? dto.getNombre() : id;
            addFirebaseLog("EDITAR", id, nombreLog, Map.of("cambios", cambios, "anteriores", anteriores));
            logger.log("UPDATE", "/productos/" + id, Map.of("cambios", cambios, "anteriores", anteriores));

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.putAll(updatePayload);
            return response;
        } catch (Exception e) {
            logger.log("UPDATE", "/productos/" + id, Map.of("error", e.getMessage(), "payload", dto), "ERROR");
            throw e;
        }
    }

    public Map<String, Object> delete(String id, String nombre) throws Exception {
        logger.log("DELETE", "/productos/" + id, Map.of("id", id, "nombre", nombre));
        try {
            Map<String, Object> doc = getOne(id);
            getProductosCollection().document(id).delete().get();
            addFirebaseLog("ELIMINAR", id, nombre, doc);
            logger.log("DELETE", "/productos/" + id, Map.of("eliminado", true, "nombre", nombre));
            return Map.of("eliminado", true, "id", id);
        } catch (Exception e) {
            logger.log("DELETE", "/productos/" + id, Map.of("error", e.getMessage(), "id", id, "nombre", nombre), "ERROR");
            throw e;
        }
    }

    private void addFirebaseLog(String accion, String id, String nombre, Object snapshot) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("accion", accion);
            payload.put("id_producto", id);
            payload.put("nombre_producto", nombre);
            payload.put("snapshot", snapshot);
            payload.put("fecha", Instant.now().toString());
            firestore.collection("logs").add(payload).get();
        } catch (Exception e) {
            logger.log("FIREBASE_LOG", "/logs", Map.of("error", e.getMessage()), "ERROR");
        }
    }

    private CollectionReference getProductosCollection() {
        return firestore.collection("productos");
    }

    private Map<String, Object> dtoToMap(CreateProductoDto dto) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("nombre", dto.getNombre());
        payload.put("descripcion", dto.getDescripcion());
        payload.put("precio", dto.getPrecio());
        payload.put("categoria", dto.getCategoria());
        payload.put("disponible", dto.getDisponible());
        return payload;
    }

    private Map<String, Object> dtoToMap(UpdateProductoDto dto) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (dto.getNombre() != null) {
            payload.put("nombre", dto.getNombre());
        }
        if (dto.getDescripcion() != null) {
            payload.put("descripcion", dto.getDescripcion());
        }
        if (dto.getPrecio() != null) {
            payload.put("precio", dto.getPrecio());
        }
        if (dto.getCategoria() != null) {
            payload.put("categoria", dto.getCategoria());
        }
        if (dto.getDisponible() != null) {
            payload.put("disponible", dto.getDisponible());
        }
        return payload;
    }
}

