package com.verdesazon.api.clientes;

/**
 * Representa un evento de auditoría registrado cada vez que un pedido
 * cambia de estado. Se persiste en la colección "auditoria_pedidos" de Firestore.
 *
 * Campos mapeados desde la colección "pedidos":
 *   pedidoId      → id del documento
 *   clienteId     → campo clienteId
 *   clienteNombre → campo clienteNombre
 *   clienteEmail  → campo clienteEmail
 *   creadoEn      → campo creadoEn (ISO-8601)
 */
public class PedidoAuditEntry {

    /** ID del documento en la colección pedidos. */
    private String pedidoId;

    /** Número legible del pedido (ej. VS-1776875486064). */
    private String numeroPedido;

    /** UID de Firebase del cliente. */
    private String clienteId;

    /** Nombre del cliente (campo clienteNombre del pedido). */
    private String clienteNombre;

    /** Email del cliente (campo clienteEmail del pedido). */
    private String clienteEmail;

    /**
     * Estado anterior al cambio.
     * Null únicamente en el evento inicial PEDIDO_CREADO.
     */
    private String estadoAnterior;

    /** Nuevo estado después del cambio. */
    private String estadoNuevo;

    /**
     * Email del usuario que realizó el cambio de estado.
     * Proviene del body del request (campo cambiadoPor).
     */
    private String cambiadoPor;

    /**
     * Rol del usuario que realizó el cambio.
     * Valores posibles: "admin", "cocina", "delivery", "cliente".
     */
    private String rolCambio;

    /**
     * Momento del evento en formato ISO-8601.
     * Ejemplo: "2026-04-23T22:00:00Z"
     */
    private String timestamp;

    /**
     * Segundos transcurridos desde el campo creadoEn del pedido
     * hasta este evento. Permite calcular indicadores de eficiencia.
     * -1 si no se pudo calcular.
     */
    private long tiempoDesdeCreacion;

    // ──────────────────────────────────────────────────────────────
    // Constructor vacío (requerido para deserialización)
    // ──────────────────────────────────────────────────────────────

    public PedidoAuditEntry() {}

    // ──────────────────────────────────────────────────────────────
    // Constructor completo
    // ──────────────────────────────────────────────────────────────

    public PedidoAuditEntry(
            String pedidoId,
            String numeroPedido,
            String clienteId,
            String clienteNombre,
            String clienteEmail,
            String estadoAnterior,
            String estadoNuevo,
            String cambiadoPor,
            String rolCambio,
            String timestamp,
            long tiempoDesdeCreacion) {
        this.pedidoId = pedidoId;
        this.numeroPedido = numeroPedido;
        this.clienteId = clienteId;
        this.clienteNombre = clienteNombre;
        this.clienteEmail = clienteEmail;
        this.estadoAnterior = estadoAnterior;
        this.estadoNuevo = estadoNuevo;
        this.cambiadoPor = cambiadoPor;
        this.rolCambio = rolCambio;
        this.timestamp = timestamp;
        this.tiempoDesdeCreacion = tiempoDesdeCreacion;
    }

    // ──────────────────────────────────────────────────────────────
    // Getters y Setters
    // ──────────────────────────────────────────────────────────────

    public String getPedidoId() { return pedidoId; }
    public void setPedidoId(String pedidoId) { this.pedidoId = pedidoId; }

    public String getNumeroPedido() { return numeroPedido; }
    public void setNumeroPedido(String numeroPedido) { this.numeroPedido = numeroPedido; }

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }

    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }

    public String getEstadoAnterior() { return estadoAnterior; }
    public void setEstadoAnterior(String estadoAnterior) { this.estadoAnterior = estadoAnterior; }

    public String getEstadoNuevo() { return estadoNuevo; }
    public void setEstadoNuevo(String estadoNuevo) { this.estadoNuevo = estadoNuevo; }

    public String getCambiadoPor() { return cambiadoPor; }
    public void setCambiadoPor(String cambiadoPor) { this.cambiadoPor = cambiadoPor; }

    public String getRolCambio() { return rolCambio; }
    public void setRolCambio(String rolCambio) { this.rolCambio = rolCambio; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public long getTiempoDesdeCreacion() { return tiempoDesdeCreacion; }
    public void setTiempoDesdeCreacion(long tiempoDesdeCreacion) { this.tiempoDesdeCreacion = tiempoDesdeCreacion; }
}
