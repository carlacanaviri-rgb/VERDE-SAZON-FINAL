# 📚 Verde-sason Project - README Completo

---

## Descripción General

**VerdeAdri** es una aplicación full-stack de gestión de productos y zonas de cobertura para una empresa de comida rápida saludable.

### Tecnologías Utilizadas

**Frontend:**
- Angular 18+ (Standalone API)
- TypeScript
- Firebase (Authentication + Firestore)
- RxJS (Observables)
- HttpClient (API REST)

**Backend:**
- Java 17+
- Spring Boot 3+
- Firebase Admin SDK
- Maven

**Infraestructura:**
- Firebase Console (Auth + Firestore + Storage)
- Base de datos (Backend)
- API REST (Puerto 3000)

---

## 💻 Comandos de Ejecución

### Requisitos Previos

- Node.js 18+ y npm
- Java 17+
- Maven 3.8+

### 🚀 Inicio Rápido - Desarrollo

**Opción A: Todo en un comando (recomendado)**
```bash
bash scripts/start-fullstack.sh
# Backend:  http://localhost:3000
# Frontend: http://localhost:4200
```

**Opción B: En terminales separadas**
```bash
# Terminal 1 - Backend
cd fast-food-api-java
bash scripts/start-backend.sh
# URL: http://localhost:3000

# Terminal 2 - Frontend
cd fast-food-app
bash scripts/start-frontend.sh
# URL: http://localhost:4200
```

### Frontend - Desarrollo

```bash
cd fast-food-app
bash scripts/start-frontend.sh
# URL: http://localhost:4200
# Limpia puerto 4200 automáticamente
# Usa: environment.development.ts
```

### Frontend - Producción

```bash
cd fast-food-app
npm install
ng build --configuration production
# Output: dist/fast-food-app/
# Usa: environment.development.ts
```

### Backend

```bash
cd fast-food-api-java
mvn clean install
bash scripts/start-backend.sh
# URL: http://localhost:3000
# Limpia puerto 3000 automáticamente

# Alternativa directa (sin liberar puerto automáticamente)
# mvn spring-boot:run
```

---

## 📁 Estructura de Archivos Final

```
VerdeAdri-main/
│
├── fast-food-app/ ← FRONTEND (Angular)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── login/
│   │   │   │   ├── menu/
│   │   │   │   └── productos/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── cobertura.service.ts
│   │   │   │   └── producto.service.ts
│   │   │   ├── guards/
│   │   │   │   └── auth-guard.ts
│   │   │   ├── models/
│   │   │   │   ├── producto.model.ts
│   │   │   │   └── zona-cobertura.model.ts
│   │   │   ├── app.routes.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.ts
│   │   ├── environments/ ✅ CREDENCIALES AQUÍ
│   │   │   ├── environmentDevelopment.ts (Producción)
│   │   │   └── environment.development.ts (Desarrollo)
│   │   ├── main.ts
│   │   └── index.html
│   ├── angular.json ✅ fileReplacements
│   ├── package.json
│   └── tsconfig.app.json
│
├── fast-food-api-java/ ← BACKEND (Java/Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/verdesazon/api/
│   │   │   │   ├── FastFoodApiApplication.java
│   │   │   │   ├── adapters/
│   │   │   │   ├── application/
│   │   │   │   ├── config/
│   │   │   │   ├── domain/
│   │   │   │   ├── firebase/
│   │   │   │   ├── logger/
│   │   │   │   └── productos/
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
└── README.md ← ESTE ARCHIVO
```

---

## 🏗️ Diagrama de Arquitectura

### Arquitectura General del Sistema

