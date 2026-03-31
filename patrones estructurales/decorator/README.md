# 🎨 Patrón Estructural: Decorator

> Agrega responsabilidades a un objeto dinámicamente, envolviéndolo en otro objeto que implementa la misma interfaz — sin modificar su clase original.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Middleware HTTP](#-ejemplo--middleware-http)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Comparación con otros patrones estructurales](#-comparación-con-otros-patrones-estructurales)

---

## 📋 Descripción

El **Decorator** es un patrón de diseño **estructural** que permite agregar comportamiento a un objeto envolviéndolo en otro objeto que implementa la misma interfaz. Se pueden apilar múltiples decoradores como capas de una cebolla.

La clave: cada decorador **implementa la misma interfaz** que el objeto que envuelve, por lo que el cliente no nota la diferencia — solo ve la interfaz.

> 💡 Piénsalo como un café: el café base es el objeto original. Leche, azúcar y canela son decoradores — cada uno agrega algo sin cambiar el café que hay debajo.

---

## 🔥 Problema que resuelve

Sin Decorator, agregar comportamiento opcional obliga a crear subclases por cada combinación:

```typescript
// ❌ Sin Decorator — subclases por cada combinación posible
class BasicRequest          { handle() {} }
class AuthRequest           extends BasicRequest { /* agrega auth */ }
class LoggedRequest         extends BasicRequest { /* agrega log */ }
class AuthLoggedRequest     extends BasicRequest { /* agrega ambos */ }
class CachedRequest         extends BasicRequest { /* agrega caché */ }
class AuthCachedLoggedRequest extends BasicRequest { /* los tres */ }
// → explosión de subclases igual que en Bridge
```

```typescript
// ✅ Con Decorator — apilás comportamiento en runtime
const handler = new CacheDecorator(
                    new LogDecorator(
                        new AuthDecorator(
                            new BasicHandler()
                        )
                    )
                );
```

---

## 🗺️ Diagrama

```
  <<interface>>
  HttpHandler
  + handle(req): Response
        ▲
        │ implementa
   ┌────┴──────────────────────┐
   │                           │
BasicHandler             BaseDecorator
(componente concreto)    # handler: HttpHandler ← referencia al envuelto
                         + handle(req): Response
                               ▲
                    ┌──────────┼──────────┐
                    │          │          │
             AuthDecorator  LogDecorator  CacheDecorator
             + handle(req)  + handle(req) + handle(req)
               verifica       loguea        revisa cache
               token →        antes/        antes →
               llama          después →     llama si
               handler        llama         no hay hit
                              handler
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Component** | Interfaz común para componente y decoradores | `HttpHandler` |
| **Concrete Component** | El objeto base que se decora | `BasicHandler` |
| **Base Decorator** | Implementa la interfaz y contiene la referencia al componente | `BaseDecorator` |
| **Concrete Decorator** | Agrega comportamiento antes/después de delegar | `AuthDecorator`, `LogDecorator`, `CacheDecorator`, `RateLimitDecorator` |

---

## 🌍 Ejemplo — Middleware HTTP

El escenario: tienes un handler HTTP básico al que quieres agregarle autenticación, logging, caché y rate limiting de forma **opcional y componible** — sin modificar el handler original.

---

## 💻 Implementación completa

### La interfaz compartida

```typescript
// http-handler.interface.ts
interface Request {
    path: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
}

interface Response {
    status: number;
    body: unknown;
}

interface HttpHandler {
    handle(request: Request): Promise<Response>;
}
```

### El componente base

```typescript
// handlers/basic.handler.ts
class BasicHandler implements HttpHandler {
    async handle(request: Request): Promise<Response> {
        console.log(`  ⚙️  [Handler] Procesando ${request.method} ${request.path}`);
        return {
            status: 200,
            body:   { message: "OK", path: request.path },
        };
    }
}
```

### El decorador base

```typescript
// decorators/base.decorator.ts
// Evita repetir la lógica de delegación en cada decorador concreto
abstract class BaseDecorator implements HttpHandler {
    constructor(protected handler: HttpHandler) {}

    async handle(request: Request): Promise<Response> {
        return this.handler.handle(request);
    }
}
```

### Decoradores concretos

```typescript
// decorators/auth.decorator.ts
class AuthDecorator extends BaseDecorator {
    constructor(
        handler: HttpHandler,
        private readonly validToken: string = "secret-token"
    ) {
        super(handler);
    }

    async handle(request: Request): Promise<Response> {
        console.log(`  🔐 [Auth] Verificando token...`);

        const token = request.headers["authorization"]?.replace("Bearer ", "");

        if (token !== this.validToken) {
            console.log(`  🔐 [Auth] Token inválido — bloqueado`);
            return { status: 401, body: { error: "Unauthorized" } };
        }

        console.log(`  🔐 [Auth] Token válido — continuando`);
        return this.handler.handle(request);
    }
}

// decorators/log.decorator.ts
class LogDecorator extends BaseDecorator {
    async handle(request: Request): Promise<Response> {
        const start = Date.now();
        console.log(`  📝 [Log] → ${request.method} ${request.path}`);

        const response = await this.handler.handle(request);

        const duration = Date.now() - start;
        console.log(`  📝 [Log] ← ${response.status} en ${duration}ms`);

        return response;
    }
}

// decorators/cache.decorator.ts
class CacheDecorator extends BaseDecorator {
    private cache = new Map<string, { response: Response; expiresAt: number }>();

    constructor(handler: HttpHandler, private readonly ttlMs: number = 5_000) {
        super(handler);
    }

    async handle(request: Request): Promise<Response> {
        if (request.method !== "GET") return this.handler.handle(request);

        const key   = `${request.method}:${request.path}`;
        const entry = this.cache.get(key);

        if (entry && Date.now() < entry.expiresAt) {
            console.log(`  💾 [Cache] HIT — retornando respuesta cacheada`);
            return entry.response;
        }

        console.log(`  💾 [Cache] MISS — llamando al handler`);
        const response = await this.handler.handle(request);
        this.cache.set(key, { response, expiresAt: Date.now() + this.ttlMs });
        return response;
    }
}

// decorators/rate-limit.decorator.ts
class RateLimitDecorator extends BaseDecorator {
    private requests = new Map<string, number[]>();

    constructor(
        handler: HttpHandler,
        private readonly maxRequests = 10,
        private readonly windowMs    = 60_000
    ) {
        super(handler);
    }

    async handle(request: Request): Promise<Response> {
        const ip  = request.headers["x-forwarded-for"] ?? "unknown";
        const now = Date.now();

        const timestamps = (this.requests.get(ip) ?? [])
            .filter(t => now - t < this.windowMs);

        if (timestamps.length >= this.maxRequests) {
            console.log(`  🚦 [RateLimit] IP ${ip} bloqueada — límite alcanzado`);
            return { status: 429, body: { error: "Too Many Requests" } };
        }

        timestamps.push(now);
        this.requests.set(ip, timestamps);
        console.log(`  🚦 [RateLimit] IP ${ip}: ${timestamps.length}/${this.maxRequests} requests`);

        return this.handler.handle(request);
    }
}
```

---

## 💡 Uso

```typescript
// main.ts

// La ejecución va de afuera hacia adentro:
// RateLimit → Cache → Log → Auth → BasicHandler
const handler = new RateLimitDecorator(
    new CacheDecorator(
        new LogDecorator(
            new AuthDecorator(
                new BasicHandler()
            )
        ),
        10_000  // TTL 10 segundos
    ),
    5           // máx 5 requests por ventana
);

const request: Request = {
    method:  "GET",
    path:    "/api/users",
    headers: {
        authorization:    "Bearer secret-token",
        "x-forwarded-for": "192.168.1.1"
    },
};

console.log("=== Primera llamada ===");
await handler.handle(request);
// 🚦 [RateLimit] IP 192.168.1.1: 1/5 requests
// 💾 [Cache] MISS — llamando al handler
// 📝 [Log] → GET /api/users
// 🔐 [Auth] Verificando token...
// 🔐 [Auth] Token válido — continuando
//  ⚙️  [Handler] Procesando GET /api/users
// 📝 [Log] ← 200 en 1ms

console.log("\n=== Segunda llamada (hit de caché) ===");
await handler.handle(request);
// 🚦 [RateLimit] IP 192.168.1.1: 2/5 requests
// 💾 [Cache] HIT — retornando respuesta cacheada

console.log("\n=== Token inválido ===");
const badRequest = { ...request, headers: { authorization: "Bearer wrong", "x-forwarded-for": "192.168.1.1" } };
await handler.handle(badRequest);
// 🚦 [RateLimit] IP 192.168.1.1: 3/5 requests
// 💾 [Cache] MISS
// 📝 [Log] → GET /api/users
// 🔐 [Auth] Token inválido — bloqueado
// 📝 [Log] ← 401 en 0ms
```

> 💡 **El orden importa**: RateLimit va primero para rechazar antes de cualquier procesamiento. Cache va antes de Log para que los hits no generen logs innecesarios. Auth va justo antes del Handler para validar solo si hay trabajo real que hacer.

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Sin modificar la clase original**: el `BasicHandler` nunca se toca — abierto/cerrado.
- **Composición en runtime**: decides qué decoradores apilar según el contexto.
- **Responsabilidad única**: cada decorador hace una sola cosa.
- **Alternativa flexible a la herencia**: evita la explosión de subclases.

### ❌ Desventajas

- **El orden importa y puede confundir**: un orden incorrecto da comportamientos inesperados.
- **Debugging complejo**: con muchos decoradores apilados es difícil rastrear el flujo.
- **Configuración verbosa**: apilar muchos decoradores hace el código de setup largo.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Decorator? |
|---|---|
| Agregar comportamiento **opcional** a objetos en runtime | ✅ Sí |
| Comportamiento **componible** en capas (auth, log, cache) | ✅ Sí |
| Quieres evitar **subclases** por cada combinación posible | ✅ Sí |
| El comportamiento extra debe ser **transparente** al cliente | ✅ Sí |
| Solo necesitas comportamiento **fijo**, nunca variable | ❌ Usa herencia simple |
| La interfaz del objeto va a **cambiar** | ❌ Decorator requiere misma interfaz |

---

## ⚖️ Comparación con otros patrones estructurales

| Patrón | Interfaz | Agrega comportamiento | Propósito |
|---|---|---|---|
| **Decorator** | Misma | ✅ Sí, en capas | Extender objetos dinámicamente |
| **Facade** | Nueva (simplificada) | ❌ No | Simplificar subsistemas complejos |
| **Adapter** | Traduce | ❌ No | Hacer compatible lo incompatible |
| **Proxy** | Misma | ⚠️ Control | Controlar acceso a un objeto |
| **Bridge** | Separa en dos | ❌ No | Desacoplar abstracción de implementación |

---

*Patrón: Decorator — Familia: Estructurales — GoF (Gang of Four)*
