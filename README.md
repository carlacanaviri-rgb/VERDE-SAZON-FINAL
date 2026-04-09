# 🥗 Verde Sazón - FastFoodApp (Final)

Este es el sistema central de **Verde Sazón**, construido con **Angular 17+** y **Firebase**. La aplicación gestiona tres perfiles críticos: **Clientes** (pedido), **Cocina** (preparación) y **Admin** (gestión).

<<<<<<< HEAD
---
=======
## Backend target

The `ProductoService` now consumes the Java Spring Boot API (`fast-food-api-java`) through `environment.apiBaseUrl`.

Default value:

- `http://localhost:3000`

Update this value in `src/environments/environment.ts` if your API runs on a different host/port.

## Development server
>>>>>>> ba7e2eb (feat: migrate backend modules to Spring Boot and update frontend API integration)

## 🛠️ Requisitos e Instalación Técnica

Además de **Node.js**, este proyecto depende de servicios externos que deben estar configurados:

### 1. Clonado y Dependencias

```bash
git clone https://github.com/carlacanaviri-rgb/VERDE-SAZON-FINAL.git
cd VERDE-SAZON-FINAL
npm install
```

### 2. Configuración de Firebase (Obligatorio)

El proyecto usa **Firebase Authentication** y **Firestore**. Debes crear un archivo `src/environments/environment.ts` (y su versión `.prod.ts`) con el siguiente objeto de configuración obtenido de tu consola de Firebase:

```typescript
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "TU_API_KEY",
    authDomain: "verde-sazon-id.firebaseapp.com",
    projectId: "verde-sazon-id",
    storageBucket: "verde-sazon-id.appspot.com",
    messagingSenderId: "ID_SENDER",
    appId: "ID_APP"
  },
  geoapifyApiKey: "TU_CLAVE_GEOAPIFY"
};
```

### 3. API de Mapas (Geoapify)

La validación de cobertura y el cálculo de distancias (**Sprint 3**) dependen de **Geoapify**. Sin la `geoapifyApiKey` en el environment, el buscador de direcciones no funcionará.

---

## 🚀 Ejecución del Proyecto

Puedes ver la aplicación desplegada en:  
https://carlacanaviri-rgb.github.io/VERDE-SAZON-FINAL/menu

Para ejecutarlo localmente:

```bash
ng serve
```

---

## 📂 Lo que debes saber sobre la estructura

Al navegar por el código, encontrarás:

* `src/app/core/guards`: Restricciones de acceso (roles de Admin/Cocina).
* `src/app/services`: Lógica de comunicación con Firestore (ej. `order.service.ts`).
* `src/app/modules`: Módulos divididos por perfiles. Para el **Sprint 3**, los focos son `modules/kitchen` y `modules/checkout`.

---

## 🧪 Pruebas con Vitest

Este proyecto utiliza **Vitest** en lugar de Karma para mayor velocidad en los tests:

```bash
npm test
```

---

## 👥 Desarrolladores

* Carla Adriana Cañaviri Alvarado  
* Javier Alejandro Daza Torrico  
* Libia Nataly Roman Arevalo  
* Boris Alvaro Torrico Ramirez