```
╔════════════════════════════════════════════════════════════════════════════╗
║                         VERDESAZON - ARQUITECTURA                          ║
╚════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────┐
│                    CLIENTE (ANGULAR - fast-food-app)                 │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                     Componentes Angular                       │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  - LoginComponent                                             │   │
│  │  - MenuComponent                                              │   │
│  │  - ProductosComponent                                         │   │
│  │  - Auth Guard                                                 │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                      SERVICIOS                                │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐           │   │
│  │  │   AuthService        │  │ CoberturaService     │           │   │
│  │  ├──────────────────────┤  ├──────────────────────┤           │   │
│  │  │ Firebase Auth        │  │ Firestore Realtime   │           │   │
│  │  │ Login/Logout         │  │ Zonas de Cobertura   │           │   │
│  │  │ Obtener Rol          │  │ onSnapshot()         │           │   │
│  │  └──────────────────────┘  └──────────────────────┘           │   │
│  │                                                               │   │
│  │  ┌──────────────────────┐                                     │   │
│  │  │  ProductoService     │                                     │   │
│  │  ├──────────────────────┤                                     │   │
│  │  │ API REST Backend     │                                     │   │
│  │  │ CRUD Productos       │                                     │   │
│  │  │ HttpClient           │                                     │   │
│  │  └──────────────────────┘                                     │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │              CONFIGURATION (Environment)                      │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  ng serve (Desarrollo)        ng build (Producción)           │   │
│  │      ↓                                 ↓                      │   │
│  │  environment.development.ts     environment.development.ts                │   │
│  │  production: false              production: true              │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │  firebaseConfig:                                        │  │   │
│  │  │  - apiKey                                               │  │   │
│  │  │  - authDomain                                           │  │   │
│  │  │  - projectId                                            │  │   │
│  │  │  - storageBucket                                        │  │   │
│  │  │  - messagingSenderId                                    │  │   │
│  │  │  - appId                                                │  │   │
│  │  │                                                         │  │   │
│  │  │  apiBaseUrl: 'http://localhost:3000'                    │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
    ↓                                               ↓
    │                                               │
    ├───────────────────────────────────────────────┤
    │                                               │
    ↓                                               ↓

┌──────────────────────────────────┐   ┌─────────────────────────────────┐
│     FIREBASE CONSOLE             │   │    BACKEND API (Java/Spring)    │
│ (verdesazon-92639)               │   │   (localhost:3000)              │
├──────────────────────────────────┤   ├─────────────────────────────────┤
│                                  │   │                                 │
│  📱 Authentication               │   │  ✅ Endpoint: /productos        │
│  ├─ Email/Password               │   │  ✅ Endpoint: /usuarios         │
│  ├─ Usuario actual               │   │  ✅ Endpoint: /zonas-cobertura  │
│  └─ Metadata de usuario          │   │  ✅ Endpoint: /órdenes          │
│                                  │   │                                 │
│  💾 Firestore Database           │   │  🔐 Validaciones                │
│  ├─ Collection: usuarios         │   │  ├─ Authorization               │
│  │  └─ UID                       │   │  ├─ Validación de datos         │
│  │     └─ rol (cliente/admin)    │   │  └─ Lógica de negocio           │
│  │                               │   │                                 │
│  ├─ Collection: zonas_cobertura  │   │  🗄️ Base de datos               │
│  │  └─ Información de cobertura  │   │  └─ PostgreSQL/MySQL            │
│  │                               │   │                                 │
│  └─ Collection: (otros datos)    │   │  📊 Procesamiento               │
│                                  │   │  └─ Lógica de aplicación        │
│                                  │   │                                 │
│  🪣 Storage                      │   └─────────────────────────────────┘
│  └─ Imágenes de productos        │
│                                  │
└──────────────────────────────────┘
```

### Capas

```
Presentación (Components)
    ↓
Lógica (Services)
    ↓
Configuración (Environment)
    ↓
Backend Externo (Firebase + API)
```

---

## Flujo de Datos

### Obtener Productos

```
ProductosComponent.ngOnInit()
    ↓
ProductoService.getProductos()
    ↓
HttpClient.get(`http://localhost:3000/productos`)
    ↓
Backend API
    ↓
Base de Datos
    ↓
Response JSON [{...}, {...}]
    ↓
Observable emite
    ↓
Pantalla actualiza con listado
```

### Crear Producto

```
Formulario completo
    ↓
ProductoService.addProducto(producto)
    ↓
HttpClient.post(`http://localhost:3000/productos`, producto)
    ↓
Backend API crea
    ↓
Base de Datos inserta
    ↓
Response: {id, nombre, ...}
    ↓
ProductoService emite
    ↓
Pantalla actualiza con nuevo producto
```

---

## Flujo de Autenticación y Autorización

### Login (Autenticación)

```
Usuario ingresa email/password
    ↓
AuthService.login(email, password)
    ↓
Firebase Auth.signInWithEmailAndPassword()
    ↓
    ├─ ✅ Válido → Obtiene token
    │   ↓
    │ AuthService obtiene UID
    │   ↓
    │ Consulta Firestore: usuarios/{uid}
    │   ↓
    │ Obtiene rol del usuario
    │   ↓
    │ Emite: usuarioActual$.next(user)
    │ Emite: rolActual$.next(rol)
    │   ↓
    │ LoginComponent → Navega a /menu
    │
    └─ ❌ Inválido → Error
        ↓
      usuarioActual$: null
      Muestra mensaje de error
```

### Auth Guard (Autorización)

```
Usuario accede a ruta protegida (/menu)
    ↓
Router → AuthGuard.canActivate()
    ↓
Verifica: AuthService.usuario$ observable
    ↓
    ├─ ✅ Usuario existe (user != null)
    │   ↓
    │ ALLOW (true)
    │   ↓
    │ Navega a la ruta
    │
    └─ ❌ Usuario es null
        ↓
      DENY (false)
        ↓
      Redirige a /login
