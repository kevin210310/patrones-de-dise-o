# 🎯 Patrón de Comportamiento: Strategy

> Define una familia de algoritmos, encapsula cada uno en su propia clase e intercámbiables — permite cambiar el algoritmo sin modificar el código que lo usa.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Procesador de pagos](#-ejemplo--procesador-de-pagos)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ejemplo adicional — Algoritmos de ordenamiento](#-ejemplo-adicional--algoritmos-de-ordenamiento)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Strategy vs State](#-strategy-vs-state)

---

## 📋 Descripción

El **Strategy** es un patrón de diseño **de comportamiento** que define una familia de algoritmos, encapsula cada uno en una clase separada, y los hace intercambiables. Permite al cliente elegir qué algoritmo usar en tiempo de ejecución sin acoplarse a ninguna implementación concreta.

> 💡 Piénsalo como los modos de transporte en Google Maps: el destino es el mismo, pero puedes elegir ir en auto, bicicleta, transporte público o a pie. Cada uno es una estrategia diferente para resolver el mismo problema (llegar al destino).

---

## 🔥 Problema que resuelve

Sin Strategy, el código que varía según el algoritmo queda mezclado con `if/else` o `switch`:

```typescript
// ❌ Sin Strategy — lógica de negocio mezclada con variantes de algoritmo
class PaymentProcessor {
    process(amount: number, method: string): void {
        if (method === "credit_card") {
            // validar tarjeta, llamar a Stripe, manejar 3DS...
        } else if (method === "paypal") {
            // redirigir a PayPal, esperar callback, verificar...
        } else if (method === "crypto") {
            // verificar wallet, esperar confirmaciones...
        }
        // Agregar un método = modificar este método gigante
    }
}

// ✅ Con Strategy — cada método de pago en su propia clase
const processor = new PaymentProcessor(new CreditCardStrategy());
processor.process(amount); // no sabe ni le importa qué estrategia usa internamente
```

---

## 🗺️ Diagrama

```
  CLIENTE
  Elige la estrategia y la pasa al contexto
       │
       │ new PaymentProcessor(strategy)
       ▼
┌──────────────────────────┐
│   PaymentProcessor       │  ← Context
│   (Contexto)             │
│                          │
│ - strategy: PayStrategy  │
│                          │
│ + setStrategy(s)         │
│ + process(amount): Result│  → this.strategy.pay(amount)
└──────────────────────────┘
              │ delega
              ▼
    <<interface>>
    PaymentStrategy
    + pay(amount): PaymentResult
    + getName(): string
              ▲
    ┌─────────┼──────────┐
    │         │          │
CreditCard  PayPal    Crypto
Strategy   Strategy  Strategy
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Strategy** | Interfaz común para todos los algoritmos | `PaymentStrategy` |
| **Concrete Strategy** | Implementación concreta de un algoritmo | `CreditCardStrategy`, `PayPalStrategy`, `CryptoStrategy` |
| **Context** | Usa la estrategia sin conocer su implementación | `PaymentProcessor` |

---

## 💻 Implementación completa

### La interfaz Strategy

```typescript
// payment-strategy.interface.ts
interface PaymentResult {
    success: boolean;
    transactionId: string;
    amount: number;
    method: string;
    message: string;
}

interface PaymentStrategy {
    pay(amount: number, metadata?: Record<string, string>): Promise<PaymentResult>;
    validate(amount: number, metadata?: Record<string, string>): string | null; // null = válido
    getName(): string;
    getMinAmount(): number;
    getMaxAmount(): number;
}
```

### Estrategias concretas

```typescript
// strategies/credit-card.strategy.ts
class CreditCardStrategy implements PaymentStrategy {
    getName()       { return "Tarjeta de Crédito"; }
    getMinAmount()  { return 1; }
    getMaxAmount()  { return 50_000; }

    validate(amount: number, meta?: Record<string, string>): string | null {
        if (!meta?.cardNumber)  return "Número de tarjeta requerido";
        if (!meta?.cvv)         return "CVV requerido";
        if (!meta?.expiry)      return "Fecha de expiración requerida";
        if (!/^\d{16}$/.test(meta.cardNumber)) return "Número de tarjeta inválido";
        return null;
    }

    async pay(amount: number, meta?: Record<string, string>): Promise<PaymentResult> {
        console.log(`  💳 Procesando tarjeta ${meta?.cardNumber?.slice(-4).padStart(16, "*")}...`);
        await new Promise(r => setTimeout(r, 200));
        return {
            success:       true,
            transactionId: `CC_${Date.now()}`,
            amount,
            method:        this.getName(),
            message:       "Pago con tarjeta aprobado",
        };
    }
}

// strategies/paypal.strategy.ts
class PayPalStrategy implements PaymentStrategy {
    getName()       { return "PayPal"; }
    getMinAmount()  { return 0.01; }
    getMaxAmount()  { return 10_000; }

    validate(amount: number, meta?: Record<string, string>): string | null {
        if (!meta?.email)                    return "Email de PayPal requerido";
        if (!meta.email.includes("@"))       return "Email inválido";
        return null;
    }

    async pay(amount: number, meta?: Record<string, string>): Promise<PaymentResult> {
        console.log(`  🅿️  Procesando PayPal para ${meta?.email}...`);
        await new Promise(r => setTimeout(r, 300));
        return {
            success:       true,
            transactionId: `PP_${Date.now()}`,
            amount,
            method:        this.getName(),
            message:       "Pago PayPal completado",
        };
    }
}

// strategies/crypto.strategy.ts
class CryptoStrategy implements PaymentStrategy {
    constructor(private readonly coin: "BTC" | "ETH" | "USDT" = "USDT") {}

    getName()       { return `Crypto (${this.coin})`; }
    getMinAmount()  { return 10; }
    getMaxAmount()  { return 1_000_000; }

    validate(amount: number, meta?: Record<string, string>): string | null {
        if (!meta?.walletAddress)          return "Dirección de wallet requerida";
        if (meta.walletAddress.length < 26) return "Dirección de wallet inválida";
        if (amount < this.getMinAmount())  return `Mínimo $${this.getMinAmount()} para crypto`;
        return null;
    }

    async pay(amount: number, meta?: Record<string, string>): Promise<PaymentResult> {
        console.log(`  ₿  Procesando ${this.coin} a ${meta?.walletAddress?.slice(0, 8)}...`);
        await new Promise(r => setTimeout(r, 500)); // confirmaciones blockchain
        return {
            success:       true,
            transactionId: `CRYPTO_${Date.now()}`,
            amount,
            method:        this.getName(),
            message:       `Transacción ${this.coin} confirmada`,
        };
    }
}

// strategies/bank-transfer.strategy.ts
class BankTransferStrategy implements PaymentStrategy {
    getName()       { return "Transferencia Bancaria"; }
    getMinAmount()  { return 100; }
    getMaxAmount()  { return 500_000; }

    validate(amount: number, meta?: Record<string, string>): string | null {
        if (!meta?.bankAccount)   return "Número de cuenta requerido";
        if (!meta?.routingNumber) return "Código de banco requerido";
        if (amount < 100)         return "Mínimo $100 para transferencia bancaria";
        return null;
    }

    async pay(amount: number, meta?: Record<string, string>): Promise<PaymentResult> {
        console.log(`  🏦 Iniciando transferencia bancaria de $${amount}...`);
        await new Promise(r => setTimeout(r, 400));
        return {
            success:       true,
            transactionId: `BANK_${Date.now()}`,
            amount,
            method:        this.getName(),
            message:       "Transferencia iniciada — puede tardar 1-3 días hábiles",
        };
    }
}
```

### El Context — el procesador de pagos

```typescript
// payment-processor.ts
class PaymentProcessor {
    private strategy: PaymentStrategy;

    constructor(strategy: PaymentStrategy) {
        this.strategy = strategy;
    }

    // Permite cambiar la estrategia en runtime
    setStrategy(strategy: PaymentStrategy): void {
        console.log(`  🔄 Estrategia cambiada a: ${strategy.getName()}`);
        this.strategy = strategy;
    }

    async process(
        amount: number,
        metadata?: Record<string, string>
    ): Promise<PaymentResult> {
        console.log(`\n  💰 Procesando $${amount} con ${this.strategy.getName()}`);

        // Validación de rango
        if (amount < this.strategy.getMinAmount()) {
            return { success: false, transactionId: "", amount, method: this.strategy.getName(),
                message: `Mínimo permitido: $${this.strategy.getMinAmount()}` };
        }
        if (amount > this.strategy.getMaxAmount()) {
            return { success: false, transactionId: "", amount, method: this.strategy.getName(),
                message: `Máximo permitido: $${this.strategy.getMaxAmount()}` };
        }

        // Validación específica de la estrategia
        const validationError = this.strategy.validate(amount, metadata);
        if (validationError) {
            return { success: false, transactionId: "", amount, method: this.strategy.getName(),
                message: validationError };
        }

        return this.strategy.pay(amount, metadata);
    }
}
```

---

## 💡 Uso

```typescript
// main.ts
const processor = new PaymentProcessor(new CreditCardStrategy());

// Tarjeta de crédito
const r1 = await processor.process(500, {
    cardNumber: "4111111111111111",
    cvv: "123",
    expiry: "12/26",
});
console.log(`  ${r1.success ? "✅" : "❌"} ${r1.message}`);
// ✅ Pago con tarjeta aprobado

// Cambiar a PayPal en runtime
processor.setStrategy(new PayPalStrategy());
const r2 = await processor.process(200, { email: "user@paypal.com" });
console.log(`  ${r2.success ? "✅" : "❌"} ${r2.message}`);
// ✅ Pago PayPal completado

// Validación fallida
processor.setStrategy(new CreditCardStrategy());
const r3 = await processor.process(100, { cardNumber: "123" }); // CVV y expiración faltan
console.log(`  ${r3.success ? "✅" : "❌"} ${r3.message}`);
// ❌ CVV requerido

// Monto fuera de rango
processor.setStrategy(new BankTransferStrategy());
const r4 = await processor.process(50); // mínimo es $100
console.log(`  ${r4.success ? "✅" : "❌"} ${r4.message}`);
// ❌ Mínimo permitido: $100

// Crypto para montos grandes
processor.setStrategy(new CryptoStrategy("USDT"));
const r5 = await processor.process(50_000, { walletAddress: "0x742d35Cc6634C0532925a3b8D4C9b3e8f4e4c2d5" });
console.log(`  ${r5.success ? "✅" : "❌"} ${r5.message}`);
// ✅ Transacción USDT confirmada
```

---

## 📊 Ejemplo adicional — Algoritmos de ordenamiento

```typescript
interface SortStrategy<T> {
    sort(data: T[], compareFn: (a: T, b: T) => number): T[];
    getName(): string;
}

class BubbleSortStrategy<T> implements SortStrategy<T> {
    getName() { return "Bubble Sort O(n²)"; }
    sort(data: T[], fn: (a: T, b: T) => number): T[] {
        const arr = [...data];
        for (let i = 0; i < arr.length; i++)
            for (let j = 0; j < arr.length - i - 1; j++)
                if (fn(arr[j], arr[j + 1]) > 0) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        return arr;
    }
}

class QuickSortStrategy<T> implements SortStrategy<T> {
    getName() { return "Quick Sort O(n log n)"; }
    sort(data: T[], fn: (a: T, b: T) => number): T[] {
        if (data.length <= 1) return data;
        const pivot = data[Math.floor(data.length / 2)];
        const left  = data.filter(x => fn(x, pivot) < 0);
        const mid   = data.filter(x => fn(x, pivot) === 0);
        const right = data.filter(x => fn(x, pivot) > 0);
        return [...this.sort(left, fn), ...mid, ...this.sort(right, fn)];
    }
}

class Sorter<T> {
    constructor(private strategy: SortStrategy<T>) {}
    setStrategy(s: SortStrategy<T>) { this.strategy = s; }
    sort(data: T[], fn: (a: T, b: T) => number): T[] {
        console.log(`  Ordenando con ${this.strategy.getName()}`);
        return this.strategy.sort(data, fn);
    }
}

const sorter  = new Sorter(new QuickSortStrategy<number>());
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log(sorter.sort(numbers, (a, b) => a - b)); // [11, 12, 22, 25, 34, 64, 90]

sorter.setStrategy(new BubbleSortStrategy<number>());
console.log(sorter.sort(numbers, (a, b) => a - b)); // mismo resultado, diferente algoritmo
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas
- **Intercambiable en runtime**: cambias el algoritmo sin modificar el cliente ni el contexto.
- **Open/Closed**: agregar una estrategia nueva = una clase nueva, sin tocar las existentes.
- **Elimina condicionales**: reemplaza `if/else` de selección de algoritmo.
- **Testeable**: cada estrategia se testea de forma aislada.

### ❌ Desventajas
- **Más clases**: una clase por cada variante del algoritmo.
- **El cliente debe conocer las estrategias**: para elegir la correcta, el cliente debe saber qué hace cada una.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Strategy? |
|---|---|
| Tienes **múltiples variantes de un algoritmo** | ✅ Sí |
| Necesitas cambiar el algoritmo **en runtime** | ✅ Sí |
| Quieres **aislar la lógica** de cada variante para testearlo | ✅ Sí |
| Tienes un `switch` que selecciona entre **implementaciones distintas** | ✅ Sí |
| Solo hay una variante y nunca cambiará | ❌ Innecesario |

---

## ⚖️ Strategy vs State

La diferencia más sutil entre patrones de comportamiento:

| Aspecto | Strategy | State |
|---|---|---|
| **Quién cambia** | El **cliente** elige y cambia la estrategia | El **objeto o estado actual** decide el siguiente estado |
| **Conocimiento** | Los estrategias no se conocen entre sí | Los estados pueden conocerse para transicionar |
| **Propósito** | Elegir **cómo** hacer algo | Cambiar **qué** hace el objeto según su estado |
| **Ejemplo** | Elegir método de pago | Máquina expendedora con estados |

---

*Patrón: Strategy — Familia: Comportamiento — GoF (Gang of Four)*
