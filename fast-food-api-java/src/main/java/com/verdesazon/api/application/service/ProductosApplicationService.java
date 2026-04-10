package com.verdesazon.api.application.service;

import com.verdesazon.api.application.command.CreateProductoCommand;
import com.verdesazon.api.application.command.UpdateProductoCommand;
import com.verdesazon.api.application.port.in.ProductosUseCase;
import com.verdesazon.api.application.port.out.AppLoggerPort;
import com.verdesazon.api.application.port.out.ProductoAuditPort;
import com.verdesazon.api.application.port.out.ProductoRepositoryPort;
import com.verdesazon.api.domain.model.Producto;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class ProductosApplicationService implements ProductosUseCase {

    private final ProductoRepositoryPort repository;
    private final ProductoAuditPort audit;
    private final AppLoggerPort logger;

    public ProductosApplicationService(
            ProductoRepositoryPort repository,
            ProductoAuditPort audit,
            AppLoggerPort logger) {
        this.repository = repository;
        this.audit = audit;
        this.logger = logger;
    }

    @Override
    public List<Producto> getAll() {
        try {
            List<Producto> productos = repository.findAll();
            logger.info("GET_ALL", "/productos", Map.of("total", productos.size()));
            return productos;
        } catch (RuntimeException e) {
            logger.error("GET_ALL", "/productos", buildErrorPayload(e));
            throw e;
        }
    }

    @Override
    public Producto getOne(String id) {
        try {
            Producto producto = repository.findById(id).orElse(null);
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("producto", producto);
            logger.info("GET_ONE", "/productos/" + id, payload);
            return producto;
        } catch (RuntimeException e) {
            logger.error("GET_ONE", "/productos/" + id, buildErrorPayload(e));
            throw e;
        }
    }

    @Override
    public Producto create(CreateProductoCommand command) {
        logger.info("CREATE", "/productos", Map.of("payload", command));
        try {
            Producto producto = repository.create(command);
            audit.registrarCambio("CREAR", producto.getId(), producto.getNombre(), toSnapshot(producto));
            logger.info("CREATE", "/productos", Map.of("id", producto.getId(), "nombre", producto.getNombre()));
            return producto;
        } catch (RuntimeException e) {
            Map<String, Object> payload = buildErrorPayload(e);
            payload.put("payload", command);
            logger.error("CREATE", "/productos", payload);
            throw e;
        }
    }

    @Override
    public Producto update(String id, UpdateProductoCommand command) {
        logger.info("UPDATE", "/productos/" + id, Map.of("payload", command));
        try {
            Producto original = repository.findById(id).orElse(null);
            Producto updated = repository.update(id, command);

            Map<String, Object> cambios = new LinkedHashMap<>();
            Map<String, Object> anteriores = new LinkedHashMap<>();
            if (original != null) {
                trackIfChanged("nombre", original.getNombre(), updated.getNombre(), cambios, anteriores);
                trackIfChanged("descripcion", original.getDescripcion(), updated.getDescripcion(), cambios, anteriores);
                trackIfChanged("precio", original.getPrecio(), updated.getPrecio(), cambios, anteriores);
                trackIfChanged("categoria", original.getCategoria(), updated.getCategoria(), cambios, anteriores);
                trackIfChanged("disponible", original.getDisponible(), updated.getDisponible(), cambios, anteriores);
            }

            String nombreLog = updated.getNombre() != null ? updated.getNombre() : id;
            Map<String, Object> snapshot = new LinkedHashMap<>();
            snapshot.put("cambios", cambios);
            snapshot.put("anteriores", anteriores);
            audit.registrarCambio("EDITAR", id, nombreLog, snapshot);
            logger.info("UPDATE", "/productos/" + id, snapshot);
            return updated;
        } catch (RuntimeException e) {
            Map<String, Object> payload = buildErrorPayload(e);
            payload.put("payload", command);
            logger.error("UPDATE", "/productos/" + id, payload);
            throw e;
        }
    }

    @Override
    public boolean delete(String id, String nombre) {
        Map<String, Object> deletePayload = new LinkedHashMap<>();
        deletePayload.put("id", id);
        deletePayload.put("nombre", nombre);
        logger.info("DELETE", "/productos/" + id, deletePayload);
        try {
            Producto producto = repository.findById(id).orElse(null);
            repository.delete(id);

            String nombreLog = nombre;
            if ((nombreLog == null || nombreLog.isBlank()) && producto != null) {
                nombreLog = producto.getNombre();
            }
            audit.registrarCambio("ELIMINAR", id, nombreLog == null ? id : nombreLog, toSnapshot(producto));

            Map<String, Object> resultPayload = new LinkedHashMap<>();
            resultPayload.put("eliminado", true);
            resultPayload.put("nombre", nombreLog);
            logger.info("DELETE", "/productos/" + id, resultPayload);
            return true;
        } catch (RuntimeException e) {
            Map<String, Object> payload = buildErrorPayload(e);
            payload.put("id", id);
            payload.put("nombre", nombre);
            logger.error("DELETE", "/productos/" + id, payload);
            throw e;
        }
    }

    private void trackIfChanged(
            String field,
            Object original,
            Object updated,
            Map<String, Object> cambios,
            Map<String, Object> anteriores) {
        if (!Objects.equals(original, updated)) {
            cambios.put(field, updated);
            anteriores.put(field, original);
        }
    }

    private Map<String, Object> buildErrorPayload(RuntimeException e) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("error", e.getMessage());
        return payload;
    }

    private Map<String, Object> toSnapshot(Producto producto) {
        if (producto == null) {
            return Map.of();
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", producto.getId());
        payload.put("nombre", producto.getNombre());
        payload.put("descripcion", producto.getDescripcion());
        payload.put("precio", producto.getPrecio());
        payload.put("categoria", producto.getCategoria());
        payload.put("disponible", producto.getDisponible());
        payload.put("creadoEn", producto.getCreadoEn());
        return payload;
    }
}
