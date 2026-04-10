package com.verdesazon.api.adapters.out.firebase;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.verdesazon.api.application.command.CreateProductoCommand;
import com.verdesazon.api.application.command.UpdateProductoCommand;
import com.verdesazon.api.application.port.out.ProductoRepositoryPort;
import com.verdesazon.api.domain.model.Producto;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class FirestoreProductoRepositoryAdapter implements ProductoRepositoryPort {

    private final Firestore firestore;

    public FirestoreProductoRepositoryAdapter(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public List<Producto> findAll() {
        try {
            QuerySnapshot snapshot = productosCollection().get().get();
            List<Producto> productos = new ArrayList<>();
            for (DocumentSnapshot doc : snapshot.getDocuments()) {
                productos.add(fromDocument(doc));
            }
            return productos;
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo listar productos", e);
        }
    }

    @Override
    public Optional<Producto> findById(String id) {
        try {
            DocumentSnapshot doc = productosCollection().document(id).get().get();
            if (!doc.exists()) {
                return Optional.empty();
            }
            return Optional.of(fromDocument(doc));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo obtener el producto " + id, e);
        }
    }

    @Override
    public Producto create(CreateProductoCommand command) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("nombre", command.nombre());
            payload.put("descripcion", command.descripcion());
            payload.put("precio", command.precio());
            payload.put("categoria", command.categoria());
            payload.put("disponible", command.disponible());
            payload.put("creadoEn", Instant.now().toString());

            DocumentReference reference = productosCollection().add(payload).get();
            return findById(reference.getId()).orElseThrow();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo crear el producto", e);
        }
    }

    @Override
    public Producto update(String id, UpdateProductoCommand command) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            if (command.nombre() != null) {
                payload.put("nombre", command.nombre());
            }
            if (command.descripcion() != null) {
                payload.put("descripcion", command.descripcion());
            }
            if (command.precio() != null) {
                payload.put("precio", command.precio());
            }
            if (command.categoria() != null) {
                payload.put("categoria", command.categoria());
            }
            if (command.disponible() != null) {
                payload.put("disponible", command.disponible());
            }

            if (!payload.isEmpty()) {
                productosCollection().document(id).update(payload).get();
            }

            return findById(id).orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo actualizar el producto " + id, e);
        }
    }

    @Override
    public void delete(String id) {
        try {
            productosCollection().document(id).delete().get();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo eliminar el producto " + id, e);
        }
    }

    private CollectionReference productosCollection() {
        return firestore.collection("productos");
    }

    private Producto fromDocument(DocumentSnapshot doc) {
        String creadoEn = doc.contains("creadoEn") ? doc.getString("creadoEn") : null;
        return new Producto(
                doc.getId(),
                doc.getString("nombre"),
                doc.getString("descripcion"),
                doc.getDouble("precio"),
                doc.getString("categoria"),
                doc.getBoolean("disponible"),
                creadoEn);
    }
}

