# 🔌 Patrón Estructural: Adapter

## 📋 Descripción

El **patrón Adapter** es un patrón de diseño **estructural** que permite que objetos con interfaces incompatibles colaboren entre sí.

Funciona como un adaptador de enchufe de viaje: el dispositivo (tu código) y el tomacorriente (la librería externa) tienen formas distintas — el adaptador en el medio hace que encajen sin modificar ninguno de los dos.

> 💡 El Adapter **no cambia** la funcionalidad — solo traduce llamadas de una interfaz a otra.

---

## 🔥 Problema que resuelve

Tu aplicación espera una interfaz específica, pero la librería que quieres usar expone una interfaz diferente. Sin tocar ninguno de los dos, el Adapter hace la traducción:

```typescript
// Tu sistema espera esto:
interface PaymentProcessor {
    processPayment(amount: number, currency: string): Promise<{ success: boolean; transactionId: string }>;
}

// Pero Stripe tiene esta API:
stripe.charges.create({
    amount: 1000,        // en centavos, no en dólares
    currency: "usd",
    source: "tok_visa",
});

// Y MercadoPago tiene esta otra:
mp.payment.create({
    transaction_amount: 10.00,  // en la moneda directamente
    payment_method_id: "visa",
    payer: { email: "..." },
});

// ❌ Sin Adapter: el código cliente debe conocer cada API — acoplamiento total
// ✅ Con Adapter: el código cliente solo conoce PaymentProcessor — las diferencias quedan ocultas
```

---

## 🗺️ Diagrama

```
  CLIENTE
  Solo conoce la interfaz Target.
  Nunca toca Stripe, MP ni ningún SDK directo.
       │
       │ usa
       ▼
┌─────────────────────────────┐
│    <<interface>>            │
│    PaymentProcessor         │  ← Target: la interfaz que tu sistema espera
│                             │
│  + processPayment(          │
│      amount: number,        │
│      currency: string       │
│    ): Promise<Result>       │
└─────────────────────────────┘
               ▲
               │ implementa
       ┌───────┴────────────┐
       │                    │
┌──────────────┐    ┌───────────────────┐
│StripeAdapter │    │MercadoPagoAdapter │   ← Adapters: traducen la interfaz
│              │    │                   │
│- stripe      │    │- mp               │
│              │    │                   │
│+processPaym..│    │+processPayment()  │
│  traduce →   │    │  traduce →        │
│  stripe.     │    │  mp.payment       │
│  charges.    │    │  .create(...)     │
│  create(...) │    │                   │
└──────┬───────┘    └────────┬──────────┘
       │                     │
       ▼                     ▼
┌────────────┐      ┌──────────────────┐
│ Stripe SDK │      │ MercadoPago SDK  │   ← Adaptees: las librerías reales
│ (externo)  │      │ (externo)        │
└────────────┘      └──────────────────┘
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Target** | La interfaz que tu sistema espera | `PaymentProcessor` |
| **Adaptee** | La clase/librería con la interfaz incompatible | `Stripe SDK`, `MercadoPago SDK` |
| **Adapter** | Implementa Target, delega en Adaptee | `StripeAdapter`, `MercadoPagoAdapter` |
| **Client** | Usa solo la interfaz Target | `CheckoutService` |

---

## 🌍 Ejemplo — Pasarelas de pago

El escenario: tu sistema de checkout necesita procesar pagos. Tienes dos proveedores con APIs completamente distintas — Stripe y MercadoPago. El Adapter hace que ambos sean intercambiables para el resto de la aplicación.

---

## 💻 Implementación completa

### Target — la interfaz que tu sistema define

```typescript
// payment-processor.interface.ts
interface PaymentResult {
    success: boolean;
    transactionId: string;
    amount: number;
    currency: string;
    provider: string;
}

interface PaymentProcessor {
    processPayment(amount: number, currency: string): Promise<PaymentResult>;
}
```

---

### Adaptee A — Stripe (librería externa)

```typescript
// stripe.sdk.ts — simula el SDK real de Stripe
// Esta clase NO puedes modificarla — es una librería externa
class StripeSDK {
    constructor(private readonly apiKey: string) {}

    // API de Stripe: amount en centavos, retorna un objeto propio
    async charges_create(params: {
        amount: number;    // en centavos (100 = $1.00)
        currency: string;
        source: string;
    }): Promise<{ id: string; status: string; amount: number }> {
        console.log(`[Stripe] Procesando cargo: $${params.amount / 100} ${params.currency}`);
        // Simulación de respuesta exitosa
        return {
            id:     `ch_${Math.random().toString(36).slice(2, 12)}`,
            status: "succeeded",
            amount: params.amount,
        };
    }
}
```

### Adapter A — StripeAdapter

```typescript
// stripe.adapter.ts
class StripeAdapter implements PaymentProcessor {
    private stripe: StripeSDK;

    constructor(apiKey: string) {
        this.stripe = new StripeSDK(apiKey);
    }

