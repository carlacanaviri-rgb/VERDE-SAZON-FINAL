package com.verdesazon.api.application.port.out;

public interface ProductoAuditPort {
    void registrarCambio(String accion, String idProducto, String nombreProducto, Object snapshot);
}

