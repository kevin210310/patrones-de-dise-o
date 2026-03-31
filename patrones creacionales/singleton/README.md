# 👤 Patrón Creacional: Singleton

> Garantiza que una clase tenga **una única instancia** en toda la aplicación, y provee un punto de acceso global a ella.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Implementación base](#-implementación-base)
- [Variantes](#-variantes)
- [Casos de uso reales](#-casos-de-uso-reales)
- [El problema del Singleton en tests](#-el-problema-del-singleton-en-tests)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo y cuándo no](#-cuándo-usarlo-y-cuándo-no)
- [Comparación con los otros patrones creacionales](#-comparación-con-los-otros-patrones-creacionales)

---

## 📋 Descripción

El **patrón Singleton** es el más simple de los patrones creacionales del GoF. Resuelve dos problemas a la vez:

1. **Una sola instancia**: asegura que solo exista un objeto de esa clase en todo el programa.
2. **Acceso global**: provee un punto de acceso único a esa instancia desde cualquier parte del código.

> 💡 Piénsalo como el presidente de un país — no puede haber dos al mismo tiempo, y todo el mundo sabe cómo referirse a él.

---

## 🔥 Problema que resuelve

Sin Singleton, cada `new` crea una instancia separada. Para recursos compartidos, esto genera **estados inconsistentes**:

```typescript
// ❌ Sin Singleton — cada módulo tiene su propia instancia
// database.ts
import { DatabaseConnection } from "./db";
const db1 = new DatabaseConnection(); // conexión 1

// user.service.ts
import { DatabaseConnection } from "./db";
const db2 = new DatabaseConnection(); // conexión 2 — diferente objeto, diferente estado

db1.query("SELECT ...");
db2.query("SELECT ..."); // ¿opera sobre la misma BD? ¿tiene el mismo pool?
// Resultado: múltiples conexiones abiertas, estado inconsistente, recursos desperdiciados
```

```typescript
// ✅ Con Singleton — todos comparten la misma instancia
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();

console.log(db1 === db2); // true — es exactamente el mismo objeto
```

---

## 🗺️ Diagrama

```
  Módulo A              Módulo B              Módulo C
     │                     │                     │
     │ getInstance()        │ getInstance()        │ getInstance()
     ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────┐
│                    Singleton                        │
│                                                     │
│  - instance: Singleton | null  (estático, privado)  │
│  - constructor()               (privado)            │
│                                                     │
│  + getInstance(): Singleton    (estático, público)  │
│       │                                             │
│       ├── ¿instance existe? → retorna instance      │
│       └── ¿no existe?      → crea, guarda, retorna  │
│                                                     │
│  + tuMétodo()                  (instancia)          │
└─────────────────────────────────────────────────────┘
         │
         └── siempre el MISMO objeto en memoria
```

---

## 💻 Implementación base

```typescript
class Singleton {
    // 1. Instancia guardada como propiedad estática privada
    private static instance: Singleton | null = null;

    // 2. Constructor privado — nadie puede hacer `new Singleton()` desde fuera
    private constructor() {
        console.log("Singleton creado — esto solo ocurre una vez");
    }

    // 3. Método estático de acceso — la única puerta de entrada
    static getInstance(): Singleton {
        if (!Singleton.instance) {
            Singleton.instance = new Singleton();
        }
        return Singleton.instance;
    }

    // Tus métodos de negocio van aquí
    public doSomething(): void {
        console.log("Ejecutando lógica compartida");
    }
}

// ── Uso ──────────────────────────────────────────────────
const a = Singleton.getInstance();
const b = Singleton.getInstance();
const c = Singleton.getInstance();

console.log(a === b); // true
console.log(b === c); // true
// "Singleton creado" solo se imprimió UNA vez
```

---

## 🔀 Variantes

### 1. Lazy Initialization (por defecto)

La instancia se crea **la primera vez que se necesita**, no al cargar el módulo. Es la variante del ejemplo base.

```typescript
static getInstance(): DatabaseSingleton {
    if (!DatabaseSingleton.instance) {           // ← lazy: crea solo si no existe
        DatabaseSingleton.instance = new DatabaseSingleton();
    }
    return DatabaseSingleton.instance;
}
```

**Cuándo usarla**: cuando la inicialización es costosa y puede que nunca se necesite.

---

### 2. Eager Initialization

La instancia se crea **al cargar la clase**, sin esperar a que se pida:

```typescript
class Config {
    // Se crea inmediatamente, antes de cualquier llamada a getInstance()
    private static readonly instance: Config = new Config();

    private constructor() {}

    static getInstance(): Config {
        return Config.instance;
    }
}
```

**Cuándo usarla**: cuando la instancia siempre se va a necesitar y su creación es rápida.

---

### 3. Singleton con módulo ES (el más idiomático en Node.js / TypeScript)

En Node.js, los módulos se cachean automáticamente. Exportar una instancia ya actúa como Singleton sin necesidad de la clase:

```typescript
// config.ts
class Config {
    public readonly dbUrl    = process.env.DATABASE_URL ?? "localhost";
    public readonly port     = Number(process.env.PORT) || 3000;
    public readonly nodeEnv  = process.env.NODE_ENV    ?? "development";
}

// Se exporta UNA instancia — Node.js la cachea y todos los imports reciben la misma
export const config = new Config();

// ── En cualquier otro archivo ──
import { config } from "./config";
console.log(config.port); // siempre el mismo objeto
```

**Cuándo usarla**: en proyectos Node.js/TypeScript modernos — es la forma más simple y natural.

---

### 4. Singleton con `static` puro (sin instancia)

Cuando no necesitas estado de instancia, puedes usar solo métodos y propiedades estáticos:

```typescript
class Logger {
    private static logs: string[] = [];

    private constructor() {} // evita instanciación accidental

    static log(message: string): void {
        const entry = `[${new Date().toISOString()}] ${message}`;
        Logger.logs.push(entry);
        console.log(entry);
    }

    static getLogs(): string[] {
        return [...Logger.logs];
    }

    static clear(): void {
        Logger.logs = [];
    }
}

Logger.log("App iniciada");
Logger.log("Usuario autenticado");
console.log(Logger.getLogs());
```

---

## 🌍 Casos de uso reales

### Conexión a base de datos

```typescript
class DatabaseConnection {
    private static instance: DatabaseConnection | null = null;
    private connection: any; // tu cliente de DB

    private constructor() {
        // Conectar una sola vez — operación costosa
        this.connection = createDbClient({
            host:     process.env.DB_HOST,
            port:     Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user:     process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
        console.log("Conexión a BD establecida");
    }

    static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    async query(sql: string, params?: any[]): Promise<any> {
        return this.connection.query(sql, params);
    }
}

// En múltiples servicios — todos usan la misma conexión
const db = DatabaseConnection.getInstance();
await db.query("SELECT * FROM users WHERE id = $1", [userId]);
```

---

### Logger centralizado

```typescript
type LogLevel = "info" | "warn" | "error";

class AppLogger {
    private static instance: AppLogger | null = null;
    private logs: { level: LogLevel; message: string; timestamp: Date }[] = [];

    private constructor() {}

    static getInstance(): AppLogger {
        if (!AppLogger.instance) {
            AppLogger.instance = new AppLogger();
        }
        return AppLogger.instance;
    }

    log(level: LogLevel, message: string): void {
        const entry = { level, message, timestamp: new Date() };
        this.logs.push(entry);
        console[level](`[${entry.timestamp.toISOString()}] ${message}`);
    }

    info(message: string)  { this.log("info", message); }
    warn(message: string)  { this.log("warn", message); }
    error(message: string) { this.log("error", message); }

    getHistory(): typeof this.logs {
        return [...this.logs]; // copia inmutable
    }
}

// Desde cualquier módulo
const logger = AppLogger.getInstance();
logger.info("Servidor iniciado en puerto 3000");
logger.warn("Token a punto de expirar");
logger.error("Fallo al conectar con el servicio externo");
```

---

### Caché en memoria

```typescript
class CacheService {
    private static instance: CacheService | null = null;
    private store = new Map<string, { value: any; expiresAt: number }>();

    private constructor() {}

    static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    set(key: string, value: any, ttlMs: number = 60_000): void {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value as T;
    }

    delete(key: string): void {
        this.store.delete(key);
    }
}

// Todos los servicios comparten el mismo caché
const cache = CacheService.getInstance();
cache.set("user:42", { name: "Ana", role: "admin" }, 5 * 60_000); // TTL 5 min

const user = cache.get<{ name: string; role: string }>("user:42");
```

---

## 🧪 El problema del Singleton en tests

El Singleton es el patrón más criticado precisamente por su **dificultad para testear**. El estado persiste entre tests:

```typescript
// ❌ Problema en tests — el estado del Singleton se comparte entre todos
describe("CacheService", () => {
    it("test 1: guarda un valor", () => {
        const cache = CacheService.getInstance();
        cache.set("key", "valor1");
        expect(cache.get("key")).toBe("valor1"); // ✅
    });

    it("test 2: debería estar vacío", () => {
        const cache = CacheService.getInstance();
        expect(cache.get("key")).toBeNull(); // ❌ sigue teniendo "valor1" del test anterior
    });
});
```

### Solución: método de reset para tests

```typescript
class CacheService {
    private static instance: CacheService | null = null;
    private store = new Map();

    private constructor() {}

    static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    // Solo para uso en tests — resetea la instancia
    static resetInstance(): void {
        CacheService.instance = null;
    }
}

// En los tests
afterEach(() => {
    CacheService.resetInstance(); // cada test parte desde cero
});
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Una sola instancia garantizada**: sin importar cuántos módulos lo importen, siempre es el mismo objeto.
- **Acceso global controlado**: mejor que una variable global — encapsula el estado y expone solo lo necesario.
- **Inicialización lazy**: el recurso se crea solo cuando se necesita por primera vez.
- **Estado compartido coherente**: todos los consumidores ven el mismo estado.

### ❌ Desventajas

- **Difícil de testear**: el estado persiste entre tests. Requiere métodos de reset explícitos.
- **Acoplamiento global**: cualquier parte del código puede acceder y modificar el Singleton — hace difícil rastrear quién cambia el estado.
- **Viola el Principio de Responsabilidad Única**: la clase gestiona su propia lógica Y controla su ciclo de vida.
- **Problemas en concurrencia**: en entornos multihilo (Java, Go) pueden crearse dos instancias simultáneamente si no se usa sincronización. En Node.js esto no aplica por su modelo single-thread.

---

## ✅ Cuándo usarlo y cuándo no

| Situación | ¿Usar Singleton? |
|---|---|
| Conexión a base de datos compartida | ✅ Sí |
| Logger centralizado de la aplicación | ✅ Sí |
| Caché en memoria compartida | ✅ Sí |
| Configuración de la aplicación (`config`) | ✅ Sí |
| Cuando necesitas **testear** la clase fácilmente | ⚠️ Agrega `resetInstance()` |
| Estado de negocio que varía por usuario o request | ❌ No |
| Como reemplazo de una variable global cualquiera | ❌ No, es una señal de mal diseño |
| En proyectos con inyección de dependencias (NestJS, etc.) | ❌ El framework ya lo gestiona |

---

## ⚖️ Comparación con los otros patrones creacionales

| Patrón              | Instancias que crea | Quién controla la creación          |
|---------------------|---------------------|-------------------------------------|
| **Builder**         | Una nueva por build | El cliente, paso a paso             |
| **Factory Method**  | Una nueva por llamada | La fábrica, según configuración    |
| **Abstract Factory**| Una por producto    | La fábrica de familia               |
| **Prototype**       | Una copia por clone | El objeto prototipo                 |
| **Singleton**       | **Siempre la misma**| La propia clase, solo una vez       |

---

*Patrón: Singleton — Familia: Creacionales — GoF (Gang of Four)*