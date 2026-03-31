# 🏗️ Factory Function

> Una función que crea y retorna objetos — sin `new`, sin clases, sin `this`. Solo una función que fabrica lo que necesitas.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Implementación base](#-implementación-base)
- [Encapsulamiento con closures](#-encapsulamiento-con-closures)
- [Con TypeScript — tipado explícito](#-con-typescript--tipado-explícito)
- [Variantes](#-variantes)
- [Casos de uso reales](#-casos-de-uso-reales)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Comparación con Class y Factory Method](#-comparación-con-class-y-factory-method)

---

## 📋 Descripción

Una **Factory Function** es simplemente una función que retorna un objeto. No es un patrón del GoF — es un patrón **propio de JavaScript** que aprovecha closures y la naturaleza de las funciones en el lenguaje.

No necesita `class`, no necesita `new`, no necesita `this`. Solo:

```typescript
function createAlgo(params) {
    return { /* objeto */ };
}
```

> 💡 Es el equivalente funcional de una clase — misma idea, diferente herramienta. Muy popular en el ecosistema JS/TS moderno.

---

## 🔥 Problema que resuelve

### El problema con `new` y `this`

Las clases y el operador `new` tienen comportamientos que pueden sorprender:

```typescript
class Counter {
    private count = 0;
    increment() { this.count++; }
    getCount()  { return this.count; }
}

const counter = new Counter();
const { increment } = counter; // desestructuración común en JS

increment(); // ❌ TypeError: Cannot read properties of undefined (reading 'count')
             //    `this` se perdió al desestructurar
```

```typescript
// ✅ Con Factory Function — no hay `this` que perder
function createCounter() {
    let count = 0; // privado por closure

    return {
        increment: () => count++,
        getCount:  () => count,
    };
}

const counter = createCounter();
const { increment, getCount } = counter; // desestructuración segura

increment();
increment();
console.log(getCount()); // 2 ✅ — funciona sin importar el contexto
```

---

## 💻 Implementación base

```typescript
// La forma más simple — función que retorna un objeto literal
function createUser(name: string, email: string) {
    return {
        name,
        email,
        createdAt: new Date(),
        greet() {
            console.log(`Hola, soy ${this.name}`);
        },
    };
}

const user1 = createUser("Ana", "ana@mail.com");
const user2 = createUser("Luis", "luis@mail.com");

user1.greet(); // Hola, soy Ana
user2.greet(); // Hola, soy Luis

console.log(user1 instanceof createUser); // false — no hay instanceof
// (esto puede ser ventaja o desventaja según el caso)
```

---

## 🔒 Encapsulamiento con closures

La mayor ventaja de la Factory Function sobre las clases: **privacidad real** mediante closures, sin necesidad de `private` ni `#`:

```typescript
function createBankAccount(owner: string, initialBalance: number) {
    // Estas variables son COMPLETAMENTE privadas — inaccesibles desde fuera
    let balance = initialBalance;
    const transactions: { type: string; amount: number; date: Date }[] = [];

    function recordTransaction(type: string, amount: number) {
        transactions.push({ type, amount, date: new Date() });
    }

    // Solo esto es público — el objeto retornado
    return {
        owner,

        deposit(amount: number): void {
            if (amount <= 0) throw new Error("El monto debe ser positivo");
            balance += amount;
            recordTransaction("deposit", amount);
            console.log(`Depósito de $${amount}. Saldo: $${balance}`);
        },

        withdraw(amount: number): void {
            if (amount > balance) throw new Error("Saldo insuficiente");
            balance -= amount;
            recordTransaction("withdrawal", amount);
            console.log(`Retiro de $${amount}. Saldo: $${balance}`);
        },

        getBalance(): number {
            return balance; // solo lectura — nadie puede escribir directo
        },

        getHistory() {
            return [...transactions]; // copia inmutable
        },
    };
}

// Uso
const account = createBankAccount("Ana García", 1000);

account.deposit(500);   // Depósito de $500. Saldo: $1500
account.withdraw(200);  // Retiro de $200. Saldo: $1300

console.log(account.getBalance()); // 1300
console.log(account.balance);      // undefined ← no existe en el objeto público
                                   // balance es completamente privado
```

---

## 🟦 Con TypeScript — tipado explícito

Para obtener el mejor tipado, define una interfaz para el objeto retornado:

```typescript
// Definimos qué expone la factory — el "contrato público"
interface User {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly createdAt: Date;
    updateEmail(newEmail: string): void;
    displayInfo(): void;
}

function createUser(name: string, email: string): User {
    // Estado privado — no forma parte de la interfaz
    let currentEmail = email;
    const id = crypto.randomUUID();

    return {
        id,
        name,
        createdAt: new Date(),

        // Getter — email es de solo lectura desde fuera pero mutable internamente
        get email() { return currentEmail; },

        updateEmail(newEmail: string): void {
            if (!newEmail.includes("@")) throw new Error("Email inválido");
            currentEmail = newEmail;
        },

        displayInfo(): void {
            console.log({ id, name, email: currentEmail });
        },
    };
}

const user = createUser("Ana", "ana@mail.com");
user.displayInfo();
// { id: 'uuid...', name: 'Ana', email: 'ana@mail.com' }

user.updateEmail("ana.nueva@mail.com");
user.displayInfo();
// { id: 'uuid...', name: 'Ana', email: 'ana.nueva@mail.com' }

// user.id = "otro"; // ❌ Error de compilación — readonly
```

---

## 🔀 Variantes

### 1. Factory Function con parámetros por defecto

```typescript
interface EmailOptions {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    cc?: string[];
}

function createEmail(options: EmailOptions) {
    const {
        to,
        subject,
        html = null,
        text = null,
        from = "no-reply@miapp.com",
        cc   = [],
    } = options;

    if (!html && !text) throw new Error("El cuerpo del email es requerido");

    return { to, subject, html, text, from, cc };
}

const email = createEmail({
    to:      "juan@mail.com",
    subject: "Bienvenido",
    html:    "<h1>Hola Juan</h1>",
});
```

---

### 2. Factory Function que retorna otras factory functions

```typescript
// Una fábrica de fábricas — parametriza el comportamiento
function createLogger(prefix: string) {
    return {
        info:  (msg: string) => console.log(`[${prefix}][INFO]  ${msg}`),
        warn:  (msg: string) => console.warn(`[${prefix}][WARN]  ${msg}`),
        error: (msg: string) => console.error(`[${prefix}][ERROR] ${msg}`),
    };
}

const authLogger    = createLogger("Auth");
const paymentLogger = createLogger("Payment");

authLogger.info("Usuario autenticado");       // [Auth][INFO]  Usuario autenticado
paymentLogger.error("Pago rechazado");        // [Payment][ERROR] Pago rechazado
```

---

### 3. Composición de factories

```typescript
// Piezas reutilizables
function withTimestamps<T>(obj: T) {
    return {
        ...obj,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

function withId<T>(obj: T) {
    return {
        ...obj,
        id: crypto.randomUUID(),
    };
}

// Composición — combina comportamientos sin herencia
function createProduct(name: string, price: number) {
    const base = { name, price };
    return withId(withTimestamps(base));
}

const product = createProduct("Laptop", 1200);
console.log(product);
// { name: 'Laptop', price: 1200, createdAt: Date, updatedAt: Date, id: 'uuid...' }
```

---

## 🌍 Casos de uso reales

### Servicio HTTP configurable

```typescript
function createHttpClient(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    // Estado privado — no expuesto
    const headers = { "Content-Type": "application/json", ...defaultHeaders };

    async function request(method: string, path: string, body?: unknown) {
        const res = await fetch(`${baseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
    }

    return {
        get:    (path: string)                   => request("GET",    path),
        post:   (path: string, body: unknown)    => request("POST",   path, body),
        put:    (path: string, body: unknown)    => request("PUT",    path, body),
        delete: (path: string)                   => request("DELETE", path),
    };
}

// Cada instancia tiene su propia baseUrl y headers
const apiClient  = createHttpClient("https://api.miapp.com", {
    Authorization: `Bearer ${process.env.API_TOKEN}`,
});

const adminClient = createHttpClient("https://admin.miapp.com", {
    "X-Admin-Key": process.env.ADMIN_KEY!,
});

const users = await apiClient.get("/users");
await adminClient.post("/reports", { type: "monthly" });
```

---

### Validador reutilizable

```typescript
function createValidator<T>(rules: {
    [K in keyof T]?: (value: T[K]) => string | null;
}) {
    return {
        validate(data: T): { valid: boolean; errors: Partial<Record<keyof T, string>> } {
            const errors: Partial<Record<keyof T, string>> = {};

            for (const key in rules) {
                const error = rules[key]?.(data[key]);
                if (error) errors[key] = error;
            }

            return { valid: Object.keys(errors).length === 0, errors };
        },
    };
}

// Uso
const userValidator = createValidator<{ name: string; email: string; age: number }>({
    name:  v => (!v || v.length < 2)    ? "Nombre muy corto"   : null,
    email: v => (!v?.includes("@"))     ? "Email inválido"     : null,
    age:   v => (v < 18)                ? "Debe ser mayor de edad" : null,
});

const result = userValidator.validate({ name: "A", email: "noesmail", age: 15 });
console.log(result);
// { valid: false, errors: { name: 'Nombre muy corto', email: 'Email inválido', age: 'Debe ser mayor de edad' } }
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Privacidad real**: las variables del closure son inaccesibles desde fuera — no hay forma de violarlas, a diferencia de `private` en TypeScript que solo existe en compilación.
- **Sin problemas de `this`**: las arrow functions capturan el contexto correctamente — puedes desestructurar sin miedo.
- **Composición natural**: es fácil combinar factories con spread, mixins y funciones de orden superior.
- **Sin `new`**: el cliente no necesita saber si está creando un objeto simple o uno complejo.
- **Más flexible**: puede retornar diferentes tipos según los parámetros — difícil con clases.

### ❌ Desventajas

- **Sin `instanceof`**: no puedes usar `obj instanceof createUser` — si necesitas verificar el tipo, debes usar otras estrategias (discriminated unions, duck typing).
- **Más memoria**: cada instancia tiene sus propias copias de los métodos — las clases comparten métodos en el `prototype`. En miles de instancias, esto puede importar.
- **Sin herencia nativa**: la herencia se reemplaza por composición — que muchos consideran mejor, pero requiere cambiar la forma de pensar.
- **Menos familiar**: desarrolladores con background en OOP pueden encontrarla menos intuitiva al principio.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Factory Function? |
|---|---|
| Necesitas **privacidad real** de estado interno | ✅ Sí |
| El objeto se va a **desestructurar** o pasar como callback | ✅ Sí |
| Prefieres **composición sobre herencia** | ✅ Sí |
| Estás en un entorno **funcional** o con React hooks | ✅ Sí |
| Necesitas `instanceof` o herencia en cadena | ❌ Usa clases |
| Crearás **miles de instancias** con alto volumen | ⚠️ Evalúa el costo de memoria |
| El equipo tiene background fuerte en OOP | ⚠️ Considera la curva de aprendizaje |

---

## ⚖️ Comparación con Class y Factory Method

| Aspecto | Class | Factory Method (GoF) | Factory Function |
|---|---|---|---|
| **Sintaxis** | `new MiClase()` | `Factory.create()` | `createMiCosa()` |
| **`this`** | Requerido, puede perderse | Requerido | No existe |
| **Privacidad** | Solo en compilación (`private`) | Solo en compilación | Real (closure) |
| **Herencia** | Nativa (`extends`) | Via subclases | Composición |
| **`instanceof`** | ✅ Funciona | ✅ Funciona | ❌ No aplica |
| **Memoria** | Métodos en `prototype` (eficiente) | Métodos en `prototype` | Copia por instancia |
| **Origen** | OOP clásico | GoF | JavaScript nativo |
| **Mejor para** | Entidades con jerarquías | Abstracción de creación | Objetos simples, closures, funcional |

---

*Concepto: Factory Function — patrón propio del ecosistema JavaScript/TypeScript*