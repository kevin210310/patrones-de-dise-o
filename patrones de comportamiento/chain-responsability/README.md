# ⛓️ Patrón de Comportamiento: Chain of Responsibility

> Pasa una solicitud a lo largo de una cadena de manejadores — cada uno decide si la procesa o la pasa al siguiente, sin que el emisor sepa quién la resolverá.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Pipeline de validación de pedidos](#-ejemplo--pipeline-de-validación-de-pedidos)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ejemplo adicional — Soporte técnico por niveles](#-ejemplo-adicional--soporte-técnico-por-niveles)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Comparación con otros patrones de comportamiento](#-comparación-con-otros-patrones-de-comportamiento)

---

## 📋 Descripción

El **Chain of Responsibility** (Cadena de Responsabilidad) es un patrón de diseño **de comportamiento** que permite pasar solicitudes a lo largo de una cadena de manejadores. Cada manejador puede:

1. **Procesar** la solicitud y detener la cadena.
2. **Pasar** la solicitud al siguiente manejador.
3. **Rechazar** la solicitud y detener la cadena con un error.

El emisor de la solicitud **no sabe** qué manejador la resolverá — solo conoce el primero de la cadena.

> 💡 Piénsalo como los filtros de una cafetera: el agua pasa por cada filtro en orden. Cada filtro hace su parte y pasa el resultado al siguiente. Si un filtro falla, el proceso se detiene ahí.

---

## 🔥 Problema que resuelve

Sin Chain of Responsibility, la lógica de validación y procesamiento se acumula en un solo lugar con `if/else` anidados:

```typescript
// ❌ Sin CoR — todo en un método, imposible de mantener o extender
async function procesarPedido(pedido: Pedido, usuario: Usuario): Promise<void> {
    // Validación de autenticación
    if (!usuario.estaAutenticado()) throw new Error("No autenticado");

    // Validación de stock
    for (const item of pedido.items) {
        if (!await inventario.tieneStock(item)) throw new Error("Sin stock");
    }

    // Validación de límite de crédito
    if (pedido.total > usuario.limiteCreditoDisponible()) throw new Error("Sin crédito");

    // Validación de dirección
    if (!pedido.direccion.esValida()) throw new Error("Dirección inválida");

    // Validación de fraude
    if (await detector.esSospechoso(pedido)) throw new Error("Sospechoso de fraude");

    // Proceso real...
    // Si mañana agregas una nueva validación, modificas este método gigante
}

// ✅ Con CoR — cada validación es un manejador independiente
const cadena = new AuthHandler()
    .setNext(new StockHandler())
    .setNext(new CreditHandler())
    .setNext(new AddressHandler())
    .setNext(new FraudHandler());

await cadena.handle(pedido);
// Agregar una validación = agregar un manejador, sin tocar los demás
```

---

## 🗺️ Diagrama

```
CLIENTE
  │
  │ handle(pedido)
  ▼
┌──────────────┐    si pasa    ┌──────────────┐    si pasa    ┌──────────────┐
│ AuthHandler  │ ────────────▶ │ StockHandler │ ────────────▶ │CreditHandler │ ──▶ ...
│              │               │              │               │              │
│ ¿autenticado?│               │ ¿hay stock?  │               │ ¿tiene       │
│  No → lanza  │               │  No → lanza  │               │  crédito?    │
│  Sí → next   │               │  Sí → next   │               │  No → lanza  │
└──────────────┘               └──────────────┘               │  Sí → next   │
                                                               └──────────────┘
                                                                      │
                                                               ┌──────▼───────┐
                                                               │FraudHandler  │
                                                               │              │
                                                               │ ¿es fraude?  │
                                                               │  Sí → lanza  │
                                                               │  No → ✅ OK  │
                                                               └──────────────┘

Cada manejador:
  - tiene referencia al SIGUIENTE
  - decide si procesa o delega
  - puede cortar la cadena en cualquier punto
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Handler** | Interfaz con el método `handle()` y `setNext()` | `OrderHandler` |
| **BaseHandler** | Implementación base que gestiona el encadenamiento | `AbstractOrderHandler` |
| **ConcreteHandler** | Implementa la lógica de decisión específica | `AuthHandler`, `StockHandler`, `CreditHandler`, `AddressHandler`, `FraudHandler` |
| **Client** | Construye la cadena y lanza la solicitud | `OrderService` |

---

## 🌍 Ejemplo — Pipeline de validación de pedidos

El escenario: un sistema de e-commerce donde un pedido debe pasar por múltiples validaciones antes de procesarse. Cada validación es independiente y la cadena puede configurarse distinto según el contexto (pedido normal, pedido express, pedido B2B).

---

## 💻 Implementación completa

### La interfaz y la clase base

```typescript
// order-handler.interface.ts
interface Order {
    id: string;
    userId: string;
    items: { productId: string; qty: number; price: number }[];
    total: number;
    address: { street: string; city: string; country: string; zip: string };
    paymentToken: string;
    isAuthenticated: boolean;
    userCreditLimit: number;
    userOrderCount: number;
}

interface HandlerResult {
    success: boolean;
    message: string;
    stoppedAt?: string;
}

interface OrderHandler {
    setNext(handler: OrderHandler): OrderHandler;
    handle(order: Order): Promise<HandlerResult>;
}

// abstract-order-handler.ts
abstract class AbstractOrderHandler implements OrderHandler {
    private nextHandler: OrderHandler | null = null;

    // setNext retorna el handler recibido — permite encadenamiento fluido
    setNext(handler: OrderHandler): OrderHandler {
        this.nextHandler = handler;
        return handler; // ← clave para el encadenamiento
    }

    // Método de conveniencia: delega al siguiente o retorna éxito si no hay más
    protected async passToNext(order: Order): Promise<HandlerResult> {
        if (this.nextHandler) {
            return this.nextHandler.handle(order);
        }
        // Llegamos al final de la cadena sin errores
        return { success: true, message: "Pedido validado correctamente" };
    }

    // Método de conveniencia: detiene la cadena con un error
    protected reject(reason: string): HandlerResult {
        console.log(`  ❌ [${this.constructor.name}] Rechazado: ${reason}`);
        return { success: false, message: reason, stoppedAt: this.constructor.name };
    }

    // Método de conveniencia: loguea el éxito y continúa
    protected async approve(order: Order, message: string): Promise<HandlerResult> {
        console.log(`  ✅ [${this.constructor.name}] ${message}`);
        return this.passToNext(order);
    }

    abstract handle(order: Order): Promise<HandlerResult>;
}
```

### Manejadores concretos

```typescript
// handlers/auth.handler.ts
class AuthHandler extends AbstractOrderHandler {
    async handle(order: Order): Promise<HandlerResult> {
        console.log(`  🔐 [Auth] Verificando autenticación...`);

        if (!order.isAuthenticated) {
            return this.reject("Usuario no autenticado");
        }
        if (!order.userId) {
            return this.reject("UserId requerido");
        }

        return this.approve(order, `Usuario ${order.userId} autenticado`);
    }
}

// handlers/stock.handler.ts
class StockHandler extends AbstractOrderHandler {
    // Simula un inventario
    private stock = new Map<string, number>([
        ["prod_001", 50],
        ["prod_002", 0],   // sin stock
        ["prod_003", 100],
    ]);

    async handle(order: Order): Promise<HandlerResult> {
        console.log(`  📦 [Stock] Verificando disponibilidad...`);

        for (const item of order.items) {
            const available = this.stock.get(item.productId) ?? 0;

            if (available < item.qty) {
                return this.reject(
                    `Sin stock para ${item.productId} — disponible: ${available}, solicitado: ${item.qty}`
                );
            }
        }

        return this.approve(order, `Stock disponible para ${order.items.length} productos`);
    }
}

// handlers/credit.handler.ts
class CreditHandler extends AbstractOrderHandler {
    async handle(order: Order): Promise<HandlerResult> {
        console.log(`  💳 [Credit] Verificando límite de crédito...`);

        if (order.total > order.userCreditLimit) {
            return this.reject(
                `Total $${order.total} supera el límite de crédito $${order.userCreditLimit}`
            );
        }

        return this.approve(order, `Crédito disponible — total $${order.total} dentro del límite`);
    }
}

// handlers/address.handler.ts
class AddressHandler extends AbstractOrderHandler {
    private readonly supportedCountries = ["CL", "AR", "MX", "CO", "PE"];

    async handle(order: Order): Promise<HandlerResult> {
        console.log(`  📍 [Address] Validando dirección de envío...`);

        const { street, city, country, zip } = order.address;

        if (!street || !city || !country || !zip) {
            return this.reject("Dirección incompleta — todos los campos son requeridos");
        }

        if (!this.supportedCountries.includes(country)) {
            return this.reject(`País ${country} no soportado — disponibles: ${this.supportedCountries.join(", ")}`);
        }

        if (!/^\d{4,6}$/.test(zip)) {
            return this.reject(`Código postal ${zip} inválido`);
        }

        return this.approve(order, `Dirección válida — ${city}, ${country}`);
    }
}

// handlers/fraud.handler.ts
class FraudHandler extends AbstractOrderHandler {
    async handle(order: Order): Promise<HandlerResult> {
        console.log(`  🕵️  [Fraud] Analizando riesgo de fraude...`);

        const riskScore = this.calculateRiskScore(order);

        if (riskScore >= 80) {
            return this.reject(`Alto riesgo de fraude — score: ${riskScore}/100`);
        }

        if (riskScore >= 50) {
            console.log(`  ⚠️  [Fraud] Riesgo medio (${riskScore}/100) — requiere revisión manual`);
            // Podría detenerse o continuar con bandera de revisión
        }

        return this.approve(order, `Análisis de fraude OK — score: ${riskScore}/100`);
    }

    private calculateRiskScore(order: Order): number {
        let score = 0;
        // Pedido muy alto para usuario nuevo
        if (order.total > 1000 && order.userOrderCount < 3) score += 40;
        // Muchos items distintos
        if (order.items.length > 10) score += 20;
        // Token de pago sospechoso (simulación)
        if (order.paymentToken.startsWith("suspicious_")) score += 60;
        return Math.min(score, 100);
    }
}

// handlers/logger.handler.ts — manejador de auditoría (no detiene la cadena)
class LoggerHandler extends AbstractOrderHandler {
    async handle(order: Order): Promise<HandlerResult> {
        console.log(`  📝 [Logger] Registrando pedido ${order.id} — total: $${order.total}`);
        // Siempre continúa — es solo observación
        return this.passToNext(order);
    }
}
```

### El cliente que construye y usa la cadena

```typescript
// order.service.ts
class OrderService {
    private buildChain(): OrderHandler {
        const auth    = new AuthHandler();
        const stock   = new StockHandler();
        const credit  = new CreditHandler();
        const address = new AddressHandler();
        const fraud   = new FraudHandler();
        const logger  = new LoggerHandler();

        // Encadenamiento fluido — setNext retorna el handler recibido
        auth
            .setNext(logger)    // siempre registra
            .setNext(stock)
            .setNext(credit)
            .setNext(address)
            .setNext(fraud);

        return auth; // retorna el primero de la cadena
    }

    async processOrder(order: Order): Promise<HandlerResult> {
        console.log(`\n🛒 Procesando pedido ${order.id}...`);
        const chain  = this.buildChain();
        const result = await chain.handle(order);

        if (result.success) {
            console.log(`\n✅ Pedido ${order.id} aprobado — listo para pago`);
        } else {
            console.log(`\n❌ Pedido ${order.id} rechazado en [${result.stoppedAt}]: ${result.message}`);
        }

        return result;
    }
}
```

---

## 💡 Uso

```typescript
// main.ts
const service = new OrderService();

const baseOrder: Order = {
    id:              "ord_001",
    userId:          "user_42",
    isAuthenticated: true,
    userCreditLimit: 2000,
    userOrderCount:  15,
    total:           350,
    items:           [
        { productId: "prod_001", qty: 2, price: 120 },
        { productId: "prod_003", qty: 1, price: 110 },
    ],
    address: { street: "Av. Principal 123", city: "Santiago", country: "CL", zip: "8320000" },
    paymentToken: "tok_visa_valid",
};

// ── Pedido válido ─────────────────────────────────────────
await service.processOrder(baseOrder);
// 🛒 Procesando pedido ord_001...
//   🔐 [Auth]    ✅ Usuario user_42 autenticado
//   📝 [Logger]  Registrando pedido ord_001 — total: $350
//   📦 [Stock]   ✅ Stock disponible para 2 productos
//   💳 [Credit]  ✅ Crédito disponible
//   📍 [Address] ✅ Dirección válida — Santiago, CL
//   🕵️  [Fraud]  ✅ Análisis OK — score: 0/100
// ✅ Pedido ord_001 aprobado

// ── Falla en autenticación ────────────────────────────────
await service.processOrder({ ...baseOrder, id: "ord_002", isAuthenticated: false });
// 🛒 Procesando pedido ord_002...
//   🔐 [Auth] ❌ Rechazado: Usuario no autenticado
// ❌ Pedido ord_002 rechazado en [AuthHandler]

// ── Falla en stock ────────────────────────────────────────
await service.processOrder({
    ...baseOrder,
    id:    "ord_003",
    items: [{ productId: "prod_002", qty: 1, price: 50 }], // sin stock
    total: 50,
});
// 🛒 Procesando pedido ord_003...
//   🔐 [Auth]   ✅ Usuario autenticado
//   📝 [Logger] Registrando pedido...
//   📦 [Stock]  ❌ Sin stock para prod_002 — disponible: 0, solicitado: 1
// ❌ Pedido ord_003 rechazado en [StockHandler]

// ── Falla en fraude ───────────────────────────────────────
await service.processOrder({
    ...baseOrder,
    id:             "ord_004",
    total:          1500,
    userOrderCount: 1,             // usuario nuevo con pedido alto
    paymentToken:   "suspicious_tok",
});
// 🛒 Procesando pedido ord_004...
//   🔐 [Auth]    ✅ Usuario autenticado
//   📝 [Logger]  Registrando pedido...
//   📦 [Stock]   ✅ Stock disponible
//   💳 [Credit]  ✅ Crédito disponible
//   📍 [Address] ✅ Dirección válida
//   🕵️  [Fraud]  ❌ Alto riesgo de fraude — score: 100/100
// ❌ Pedido ord_004 rechazado en [FraudHandler]
```

---

## 🎯 Ejemplo adicional — Soporte técnico por niveles

Un caso clásico del patrón: escalación de tickets según complejidad:

```typescript
abstract class SupportHandler extends AbstractOrderHandler {
    abstract level: string;
    abstract maxComplexity: number;
}

class L1Support extends AbstractOrderHandler {
    async handle(ticket: any): Promise<HandlerResult> {
        if (ticket.complexity <= 3) {
            console.log(`  👨‍💻 [L1] Resolviendo ticket nivel ${ticket.complexity}`);
            return { success: true, message: `Resuelto por soporte L1` };
        }
        console.log(`  👨‍💻 [L1] Complejidad ${ticket.complexity} — escalando a L2`);
        return this.passToNext(ticket);
    }
}

class L2Support extends AbstractOrderHandler {
    async handle(ticket: any): Promise<HandlerResult> {
        if (ticket.complexity <= 7) {
            console.log(`  👨‍🔧 [L2] Resolviendo ticket nivel ${ticket.complexity}`);
            return { success: true, message: `Resuelto por soporte L2` };
        }
        console.log(`  👨‍🔧 [L2] Complejidad ${ticket.complexity} — escalando a L3`);
        return this.passToNext(ticket);
    }
}

class L3Support extends AbstractOrderHandler {
    async handle(ticket: any): Promise<HandlerResult> {
        console.log(`  🧑‍💼 [L3] Resolviendo ticket crítico nivel ${ticket.complexity}`);
        return { success: true, message: `Resuelto por ingeniería L3` };
    }
}

// Construcción
const soporte = new L1Support();
soporte.setNext(new L2Support()).setNext(new L3Support());

await soporte.handle({ id: "TKT-001", complexity: 2 });
// 👨‍💻 [L1] Resolviendo ticket nivel 2

await soporte.handle({ id: "TKT-002", complexity: 5 });
// 👨‍💻 [L1] Complejidad 5 — escalando a L2
// 👨‍🔧 [L2] Resolviendo ticket nivel 5

await soporte.handle({ id: "TKT-003", complexity: 9 });
// 👨‍💻 [L1] Complejidad 9 — escalando a L2
// 👨‍🔧 [L2] Complejidad 9 — escalando a L3
// 🧑‍💼 [L3] Resolviendo ticket crítico nivel 9
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Principio de responsabilidad única**: cada manejador tiene una sola validación o acción.
- **Principio abierto/cerrado**: agregar una validación = crear un nuevo handler, sin tocar los existentes.
- **Cadena configurable en runtime**: puedes armar distintas cadenas según el contexto (pedido normal vs express vs B2B).
- **Desacoplamiento**: el emisor no sabe quién procesa la solicitud.
- **Manejadores reutilizables**: el `AuthHandler` puede usarse en distintas cadenas.

### ❌ Desventajas

- **Sin garantía de procesamiento**: si ningún handler procesa la solicitud, puede perderse silenciosamente — hay que definir un handler final por defecto.
- **Debugging complejo**: seguir el flujo a través de la cadena puede ser difícil con muchos manejadores.
- **Rendimiento**: si la cadena es larga y cada handler hace operaciones I/O, puede ser lenta — considera cortocircuitar antes.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar CoR? |
|---|---|
| Tienes múltiples validaciones o pasos **secuenciales** | ✅ Sí |
| Quieres que cada paso sea **independiente y testeable** | ✅ Sí |
| La **cadena puede variar** según el contexto o configuración | ✅ Sí |
| Necesitas poder **insertar o quitar pasos** sin modificar los demás | ✅ Sí |
| Solo hay **un paso de procesamiento** | ❌ No hace falta |
| El orden de los pasos **nunca cambia** y son pocos | ❌ Un método simple es suficiente |

---

## ⚖️ Comparación con otros patrones de comportamiento

| Patrón | Cómo distribuye el trabajo | Diferencia clave |
|---|---|---|
| **Chain of Responsibility** | Cadena — uno por vez, hasta que alguno procese | El handler decide si pasa o no |
| **Command** | Encapsula la solicitud en un objeto | No hay cadena — el comando se ejecuta directamente |
| **Mediator** | Hub central que coordina todos | Todos hablan con el mediador, no entre sí |
| **Observer** | Broadcast — todos los suscritos reciben el evento | Todos reciben; en CoR solo uno procesa |
| **Strategy** | Elige un algoritmo entre varios | Solo hay un handler activo; en CoR puede haber varios |

---

*Patrón: Chain of Responsibility — Familia: Comportamiento — GoF (Gang of Four)*
