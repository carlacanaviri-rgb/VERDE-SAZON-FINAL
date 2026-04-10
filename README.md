# Verde Sazon - Proyecto Final

Documentacion unica del repositorio `VERDE-SAZON-FINAL`.

## Arquitectura

- Frontend: Angular (`src/` en la raiz).
- Backend principal: Spring Boot (`fast-food-api-java/`).
- Base de datos y auth: Firebase.

## Endpoints principales del backend

- `GET /productos`
- `GET /productos/{id}`
- `POST /productos`
- `PUT /productos/{id}` con body `{ "dto": {...}, "original": {...} }`
- `DELETE /productos/{id}` con body `{ "nombre": "..." }`
- `GET /logs-local?limite=50`
- `GET /logs-local/antes-de-error`

## Requisitos

- Node.js + npm
- Java 17+
- Maven

## Configuracion

### Frontend (`src/environments/environment.ts`)

Ajusta al menos:

- `apiBaseUrl` (por defecto `http://localhost:3000`)
- `firebaseConfig`

### Backend Java (`fast-food-api-java`)

Opciones para credenciales Firebase:

1. `firebase.credentials.path` en `fast-food-api-java/src/main/resources/application.properties`
2. Variable de entorno `FIREBASE_ADMIN_JSON`
3. Archivo heredado `../fast-food-api/src/firebase-admin.json` (si existe)

## Ejecucion local

### 1) Frontend

```bash
npm install
npm start
```

### 2) Backend Spring Boot

```bash
cd fast-food-api-java
mvn spring-boot:run
```

API en `http://localhost:3000`.

## Pruebas rapidas

```bash
npm test
cd fast-food-api-java && mvn test
```

## Deploy

Sitio publicado en:

- `https://carlacanaviri-rgb.github.io/VERDE-SAZON-FINAL/`
- `https://carlacanaviri-rgb.github.io/VERDE-SAZON-FINAL/menu`

## Equipo

- Carla Adriana Canaviri Alvarado
- Javier Alejandro Daza Torrico
- Libia Nataly Roman Arevalo
- Boris Alvaro Torrico Ramirez