    async processPayment(amount: number, currency: string): Promise<PaymentResult> {
        // Traducción 1: convertir dólares → centavos (Stripe los espera así)
        const amountInCents = Math.round(amount * 100);

        const charge = await this.stripe.charges_create({
            amount:   amountInCents,
            currency: currency.toLowerCase(), // Stripe espera minúsculas
            source:   "tok_visa",             // token del método de pago
        });

        // Traducción 2: mapear respuesta de Stripe → PaymentResult
        return {
            success:       charge.status === "succeeded",
            transactionId: charge.id,
            amount,
            currency,
            provider:      "stripe",
        };
    }
}
```

---

### Adaptee B — MercadoPago (librería externa)

```typescript
// mercadopago.sdk.ts — simula el SDK real de MercadoPago
// Esta clase NO puedes modificarla — es una librería externa
class MercadoPagoSDK {
    constructor(private readonly accessToken: string) {}

    // API de MercadoPago: amount directo, estructura diferente, respuesta diferente
    async payment_create(data: {
        transaction_amount: number;  // en la moneda directa (no centavos)
        payment_method_id: string;
        payer: { email: string };
        currency_id: string;
    }): Promise<{ id: number; status: string; transaction_amount: number }> {
        console.log(`[MercadoPago] Procesando pago: $${data.transaction_amount} ${data.currency_id}`);
        return {
            id:                 Math.floor(Math.random() * 1_000_000),
            status:             "approved",
            transaction_amount: data.transaction_amount,
        };
    }
}
```

### Adapter B — MercadoPagoAdapter

```typescript
// mercadopago.adapter.ts
class MercadoPagoAdapter implements PaymentProcessor {
    private mp: MercadoPagoSDK;

    constructor(accessToken: string) {
        this.mp = new MercadoPagoSDK(accessToken);
    }

    async processPayment(amount: number, currency: string): Promise<PaymentResult> {
        const response = await this.mp.payment_create({
            transaction_amount: amount,            // MP usa el amount directo
            payment_method_id:  "visa",
            payer:              { email: "customer@example.com" },
            currency_id:        currency.toUpperCase(), // MP espera mayúsculas
        });

        // Traducción: mapear respuesta de MP → PaymentResult
        return {
            success:       response.status === "approved",
            transactionId: String(response.id),    // MP retorna número, nosotros string
            amount,
            currency,
            provider:      "mercadopago",
        };
    }
}
```

---

### Client — CheckoutService

```typescript
// checkout.service.ts
// Solo conoce PaymentProcessor — nunca menciona Stripe ni MercadoPago
class CheckoutService {
    constructor(private readonly paymentProcessor: PaymentProcessor) {}

    async checkout(
        items: { name: string; price: number }[],
        currency: string = "USD"
    ): Promise<void> {
        const total = items.reduce((sum, item) => sum + item.price, 0);

        console.log(`\nProcesando orden:`);
        items.forEach(item => console.log(`  - ${item.name}: $${item.price}`));
        console.log(`  Total: $${total} ${currency}`);

        const result = await this.paymentProcessor.processPayment(total, currency);

        if (result.success) {
            console.log(`✅ Pago exitoso`);
            console.log(`   Proveedor: ${result.provider}`);
            console.log(`   ID: ${result.transactionId}`);
        } else {
            console.log(`❌ Pago fallido`);
            throw new Error("El pago no pudo procesarse");
        }
    }
}
```

---

### Factory para seleccionar el proveedor

```typescript
// payment.factory.ts
// Combinando Adapter con Factory — el punto de decisión es único
function createPaymentProcessor(): PaymentProcessor {
    const provider = process.env.PAYMENT_PROVIDER ?? "stripe";

    switch (provider) {
        case "stripe":
            return new StripeAdapter(process.env.STRIPE_API_KEY!);
        case "mercadopago":
            return new MercadoPagoAdapter(process.env.MP_ACCESS_TOKEN!);
        default:
            throw new Error(`Proveedor desconocido: ${provider}`);
    }
}
```

---

## 💡 Uso

```typescript
// main.ts
const items = [
    { name: "Laptop",  price: 1200 },
    { name: "Mouse",   price:   45 },
    { name: "Teclado", price:   89 },
];

// Con Stripe
const stripeCheckout = new CheckoutService(
    new StripeAdapter(process.env.STRIPE_API_KEY!)
);
await stripeCheckout.checkout(items, "USD");

// Procesando orden:
//   - Laptop: $1200
//   - Mouse: $45
//   - Teclado: $89
//   Total: $1334 USD
// [Stripe] Procesando cargo: $1334 USD
// ✅ Pago exitoso
//    Proveedor: stripe
//    ID: ch_k2j4h8m9xp

// Con MercadoPago — el CheckoutService no cambió en absoluto
const mpCheckout = new CheckoutService(
    new MercadoPagoAdapter(process.env.MP_ACCESS_TOKEN!)
);
await mpCheckout.checkout(items, "ARS");

