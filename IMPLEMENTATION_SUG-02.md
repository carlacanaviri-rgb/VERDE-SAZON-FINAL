# SUG-02: Módulo de Cocina - Canal de Comunicación Directa (Chat)

## Descripción
Implementación de un canal de comunicación bidireccional en tiempo real entre el personal de cocina y los clientes. El sistema permite consultas rápidas sobre ingredientes, preferencias y otros detalles del pedido sin interrumpir el flujo de trabajo.

## Cambios Realizados

### Frontend (Angular)

#### 1. Nuevos Modelos
- **`src/app/models/mensaje.model.ts`**: Define las interfaces para mensajes
  - `Mensaje`: Estructura de un mensaje individual
  - `ConversacionPedido`: Agrupación de mensajes por pedido
  - `CrearMensajeRequest`: Payload para crear un mensaje
  - `CrearMensajeResponse`: Respuesta del servidor

#### 2. Nuevos Servicios
- **`src/app/services/chat.service.ts`**: Servicio para manejar la comunicación
  - `getMensajes()`: Obtiene mensajes en tiempo real usando Firebase Firestore
  - `enviarMensaje()`: Envía un nuevo mensaje al servidor
  - `marcarComoLeido()`: Marca un mensaje como leído
  - `limpiarSuscripcion()`: Libera recursos de escucha

#### 3. Nuevos Componentes
- **`src/app/components/chat-modal/chat-modal.ts|html|css`**: Modal para el chat
  - Modal flotante deslizable desde la parte inferior
  - Historial de mensajes scrolleable
  - Input de texto con soporte para Enter (Shift+Enter para nueva línea)
  - Indicador visual de mensajes propios vs. de otros
  - Timestamps y nombres de remitentes

#### 4. Modificaciones Existentes
- **`src/app/components/cocina/cocina.ts`**: 
  - Importa `ChatModalComponent`
  - Agrega método `abrirChat()` para activar el modal
  - ViewChild para controlar el modal
  
- **`src/app/components/cocina/cocina.html`**:
  - Agrega icono de chat en tarjetas de "Recibidos"
  - Agrega icono de chat en tarjetas de "En preparación"
  - Integra el componente `app-chat-modal` al final

#### 5. Internacionalización
- **`public/i18n/es.json`**: Traducciones en español
  - `CHAT.TITULO`: "Chat"
  - `CHAT.SIN_MENSAJES`: "No hay mensajes aún"
  - `CHAT.PLACEHOLDER`: "Escribe tu mensaje..."

- **`public/i18n/en.json`**: Traducciones en inglés
  - `CHAT.TITULO`: "Chat"
  - `CHAT.SIN_MENSAJES`: "No messages yet"
  - `CHAT.PLACEHOLDER`: "Type your message..."

### Backend (Java + Spring Boot)

#### 1. Nuevas Clases DTO
- **`src/main/java/com/verdesazon/api/clientes/MensajeCreateRequest.java`**:
  - `pedidoId`: ID del pedido
  - `autorId`: ID del usuario que envía
  - `autorNombre`: Nombre del usuario
  - `rol`: "cocina" o "cliente"
  - `contenido`: Texto del mensaje

- **`src/main/java/com/verdesazon/api/clientes/MensajeCreateResponse.java`**:
  - `id`: ID del mensaje creado
  - `pedidoId`: ID del pedido
  - `timestamp`: Marca de tiempo
  - `estado`: "enviado"

#### 2. Modificaciones de Servicios
- **`ClienteClasificacionService.java`**:
  - `crearMensaje()`: Crea un nuevo mensaje en la colección anidada `pedidos/{pedidoId}/mensajes`
  - `marcarMensajeComoLeido()`: Actualiza el estado de un mensaje a "leído"

#### 3. Modificaciones de Controladores
- **`PedidosController.java`**:
  - `POST /pedidos/{pedidoId}/mensajes`: Crea un nuevo mensaje
  - `PATCH /pedidos/{pedidoId}/mensajes/{mensajeId}`: Marca un mensaje como leído

## Arquitectura de Datos

### Firestore Collection Structure
```
pedidos/
  {pedidoId}/
    mensajes/
      {mensajeId}/
        pedidoId: string
        autorId: string
        autorNombre: string
        rol: "cocina" | "cliente"
        contenido: string
        timestamp: ISO8601
        estado: "enviado" | "leído"
        creadoEn: ISO8601
```

## Características Implementadas

✅ **Comunicación Bidireccional en Tiempo Real**
- Chat modal flotante deslizable
- Mensajes sincronizados mediante Firebase Firestore onSnapshot()
- Actualizaciones instantáneas en ambas direcciones

✅ **Experiencia de Usuario**
- Icono de chat en cada tarjeta de pedido (columnas "Recibidos" y "En preparación")
- Modal con historial de conversación completo
- Input de texto con validación
- Indicadores visuales de emisor (propios vs. otros)
- Scroll automático al último mensaje

✅ **Internacionalización**
- Soporte en español e inglés
- Etiquetas traducibles

✅ **Validación y Seguridad**
- Validación de contenido en servidor
- Asociación de mensajes con usuario autenticado
- Timestamps automáticos en servidor

## Flujo de Uso

1. **Personal de Cocina** visualiza un pedido nuevo en "Recibidos"
2. **Hace clic en el icono de chat** en la tarjeta del pedido
3. **Se abre el modal de chat** mostrando historial previo (si existe)
4. **Escribe la consulta** (ej: "¿Sin pepinillo?")
5. **Presiona Enter** para enviar
6. **Cliente recibe notificación** (en tiempo real vía Firestore)
7. **Cliente responde** en su propia interfaz
8. **Chef recibe respuesta** en tiempo real en el modal

## Testing

Casos de prueba sugeridos:
- Crear mensaje como cocina en un pedido
- Recibir mensaje como cliente en tiempo real
- Enviar respuesta como cliente
- Ver respuesta como cocina en tiempo real
- Marcar mensajes como leídos
- Cerrar y reabrirchat sin perder historial
- Cambio de idioma en medio de conversación
- Múltiples chats paralelos (diferentes pedidos)

## Futuras Mejoras

1. **Notificaciones Push**: Integrar FCM para alertas móviles
2. **Escritura en Tiempo Real**: Indicador "escribiendo..."
3. **Adjuntos**: Soporte para imágenes/archivos
4. **Historial Persistente**: Archivar conversaciones completas
5. **Auto-respuestas**: Respuestas rápidas predefinidas para cocina
6. **Usuarios en Línea**: Indicador de disponibilidad
7. **Búsqueda de Mensajes**: En historial de conversaciones

## Rama Git
`feature/SUG-02-kitchen-chat-module`

