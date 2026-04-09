# fast-food-api-java

Migracion de modulos de `fast-food-api` (NestJS) a Java con Spring Boot.

## Modulos migrados

- `productos`: CRUD en Firestore con el mismo contrato HTTP.
- `logger`: logs locales en `logs/api.log` con endpoints:
  - `GET /logs-local?limite=50`
  - `GET /logs-local/antes-de-error`
- `firebase`: inicializacion de Firestore con `firebase-admin.json`.

## Compatibilidad de endpoints

- `GET /productos`
- `GET /productos/{id}`
- `POST /productos`
- `PUT /productos/{id}` body: `{ "dto": {...}, "original": {...} }`
- `DELETE /productos/{id}` body: `{ "nombre": "..." }`

## Configuracion de Firebase

Opciones para credenciales:

1. Archivo heredado en `../fast-food-api/src/firebase-admin.json`.
2. Propiedad `firebase.credentials.path` en `src/main/resources/application.properties`.
3. Variable de entorno `FIREBASE_ADMIN_JSON` con el JSON completo.

## Ejecutar

```bash
mvn spring-boot:run
```

La API levanta en `http://localhost:3000` para mantener compatibilidad con Angular.

## Probar rapido

```bash
mvn test
```