```

### Roles (Jerarquía de Permisos)

```
Firestore - Collection: usuarios

{uid1}
  ├─ email: "usuario@mail.com"
  └─ rol: "cliente"
     └─ Acceso: /menu, /productos (lectura)

{uid2}
  ├─ email: "admin@mail.com"
  └─ rol: "admin"
     └─ Acceso: /menu, /productos (CRUD completo), /admin

{uid3}
  ├─ email: "gerente@mail.com"
  └─ rol: "gerente"
     └─ Acceso: /menu, /productos (lectura), /reportes
```

---

## Estructura de Carpetas Detallada

### Frontend (`fast-food-app/src/`)

```
app/
├── components/
│   ├── login/
│   │   ├── login.ts (Componente)
│   │   ├── login.html (Template)
│   │   └── login.css (Estilos)
│   │
│   ├── menu/
│   │   ├── menu.ts
│   │   ├── menu.html
│   │   └── menu.css
│   │
│   └── productos/
│       ├── productos.ts
│       ├── productos.html
│       └── productos.css
│
├── services/
│   ├── auth.service.ts
│   │   ├─ Firebase Auth (login, logout)
│   │   ├─ Firestore (obtener rol)
│   │   └─ usuario$, rol$ Observables
│   │
│   ├── cobertura.service.ts
│   │   ├─ Firestore Realtime (onSnapshot)
│   │   ├─ CRUD zonas de cobertura
│   │   └─ getZonasCobertura() Observable
│   │
│   └── producto.service.ts
│       ├─ API REST (getProductos, addProducto)
│       ├─ HttpClient (GET, POST, PUT, DELETE)
│       └─ Usa environmentDevelopment.apiBaseUrl
│
├── guards/
│   └── auth-guard.ts
│       └─ canActivate(route, state): boolean
│
├── models/
│   ├── producto.model.ts
│   └─ zona-cobertura.model.ts
│
├── environments/
│   ├── environment.development.ts (Producción)
│   └── environmentDevelopment.ts (Desarrollo)
│
├── app.ts (Root)
├── app.routes.ts (Rutas)
└── app.config.ts (Providers)
```

### Backend (`fast-food-api-java/src/main/java/com/verdesazon/api/`)

```
adapters/
├── in/ (Controllers REST)
│   ├── ProductoController.java
│   └── UsuarioController.java

application/
├── command/ (Use cases de escritura)
├── port/ (Interfaces)
└── service/ (Servicios de aplicación)

config/
├── FirebaseConfig.java
└── ...

domain/
├── Producto.java (Entidad)
├── Usuario.java
└── ...

firebase/
└── FirebaseService.java

logger/
└── LocalLoggerService.java

productos/ (Bounded context)
├── controller/
├── service/
├── repository/
└── dto/

FastFoodApiApplication.java (Main)
```

---

## Mapa de Dependencias

### Inyección de Dependencias

```
app.config.ts (ApplicationConfig)
├── provideRouter(routes)
├── provideHttpClient()
└── Services (providedIn: 'root')
    │
    ├── AuthService
    │   ├─ environmentDevelopment.firebaseConfig
    │   ├─ Firebase SDK
    │   └─ usuario$, rol$ Observables
    │
    ├── CoberturaService
    │   ├─ environmentDevelopment.firebaseConfig
    │   ├─ Firestore SDK
    │   └─ zonas$ Observable
    │
    └── ProductoService
        ├─ environmentDevelopment.apiBaseUrl
        └─ HttpClient
```

### Componentes e Inyecciones

```
LoginComponent
  └─ Inyecta: AuthService

MenuComponent
  ├─ Inyecta: AuthService
  └─ Inyecta: CoberturaService

ProductosComponent
  ├─ Inyecta: ProductoService
  └─ Inyecta: AuthService

AuthGuard
  ├─ Inyecta: AuthService
  └─ Inyecta: Router
```

---

## Resumen Rápido

**Stack Tecnológico**:
| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 18+, TypeScript, RxJS |
| Backend | Java 17+, Spring Boot 3+ |
| Auth | Firebase Authentication |
| Database | Firestore + PostgreSQL/MySQL |
| Storage | Firebase Storage |
| API | REST (JSON) |

**Puertos**:
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Firebase: https://console.firebase.google.com/

**Comandos Rápidos**:
```bash
# Fullstack (ambos servicios)
bash scripts/start-fullstack.sh

# Frontend solo
cd fast-food-app && bash scripts/start-frontend.sh

# Backend solo
cd fast-food-api-java && bash scripts/start-backend.sh
```

**Credenciales**:
```
Firebase Project: verdesazon-92639
Environment Prod: src/environments/environment.development.ts
Environment Dev: src/environments/environmentDevelopment.ts
```

---
