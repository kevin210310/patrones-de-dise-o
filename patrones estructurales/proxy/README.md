# 🪞 Patrón Estructural: Proxy

> Provee un sustituto o placeholder para otro objeto — controla el acceso a él pudiendo agregar lógica antes y después sin que el cliente lo note.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Tipos de Proxy](#-tipos-de-proxy)
- [Componentes](#-componentes)
- [Ejemplo — Proxy de caché + Proxy de protección](#-ejemplo--proxy-de-caché--proxy-de-protección)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ejemplo adicional — Proxy virtual (Lazy Loading)](#-ejemplo-adicional--proxy-virtual-lazy-loading)
- [Proxy nativo de JavaScript](#-proxy-nativo-de-javascript)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Proxy vs otros patrones similares](#-proxy-vs-otros-patrones-similares)

---

## 📋 Descripción

El **Proxy** es un patrón de diseño **estructural** que proporciona un objeto sustituto que controla el acceso a otro objeto — el **sujeto real**. El Proxy implementa la **misma interfaz** que el sujeto, por lo que el cliente no nota la diferencia.

El Proxy intercepta las llamadas al sujeto real y puede agregar lógica antes de delegarlas, después de recibirlas, o incluso bloquearlas completamente.

> 💡 Piénsalo como un asistente personal: cuando llamas a un ejecutivo, primero hablas con su asistente. El asistente puede decirte "está ocupado" (protección), recordar lo que ya te dijo antes (caché), o conectarte directamente si eres importante (transparente al cliente).

---

## 🔥 Problema que resuelve

Sin Proxy, la lógica transversal (caché, auth, logging, lazy load) se mezcla con la lógica de negocio — o peor, se duplica en cada llamada:

```typescript
// ❌ Sin Proxy — el cliente hace todo manualmente
class UserController {
    private cache = new Map<number, User>();

    async getUser(id: number): Promise<User> {
        // Lógica de auth mezclada con lógica de negocio
        if (!currentUser.hasPermission("read:users")) throw new Error("Forbidden");

        // Lógica de caché mezclada con lógica de negocio
        if (this.cache.has(id)) return this.cache.get(id)!;

        // Lógica real
        const user = await this.userService.findById(id);
        this.cache.set(id, user);
        return user;
    }
}

// ✅ Con Proxy — el cliente llama igual, la lógica transversal está encapsulada
const userService = new AuthProxy(
    new CacheProxy(
        new RealUserService()
    ),
    currentUser
);
const user = await userService.findById(42); // transparente
```

---

## 🗺️ Diagrama

```
  CLIENTE
  Solo conoce la interfaz UserService.
  No sabe si habla con el real o con un proxy.
       │
       │ findById(42)
       ▼
┌─────────────────────┐
│  <<interface>>      │
│  UserService        │
│  + findById(id)     │
│  + create(data)     │
│  + delete(id)       │
└─────────────────────┘
         ▲
    ┌────┴─────────────────┐
    │                      │
┌───────────┐     ┌────────────────┐
│AuthProxy  │     │  CacheProxy    │
│           │     │                │
│- service  │     │- service       │
│- user     │     │- cache: Map    │
│           │     │                │
│¿tiene     │     │¿está en cache? │
│permiso?   │     │Sí → retorna    │
│No→ lanza  │     │No → delega     │
│Sí → delega│     │    y cachea    │
└─────┬─────┘     └───────┬────────┘
      │                   │
      └─────────┬─────────┘
                │ delega
                ▼
       ┌─────────────────┐
       │ RealUserService │  ← el sujeto real
       │                 │
       │ + findById(id)  │  accede a la BD
       │ + create(data)  │
       │ + delete(id)    │
       └─────────────────┘
```

---

## 🔀 Tipos de Proxy

| Tipo | Qué hace | Ejemplo |
|---|---|---|
| **Virtual** | Retrasa la creación costosa hasta que se necesita (lazy loading) | Imagen que carga solo cuando entra al viewport |
| **Protección** | Controla el acceso según permisos | Solo admins pueden llamar `delete()` |
| **Caché** | Almacena resultados para no repetir operaciones costosas | Resultados de DB cacheados en memoria |
| **Remote** | Representa un objeto en otro servidor o proceso | Stub de gRPC, cliente REST |
| **Logging** | Registra todas las llamadas al sujeto | Auditoría de accesos |
| **Smart Reference** | Realiza acciones al acceder al objeto (ref-counting, etc.) | Gestión automática de recursos |

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Subject** | Interfaz común para Proxy y RealSubject | `UserService` |
| **RealSubject** | El objeto real que hace el trabajo | `RealUserService` |
| **Proxy** | Implementa Subject, contiene referencia al RealSubject | `CacheProxy`, `AuthProxy` |
| **Client** | Opera sobre la interfaz Subject — nunca distingue Proxy de Real | `main.ts` |

---

## 🌍 Ejemplo — Proxy de caché + Proxy de protección

El escenario: un servicio de usuarios con acceso a base de datos. Se necesita caché para no golpear la BD en cada llamada, y control de acceso para que solo ciertos roles puedan ejecutar operaciones sensibles.

---

## 💻 Implementación completa

### Subject — la interfaz común

```typescript
// user-service.interface.ts
interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "editor" | "viewer";
}

interface UserService {
    findById(id: number): Promise<User>;
    findAll(): Promise<User[]>;
    create(data: Omit<User, "id">): Promise<User>;
    delete(id: number): Promise<void>;
}
```

### RealSubject — el servicio real

```typescript
// real-user.service.ts
class RealUserService implements UserService {
    // Simula una base de datos
    private db: Map<number, User> = new Map([
        [1, { id: 1, name: "Ana García",   email: "ana@mail.com",   role: "admin"  }],
        [2, { id: 2, name: "Luis Pérez",   email: "luis@mail.com",  role: "editor" }],
        [3, { id: 3, name: "Sara López",   email: "sara@mail.com",  role: "viewer" }],
    ]);
    private nextId = 4;

    async findById(id: number): Promise<User> {
        console.log(`  🗄️  [DB] SELECT * FROM users WHERE id = ${id}`);
        await this.simulateDelay(100);
        const user = this.db.get(id);
        if (!user) throw new Error(`Usuario ${id} no encontrado`);
        return user;
    }

    async findAll(): Promise<User[]> {
        console.log(`  🗄️  [DB] SELECT * FROM users`);
        await this.simulateDelay(200);
        return Array.from(this.db.values());
    }

    async create(data: Omit<User, "id">): Promise<User> {
        console.log(`  🗄️  [DB] INSERT INTO users...`);
        await this.simulateDelay(150);
        const user = { id: this.nextId++, ...data };
        this.db.set(user.id, user);
        return user;
    }

    async delete(id: number): Promise<void> {
        console.log(`  🗄️  [DB] DELETE FROM users WHERE id = ${id}`);
        await this.simulateDelay(100);
        if (!this.db.has(id)) throw new Error(`Usuario ${id} no encontrado`);
        this.db.delete(id);
    }

    private simulateDelay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

### Proxy de caché

```typescript
// proxies/cache.proxy.ts
class CacheProxy implements UserService {
    private cache     = new Map<string, { data: any; expiresAt: number }>();
    private readonly ttlMs: number;

    constructor(
        private readonly service: UserService,
        ttlMs: number = 10_000,
    ) {
        this.ttlMs = ttlMs;
    }

    private getCached<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data as T;
    }

    private setCached(key: string, data: any): void {
        this.cache.set(key, { data, expiresAt: Date.now() + this.ttlMs });
    }

    async findById(id: number): Promise<User> {
        const key    = `user:${id}`;
        const cached = this.getCached<User>(key);

        if (cached) {
            console.log(`  💾 [Cache] HIT user:${id}`);
            return cached;
        }

        console.log(`  💾 [Cache] MISS user:${id} — consultando servicio`);
        const user = await this.service.findById(id);
        this.setCached(key, user);
        return user;
    }

    async findAll(): Promise<User[]> {
        const key    = "users:all";
        const cached = this.getCached<User[]>(key);

        if (cached) {
            console.log(`  💾 [Cache] HIT users:all`);
            return cached;
        }

        console.log(`  💾 [Cache] MISS users:all — consultando servicio`);
        const users = await this.service.findAll();
        this.setCached(key, users);
        return users;
    }

    async create(data: Omit<User, "id">): Promise<User> {
        const user = await this.service.create(data);
        // Invalida el cache de lista al crear
        this.cache.delete("users:all");
        console.log(`  💾 [Cache] Invalidado users:all`);
        return user;
    }

    async delete(id: number): Promise<void> {
        await this.service.delete(id);
        // Invalida entradas relacionadas
        this.cache.delete(`user:${id}`);
        this.cache.delete("users:all");
        console.log(`  💾 [Cache] Invalidados user:${id} y users:all`);
    }
}
```

### Proxy de protección

```typescript
// proxies/auth.proxy.ts
type Permission = "read:users" | "write:users" | "delete:users";

const ROLE_PERMISSIONS: Record<User["role"], Permission[]> = {
    admin:  ["read:users", "write:users", "delete:users"],
    editor: ["read:users", "write:users"],
    viewer: ["read:users"],
};

class AuthProxy implements UserService {
    constructor(
        private readonly service: UserService,
        private readonly currentUser: User,
    ) {}

    private checkPermission(permission: Permission): void {
        const permissions = ROLE_PERMISSIONS[this.currentUser.role];
        if (!permissions.includes(permission)) {
            console.log(`  🔐 [Auth] DENEGADO — ${this.currentUser.role} no tiene ${permission}`);
            throw new Error(`Forbidden: se requiere permiso '${permission}'`);
        }
        console.log(`  🔐 [Auth] OK — ${this.currentUser.role} tiene ${permission}`);
    }

    async findById(id: number): Promise<User> {
        this.checkPermission("read:users");
        return this.service.findById(id);
    }

    async findAll(): Promise<User[]> {
        this.checkPermission("read:users");
        return this.service.findAll();
    }

    async create(data: Omit<User, "id">): Promise<User> {
        this.checkPermission("write:users");
        return this.service.create(data);
    }

    async delete(id: number): Promise<void> {
        this.checkPermission("delete:users");
        return this.service.delete(id);
    }
}
```

---

## 💡 Uso

```typescript
// main.ts
const realService = new RealUserService();

// Apilamos proxies: Auth → Cache → Real
// Auth verifica permisos primero, luego Cache revisa antes de ir a la DB
const adminUser: User = { id: 1, name: "Ana", email: "ana@mail.com", role: "admin" };
const viewerUser: User = { id: 3, name: "Sara", email: "sara@mail.com", role: "viewer" };

const serviceForAdmin = new AuthProxy(new CacheProxy(realService), adminUser);
const serviceForViewer = new AuthProxy(new CacheProxy(realService), viewerUser);

// ── Admin: todas las operaciones ─────────────────────────
console.log("=== Admin: primera búsqueda ===");
await serviceForAdmin.findById(1);
// 🔐 [Auth] OK — admin tiene read:users
// 💾 [Cache] MISS user:1 — consultando servicio
// 🗄️  [DB] SELECT * FROM users WHERE id = 1

console.log("\n=== Admin: segunda búsqueda (caché) ===");
await serviceForAdmin.findById(1);
// 🔐 [Auth] OK — admin tiene read:users
// 💾 [Cache] HIT user:1   ← no va a la BD

console.log("\n=== Admin: crear usuario ===");
await serviceForAdmin.create({ name: "Carlos", email: "carlos@mail.com", role: "editor" });
// 🔐 [Auth] OK — admin tiene write:users
// 🗄️  [DB] INSERT INTO users...
// 💾 [Cache] Invalidado users:all

console.log("\n=== Admin: eliminar usuario ===");
await serviceForAdmin.delete(2);
// 🔐 [Auth] OK — admin tiene delete:users
// 🗄️  [DB] DELETE FROM users WHERE id = 2
// 💾 [Cache] Invalidados user:2 y users:all

// ── Viewer: solo lectura ─────────────────────────────────
console.log("\n=== Viewer: puede leer ===");
await serviceForViewer.findById(1);
// 🔐 [Auth] OK — viewer tiene read:users
// 💾 [Cache] HIT user:1

console.log("\n=== Viewer: intenta eliminar ===");
try {
    await serviceForViewer.delete(1);
} catch (e: any) {
    console.log(`  ❌ ${e.message}`);
}
// 🔐 [Auth] DENEGADO — viewer no tiene delete:users
// ❌ Forbidden: se requiere permiso 'delete:users'
```

---

## 🔄 Ejemplo adicional — Proxy virtual (Lazy Loading)

Retrasa la inicialización de un objeto costoso hasta que realmente se necesita:

```typescript
// Servicio costoso de inicializar (conexión a BD, carga de modelos ML, etc.)
class HeavyAnalyticsService implements AnalyticsService {
    constructor() {
        console.log("⚙️  Inicializando servicio de analytics... (tarda 3 segundos)");
        // Simula inicialización costosa
    }
    async generateReport(month: string): Promise<Report> { /* ... */ }
}

// Proxy virtual — solo crea el servicio real cuando se necesita
class LazyAnalyticsProxy implements AnalyticsService {
    private realService: HeavyAnalyticsService | null = null;

    private getRealService(): HeavyAnalyticsService {
        if (!this.realService) {
            console.log("🔄 [Proxy] Primera llamada — inicializando servicio real...");
            this.realService = new HeavyAnalyticsService();
        }
        return this.realService;
    }

    async generateReport(month: string): Promise<Report> {
        return this.getRealService().generateReport(month);
    }
}

// El servicio costoso no se inicializa al crear el proxy
const analytics = new LazyAnalyticsProxy(); // ← instantáneo, sin costo
console.log("App lista"); // el servicio real aún no existe

// Solo se inicializa cuando se usa por primera vez
const report = await analytics.generateReport("2026-03"); // ← aquí se crea
```

---

## 🟨 Proxy nativo de JavaScript

JavaScript tiene un `Proxy` built-in que implementa el patrón a nivel del lenguaje:

```typescript
// El Proxy nativo intercepta CUALQUIER operación sobre el objeto
function createLoggingProxy<T extends object>(target: T, name: string): T {
    return new Proxy(target, {
        get(obj, prop, receiver) {
            const value = Reflect.get(obj, prop, receiver);

            if (typeof value === "function") {
                return (...args: unknown[]) => {
                    console.log(`📝 [Log] ${name}.${String(prop)}(${args.join(", ")})`);
                    const result = value.apply(obj, args);
                    console.log(`📝 [Log] ${name}.${String(prop)} → completado`);
                    return result;
                };
            }
            return value;
        },

        set(obj, prop, value) {
            console.log(`📝 [Log] ${name}.${String(prop)} = ${value}`);
            return Reflect.set(obj, prop, value);
        },
    });
}

// Uso
const config = createLoggingProxy({ host: "localhost", port: 3000 }, "Config");
config.host = "production.miapp.com";
// 📝 [Log] Config.host = production.miapp.com

config.port;
// (solo lectura — no loguea si no es función)
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Transparente al cliente**: misma interfaz — el cliente no cambia nada.
- **Separación de responsabilidades**: caché, auth, logging viven en el Proxy, no en el servicio real.
- **Composable**: puedes apilar proxies (`AuthProxy → CacheProxy → Real`).
- **Abierto/Cerrado**: agrega comportamiento sin modificar el sujeto real.
- **Lazy loading**: retrasa la inicialización costosa sin que el cliente lo sepa.

### ❌ Desventajas

- **Latencia extra**: cada llamada pasa por una capa adicional.
- **Complejidad**: muchos proxies apilados dificultan el debugging.
- **Puede ocultar errores**: un proxy que silencia excepciones puede enmascarar problemas reales.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Proxy? |
|---|---|
| Necesitas **caché** de operaciones costosas (BD, red, disco) | ✅ Sí |
| Quieres **control de acceso** sin modificar el servicio real | ✅ Sí |
| La inicialización del objeto es **costosa y puede diferirse** (lazy) | ✅ Sí |
| Necesitas **auditoría o logging** de todas las llamadas | ✅ Sí |
| El objeto real está en **otro proceso o servidor** (proxy remoto) | ✅ Sí |
| El objeto es simple y no tiene lógica transversal | ❌ Overengineering |
| La interfaz va a cambiar frecuentemente | ⚠️ Debes actualizar todos los proxies |

---

## ⚖️ Proxy vs otros patrones similares

| Patrón | Interfaz | Propósito | Diferencia clave |
|---|---|---|---|
| **Proxy** | Misma que el sujeto | Controlar acceso al sujeto real | El cliente no sabe que habla con un proxy |
| **Decorator** | Misma que el componente | Agregar comportamiento en capas | Decorator enriquece; Proxy controla acceso |
| **Facade** | Nueva, simplificada | Simplificar un subsistema complejo | Facade simplifica; Proxy sustituye |
| **Adapter** | Diferente (traduce) | Hacer compatible lo incompatible | Adapter cambia interfaz; Proxy la mantiene |

> 💡 **Proxy vs Decorator**: la diferencia más sutil. Ambos usan la misma interfaz y envuelven un objeto. La distinción es de **intención**: Decorator agrega funcionalidad al objeto, Proxy controla el acceso a él. En la práctica, el `CacheProxy` y el `LogDecorator` se implementan casi igual — lo que cambia es el propósito.

---

*Patrón: Proxy — Familia: Estructurales — GoF (Gang of Four)*
