package com.verdesazon.api.adapters.out.firebase;

import com.google.cloud.firestore.Firestore;
import com.verdesazon.api.application.port.out.ProductoAuditPort;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class FirestoreProductoAuditAdapter implements ProductoAuditPort {

    private final Firestore firestore;

    public FirestoreProductoAuditAdapter(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public void registrarCambio(String accion, String idProducto, String nombreProducto, Object snapshot) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("accion", accion);
            payload.put("id_producto", idProducto);
            payload.put("nombre_producto", nombreProducto);
            payload.put("snapshot", snapshot);
            payload.put("fecha", Instant.now().toString());
            firestore.collection("logs").add(payload).get();
        } catch (Exception ignored) {
            // El flujo principal no debe romperse por errores de auditoria.
        }
    }
}