// Procesando orden:
//   - Laptop: $1200
//   - Mouse: $45
//   - Teclado: $89
//   Total: $1334 ARS
// [MercadoPago] Procesando pago: $1334 ARS
// ✅ Pago exitoso
//    Proveedor: mercadopago
//    ID: 748291

// Con Factory — el proveedor viene del entorno
const autoCheckout = new CheckoutService(createPaymentProcessor());
await autoCheckout.checkout(items);
```

---

## 🔄 Adapter de objetos vs Adapter de clases

Existen dos variantes del patrón:

### Adapter de objetos (composición) ← recomendado

El Adapter **contiene** una instancia del Adaptee. Es la variante que usamos en el ejemplo.

```typescript
class StripeAdapter implements PaymentProcessor {
    private stripe: StripeSDK; // ← composición: tiene un StripeSDK

    constructor(apiKey: string) {
        this.stripe = new StripeSDK(apiKey);
    }
}
```

✅ Más flexible — puedes adaptar clases sin acceso al código fuente.
✅ Funciona en TypeScript (no hay herencia múltiple).

### Adapter de clases (herencia múltiple)

El Adapter **hereda** del Adaptee. Solo es posible en lenguajes con herencia múltiple (C++, Python).

```python
# Solo posible en Python / C++
class StripeAdapter(PaymentProcessor, StripeSDK):
    def process_payment(self, amount, currency):
        return self.charges_create(amount * 100, currency)
```

⚠️ No aplicable en TypeScript/JavaScript — usar siempre la variante de objetos.

---

## 🌍 Otros casos de uso reales

### Adapter para distintos loggers

```typescript
interface Logger {
    info(message: string): void;
    error(message: string): void;
}

// Winston tiene su propia API
class WinstonAdapter implements Logger {
    private winston = require("winston").createLogger({ /* config */ });

    info(message: string)  { this.winston.info(message); }
    error(message: string) { this.winston.error(message); }
}

// Pino también — diferente API, mismo Adapter
class PinoAdapter implements Logger {
    private pino = require("pino")();

    info(message: string)  { this.pino.info(message); }
    error(message: string) { this.pino.error(message); }
}
```

---

### Adapter para APIs de almacenamiento

```typescript
interface StorageService {
    upload(filename: string, data: Buffer): Promise<string>;  // retorna URL
    delete(filename: string): Promise<void>;
    getUrl(filename: string): string;
}

// S3, Google Cloud Storage, Cloudinary — cada uno tiene su SDK
// Un Adapter por cada proveedor — el código cliente no cambia
class S3Adapter          implements StorageService { /* ... */ }
class CloudinaryAdapter  implements StorageService { /* ... */ }
class LocalStorageAdapter implements StorageService { /* ... */ }
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Principio abierto/cerrado**: puedes agregar nuevos proveedores sin tocar el código existente — solo creates un nuevo Adapter.
- **Principio de responsabilidad única**: la traducción vive en el Adapter, no en el cliente ni en el Adaptee.
- **Reutilización**: integras librerías de terceros sin modificarlas.
- **Intercambiabilidad**: puedes cambiar de proveedor (Stripe → MercadoPago) con un solo cambio en la Factory.
- **Testeable**: en tests puedes inyectar un `MockPaymentProcessor` sin tocar ningún SDK real.

### ❌ Desventajas

- **Más clases**: por cada librería que adaptas, necesitas una clase nueva.
- **Indirección**: hay una capa extra entre el cliente y el servicio real — puede complicar el debugging.
- **Posible pérdida de funcionalidad**: si el Adaptee tiene features que no están en la interfaz Target, quedan ocultos. Debes ampliar la interfaz para exponerlos.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Adapter? |
|---|---|
| Integrar una **librería de terceros** con tu sistema | ✅ Sí |
| Tienes **múltiples proveedores** con APIs distintas (pagos, emails, storage) | ✅ Sí |
| Quieres **aislar** tu código de SDKs externos para poder cambiarlos | ✅ Sí |
| Tienes código **legacy** con interfaz diferente a la que necesitas | ✅ Sí |
| La interfaz de la librería ya es compatible con la tuya | ❌ No hace falta |
| Solo tienes **un proveedor** y nunca cambiará | ❌ Es overengineering |

---

## ⚖️ Comparación con otros patrones estructurales

| Patrón | Qué hace | Diferencia con Adapter |
|---|---|---|
| **Adapter** | Traduce una interfaz a otra | Hace compatible lo incompatible |
| **Facade** | Simplifica una interfaz compleja | No traduce — simplifica y oculta complejidad |
| **Decorator** | Agrega comportamiento sin cambiar la interfaz | No traduce — extiende funcionalidad |
| **Proxy** | Controla el acceso a un objeto | Misma interfaz — agrega control (cache, auth, lazy load) |
| **Bridge** | Separa abstracción de implementación | Diseñado desde el inicio — Adapter se aplica después |

---

*Patrón: Adapter — Familia: Estructurales — GoF (Gang of Four)*
