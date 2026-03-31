# 🏛️ Patrón Estructural: Facade

> Provee una interfaz simplificada a un subsistema complejo — el cliente llama un solo método sin saber nada de lo que ocurre por dentro.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Proceso de compra](#-ejemplo--proceso-de-compra)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Comparación con otros patrones estructurales](#-comparación-con-otros-patrones-estructurales)

---

## 📋 Descripción

El **Facade** es un patrón de diseño **estructural** que provee una interfaz simplificada a un conjunto de interfaces en un subsistema complejo. No agrega funcionalidad nueva — **oculta la complejidad** y expone solo lo que el cliente necesita.

> 💡 Piénsalo como el panel de un automóvil: el volante, el acelerador y el freno son la fachada. No necesitas saber nada del motor, la transmisión ni el sistema hidráulico para manejar.

---

## 🔥 Problema que resuelve

Sin Facade, el código cliente debe conocer y coordinar múltiples subsistemas — acoplamiento total:

```typescript
// ❌ Sin Facade — el cliente hace todo el trabajo
async function realizarCompra(userId: string, items: Item[], cardToken: string) {
    const inventory = new InventoryService();
    const payment   = new PaymentService();
    const order     = new OrderService();
    const shipping  = new ShippingService();
    const email     = new EmailService();
    const loyalty   = new LoyaltyService();

    await inventory.checkStock(items);
    await inventory.reserveItems(items);
    const charge = await payment.charge(cardToken, calculateTotal(items));
    const ord    = await order.create(userId, items, charge.id);
    await shipping.schedule(ord.id, userId);
    await email.sendConfirmation(userId, ord.id);
    await loyalty.addPoints(userId, ord.total);
    // ¿Y el rollback si algo falla? ¿Quién lo maneja?
}
```

```typescript
// ✅ Con Facade — el cliente llama un solo método
const checkout = new CheckoutFacade();
await checkout.purchase(userId, items, cardToken);
```

---

## 🗺️ Diagrama

```
  CLIENTE
  Solo conoce CheckoutFacade.
  No importa ningún subsistema directamente.
       │
       │ purchase() / cancelOrder()
       ▼
┌──────────────────────────────────────────┐
│           CheckoutFacade                 │
│                                          │
│  - inventory : InventoryService          │
│  - payment   : PaymentService            │
│  - order     : OrderService              │
│  - shipping  : ShippingService           │
│  - email     : EmailService              │
│  - loyalty   : LoyaltyService            │
│                                          │
│  + purchase(userId, items, cardToken)    │
│  + cancelOrder(orderId, userId, chargeId)│
│  - rollback(reservationId, chargeId)     │
└────┬──────┬──────┬───────┬───────┬───────┘
     │      │      │       │       │
     ▼      ▼      ▼       ▼       ▼
Inventory Payment Order Shipping Email  Loyalty
 Service  Service  Svc   Service  Svc   Service
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Facade** | Interfaz simplificada que orquesta los subsistemas | `CheckoutFacade` |
| **Subsystems** | Clases con lógica compleja e independiente | `InventoryService`, `PaymentService`, `OrderService`, `ShippingService`, `EmailService`, `LoyaltyService` |
| **Client** | Usa solo la Facade, nunca los subsistemas directamente | `main.ts` |

---

## 🌍 Ejemplo — Proceso de compra

El escenario: un e-commerce con 6 subsistemas independientes. El cliente solo quiere "comprar" — la Facade orquesta todo lo demás, incluyendo el rollback si algo falla.

---

## 💻 Implementación completa

### Los subsistemas

```typescript
// services/inventory.service.ts
class InventoryService {
    async checkStock(items: { id: string; qty: number }[]): Promise<void> {
        console.log(`  📦 [Inventory] Verificando stock de ${items.length} productos...`);
        const outOfStock = items.find(i => i.qty > 100);
        if (outOfStock) throw new Error(`Sin stock: producto ${outOfStock.id}`);
        console.log(`  📦 [Inventory] Stock disponible ✅`);
    }

    async reserveItems(items: { id: string; qty: number }[]): Promise<string> {
        const reservationId = `res_${Math.random().toString(36).slice(2, 10)}`;
        console.log(`  📦 [Inventory] Reserva creada: ${reservationId}`);
        return reservationId;
    }

    async releaseReservation(reservationId: string): Promise<void> {
        console.log(`  📦 [Inventory] Liberando reserva ${reservationId}...`);
    }
}

// services/payment.service.ts
class PaymentService {
    async charge(
        cardToken: string,
        amount: number,
        currency: string = "USD"
    ): Promise<{ chargeId: string; amount: number }> {
        console.log(`  💳 [Payment] Cobrando $${amount} ${currency}...`);
        const chargeId = `ch_${Math.random().toString(36).slice(2, 10)}`;
        console.log(`  💳 [Payment] Cargo exitoso: ${chargeId}`);
        return { chargeId, amount };
    }

    async refund(chargeId: string): Promise<void> {
        console.log(`  💳 [Payment] Reembolsando cargo ${chargeId}...`);
    }
}

// services/order.service.ts
class OrderService {
    async create(
        userId: string,
        items: { id: string; qty: number; price: number }[],
        chargeId: string
    ): Promise<{ orderId: string; total: number }> {
        const total   = items.reduce((s, i) => s + i.qty * i.price, 0);
        const orderId = `ord_${Math.random().toString(36).slice(2, 10)}`;
        console.log(`  🗒️  [Order] Orden creada: ${orderId} — Total: $${total}`);
        return { orderId, total };
    }

    async cancel(orderId: string): Promise<void> {
        console.log(`  🗒️  [Order] Cancelando orden ${orderId}...`);
    }
}

// services/shipping.service.ts
class ShippingService {
    async schedule(orderId: string, userId: string): Promise<{ trackingId: string }> {
        const trackingId = `track_${Math.random().toString(36).slice(2, 10)}`;
        console.log(`  🚚 [Shipping] Envío programado — Tracking: ${trackingId}`);
        return { trackingId };
    }
}

// services/email.service.ts
class EmailService {
    async sendOrderConfirmation(
        userId: string,
        orderId: string,
        trackingId: string
    ): Promise<void> {
        console.log(`  📧 [Email] Confirmación enviada — Orden: ${orderId}, Tracking: ${trackingId}`);
    }

    async sendCancellationNotice(userId: string, orderId: string): Promise<void> {
        console.log(`  📧 [Email] Notificación de cancelación enviada — Orden: ${orderId}`);
    }
}

// services/loyalty.service.ts
class LoyaltyService {
    async addPoints(userId: string, amount: number): Promise<number> {
        const points = Math.floor(amount);
        console.log(`  ⭐ [Loyalty] +${points} puntos para usuario ${userId}`);
        return points;
    }
}
```

### La Facade

```typescript
// checkout.facade.ts
interface PurchaseItem {
    id: string;
    qty: number;
    price: number;
}

interface PurchaseResult {
    orderId: string;
    trackingId: string;
    total: number;
    pointsEarned: number;
}

class CheckoutFacade {
    private inventory = new InventoryService();
    private payment   = new PaymentService();
    private order     = new OrderService();
    private shipping  = new ShippingService();
    private email     = new EmailService();
    private loyalty   = new LoyaltyService();

    async purchase(
        userId: string,
        items: PurchaseItem[],
        cardToken: string,
        currency: string = "USD"
    ): Promise<PurchaseResult> {
        console.log(`\n🛒 Iniciando proceso de compra para usuario ${userId}...`);

        let reservationId: string | null = null;
        let chargeId: string | null      = null;

        try {
            // 1. Verificar y reservar stock
            await this.inventory.checkStock(items);
            reservationId = await this.inventory.reserveItems(items);

            // 2. Procesar pago
            const total  = items.reduce((s, i) => s + i.qty * i.price, 0);
            const charge = await this.payment.charge(cardToken, total, currency);
            chargeId     = charge.chargeId;

            // 3. Crear orden
            const { orderId } = await this.order.create(userId, items, chargeId);

            // 4. Programar envío
            const { trackingId } = await this.shipping.schedule(orderId, userId);

            // 5. Enviar confirmación
            await this.email.sendOrderConfirmation(userId, orderId, trackingId);

            // 6. Acumular puntos de lealtad
            const pointsEarned = await this.loyalty.addPoints(userId, total);

            console.log(`✅ Compra completada exitosamente\n`);
            return { orderId, trackingId, total, pointsEarned };

        } catch (error) {
            // El rollback es completamente transparente para el cliente
            console.log(`\n❌ Error — iniciando rollback...`);
            await this.rollback(reservationId, chargeId);
            throw error;
        }
    }

    async cancelOrder(
        orderId: string,
        userId: string,
        chargeId: string
    ): Promise<void> {
        console.log(`\n🔄 Cancelando orden ${orderId}...`);
        await this.order.cancel(orderId);
        await this.payment.refund(chargeId);
        await this.email.sendCancellationNotice(userId, orderId);
        console.log(`✅ Orden cancelada\n`);
    }

    // Completamente oculto al cliente
    private async rollback(
        reservationId: string | null,
        chargeId: string | null
    ): Promise<void> {
        if (reservationId) await this.inventory.releaseReservation(reservationId);
        if (chargeId)      await this.payment.refund(chargeId);
        console.log(`🔄 Rollback completado`);
    }
}
```

---

## 💡 Uso

```typescript
// main.ts
const checkout = new CheckoutFacade();

const items: PurchaseItem[] = [
    { id: "prod_001", qty: 1, price: 1200 },
    { id: "prod_002", qty: 2, price:   45 },
    { id: "prod_003", qty: 1, price:   89 },
];

// El cliente llama un solo método
const result = await checkout.purchase("user_42", items, "tok_visa_4242");

// 🛒 Iniciando proceso de compra para usuario user_42...
//   📦 [Inventory] Verificando stock de 3 productos...
//   📦 [Inventory] Stock disponible ✅
//   📦 [Inventory] Reserva creada: res_k2j4m8xp
//   💳 [Payment] Cobrando $1379 USD...
//   💳 [Payment] Cargo exitoso: ch_9d3f7h2k
//   🗒️  [Order] Orden creada: ord_5b8n1q4r — Total: $1379
//   🚚 [Shipping] Envío programado — Tracking: track_7x2p9m1j
//   📧 [Email] Confirmación enviada — Orden: ord_5b8n1q4r
//   ⭐ [Loyalty] +1379 puntos para usuario user_42
// ✅ Compra completada exitosamente

console.log(result);
// { orderId: 'ord_5b8n1q4r', trackingId: 'track_7x2p9m1j', total: 1379, pointsEarned: 1379 }

// Cancelar también es de una línea
await checkout.cancelOrder(result.orderId, "user_42", "ch_9d3f7h2k");
// 🔄 Cancelando orden ord_5b8n1q4r...
//   🗒️  [Order] Cancelando orden...
//   💳 [Payment] Reembolsando cargo...
//   📧 [Email] Notificación de cancelación enviada
// ✅ Orden cancelada
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Simplifica el código cliente** drásticamente — de 15 líneas a 1.
- **Centraliza la coordinación** y el manejo de errores/rollback en un solo lugar.
- **Desacopla** al cliente de los subsistemas internos — puedes refactorizar `ShippingService` sin tocar al cliente.
- **Punto único de entrada** al subsistema — fácil de encontrar y mantener.

### ❌ Desventajas

- **Objeto dios potencial**: si crece sin control, la Facade se vuelve enorme y difícil de mantener.
- **Oculta funcionalidad avanzada**: el cliente pierde acceso directo a operaciones específicas de cada subsistema.
- **Falsa simplicidad**: si el cliente necesita control fino, la Facade se convierte en un obstáculo.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Facade? |
|---|---|
| Necesitas **simplificar** una API compleja para el cliente | ✅ Sí |
| Tienes múltiples subsistemas que siempre se usan **juntos** | ✅ Sí |
| Quieres **aislar** al cliente de cambios en los subsistemas | ✅ Sí |
| Necesitas un **punto de entrada único** a un módulo | ✅ Sí |
| El cliente necesita **control fino** sobre cada subsistema | ❌ Expón los servicios directamente |
| El subsistema es simple y tiene pocas clases | ❌ Es overengineering |

---

## ⚖️ Comparación con otros patrones estructurales

| Patrón | Interfaz | Propósito |
|---|---|---|
| **Facade** | Nueva, simplificada | Simplificar acceso a un subsistema complejo |
| **Decorator** | Misma | Agregar comportamiento en capas sin modificar la clase |
| **Adapter** | Traduce una a otra | Hacer compatible una interfaz incompatible |
| **Proxy** | Misma | Controlar acceso a un objeto |
| **Mediator** | Nueva | Centralizar comunicación entre objetos (sin ocultar subsistemas) |

> 💡 **Facade vs Adapter**: ambos introducen una nueva interfaz, pero Facade simplifica, Adapter traduce. Facade se diseña desde el inicio; Adapter se aplica cuando hay incompatibilidad.

---

*Patrón: Facade — Familia: Estructurales — GoF (Gang of Four)*
