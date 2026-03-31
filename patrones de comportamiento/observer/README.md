# 👁️ Patrón de Comportamiento: Observer

> Define una dependencia uno-a-muchos entre objetos — cuando uno cambia su estado, todos sus dependientes son notificados y actualizados automáticamente.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Sistema de stock con alertas](#-ejemplo--sistema-de-stock-con-alertas)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ejemplo adicional — EventEmitter reactivo](#-ejemplo-adicional--eventemitter-reactivo)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)

---

## 📋 Descripción

El **Observer** (también llamado *Publish/Subscribe* o *Event Listener*) es un patrón de diseño **de comportamiento** donde un objeto llamado *Subject* mantiene una lista de dependientes llamados *Observers* y los notifica automáticamente cuando su estado cambia.

> 💡 Piénsalo como suscribirse a un canal de YouTube: el canal (Subject) no sabe quiénes son sus suscriptores. Cuando sube un video, YouTube (el mecanismo de notificación) avisa a todos los suscriptores (Observers) automáticamente. Puedes suscribirte o cancelar cuando quieras.

---

## 🔥 Problema que resuelve

Sin Observer, el Subject debe conocer y llamar a cada dependiente directamente — acoplamiento fuerte:

```typescript
// ❌ Sin Observer — el Subject conoce a todos sus dependientes
class StockTracker {
    updatePrice(symbol: string, price: number): void {
        this.emailService.sendAlert(symbol, price);    // acoplado
        this.smsService.sendAlert(symbol, price);       // acoplado
        this.dashboardService.refresh(symbol, price);   // acoplado
        this.logService.log(symbol, price);             // acoplado
        // Agregar un nuevo consumidor = modificar StockTracker
    }
}

// ✅ Con Observer — el Subject solo sabe que tiene suscriptores
class StockTracker {
    updatePrice(symbol: string, price: number): void {
        this.notify({ symbol, price }); // notifica a todos, no sabe quiénes son
    }
}
```

---

## 🗺️ Diagrama

```
  <<interface>>              <<interface>>
     Subject                   Observer
+ subscribe(obs)             + update(event): void
+ unsubscribe(obs)
+ notify(event)
       ▲
       │
  StockMarket                EmailAlert
  - observers: Set           - update(event) → envía email
  - prices: Map
  - subscribe(obs)           SMSAlert
  - unsubscribe(obs)         - update(event) → envía SMS
  - notify(event)
  - updatePrice(...)         Dashboard
  - getPrice(...)            - update(event) → actualiza UI

  StockMarket notifica a TODOS los observers
  registrados cada vez que un precio cambia
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Subject** | Mantiene la lista de observers y los notifica | `StockMarket` |
| **Observer** | Interfaz con `update()` | `StockObserver` |
| **Concrete Observer** | Reacciona al evento de forma específica | `EmailAlert`, `SMSAlert`, `Dashboard`, `Logger` |

---

## 💻 Implementación completa

### Las interfaces

```typescript
// stock-observer.interface.ts
interface StockEvent {
    symbol: string;
    newPrice: number;
    oldPrice: number;
    change: number;        // porcentaje de cambio
    timestamp: Date;
}

interface StockObserver {
    update(event: StockEvent): void;
    getId(): string;       // para identificar el observer en logs
}

interface StockSubject {
    subscribe(observer: StockObserver): void;
    unsubscribe(observer: StockObserver): void;
    notify(event: StockEvent): void;
}
```

### El Subject — el mercado de acciones

```typescript
// stock-market.ts
class StockMarket implements StockSubject {
    private observers = new Set<StockObserver>();
    private prices    = new Map<string, number>();

    subscribe(observer: StockObserver): void {
        this.observers.add(observer);
        console.log(`  ➕ ${observer.getId()} suscrito (total: ${this.observers.size})`);
    }

    unsubscribe(observer: StockObserver): void {
        this.observers.delete(observer);
        console.log(`  ➖ ${observer.getId()} desuscrito`);
    }

    notify(event: StockEvent): void {
        this.observers.forEach(observer => {
            try {
                observer.update(event);
            } catch (err) {
                console.error(`  ⚠️  Error en ${observer.getId()}:`, err);
                // Un observer que falla no detiene a los demás
            }
        });
    }

    updatePrice(symbol: string, newPrice: number): void {
        const oldPrice = this.prices.get(symbol) ?? newPrice;
        this.prices.set(symbol, newPrice);

        const change = oldPrice > 0
            ? ((newPrice - oldPrice) / oldPrice) * 100
            : 0;

        console.log(`\n  📈 ${symbol}: $${oldPrice} → $${newPrice} (${change >= 0 ? "+" : ""}${change.toFixed(2)}%)`);

        this.notify({ symbol, newPrice, oldPrice, change, timestamp: new Date() });
    }

    getPrice(symbol: string): number | undefined {
        return this.prices.get(symbol);
    }
}
```

### Observers concretos

```typescript
// observers/email-alert.observer.ts
class EmailAlert implements StockObserver {
    constructor(
        private readonly email: string,
        private readonly threshold: number, // alerta si cambia más de X%
    ) {}

    getId(): string { return `EmailAlert(${this.email})`; }

    update(event: StockEvent): void {
        if (Math.abs(event.change) >= this.threshold) {
            console.log(`  📧 Email a ${this.email}: ${event.symbol} cambió ${event.change.toFixed(2)}% → $${event.newPrice}`);
        }
    }
}

// observers/sms-alert.observer.ts
class SMSAlert implements StockObserver {
    constructor(
        private readonly phone: string,
        private readonly watchList: string[], // solo estos símbolos
    ) {}

    getId(): string { return `SMSAlert(${this.phone})`; }

    update(event: StockEvent): void {
        if (this.watchList.includes(event.symbol)) {
            console.log(`  📱 SMS a ${this.phone}: ${event.symbol} = $${event.newPrice}`);
        }
    }
}

// observers/dashboard.observer.ts
class Dashboard implements StockObserver {
    private prices: Record<string, number> = {};

    getId(): string { return "Dashboard"; }

    update(event: StockEvent): void {
        this.prices[event.symbol] = event.newPrice;
        const arrow = event.change >= 0 ? "▲" : "▼";
        console.log(`  🖥️  Dashboard actualizado: ${event.symbol} ${arrow} $${event.newPrice}`);
    }

    displayAll(): void {
        console.log("\n  📊 Estado del Dashboard:");
        Object.entries(this.prices).forEach(([sym, price]) => {
            console.log(`     ${sym}: $${price}`);
        });
    }
}

// observers/logger.observer.ts
class StockLogger implements StockObserver {
    private log: StockEvent[] = [];

    getId(): string { return "Logger"; }

    update(event: StockEvent): void {
        this.log.push(event);
        // El logger no imprime — solo registra silenciosamente
    }

    getLog(): StockEvent[]   { return [...this.log]; }
    getCount(): number       { return this.log.length; }
}
```

---

## 💡 Uso

```typescript
// main.ts
const market    = new StockMarket();
const dashboard = new Dashboard();
const logger    = new StockLogger();

const emailAlert = new EmailAlert("trader@mail.com", 2); // alerta si cambia ≥ 2%
const smsAlert   = new SMSAlert("+56912345678", ["AAPL", "TSLA"]);

// Suscripción
market.subscribe(dashboard);
market.subscribe(logger);
market.subscribe(emailAlert);
market.subscribe(smsAlert);

// Cambios de precio — todos los observers son notificados
market.updatePrice("AAPL",  150.00);
// 📈 AAPL: $150.00 → $150.00 (+0.00%)
// 🖥️  Dashboard actualizado: AAPL ▲ $150
// 📱 SMS a +56912345678: AAPL = $150

market.updatePrice("GOOGL", 2800.00);
market.updatePrice("AAPL",  156.00); // +4% → dispara email
// 📈 AAPL: $150.00 → $156.00 (+4.00%)
// 🖥️  Dashboard actualizado
// 📧 Email a trader@mail.com: AAPL cambió +4.00% → $156
// 📱 SMS a +56912345678: AAPL = $156

// Desuscribir el email durante el fin de semana
market.unsubscribe(emailAlert);
market.updatePrice("TSLA", 900.00);
// 🖥️  Dashboard actualizado: TSLA ▲ $900
// 📱 SMS a +56912345678: TSLA = $900
// (EmailAlert no recibe nada — está desuscrito)

dashboard.displayAll();
// 📊 Estado del Dashboard:
//    AAPL: $156    GOOGL: $2800    TSLA: $900

console.log(`\nTotal eventos registrados: ${logger.getCount()}`);
```

---

## ⚡ Ejemplo adicional — EventEmitter reactivo

Una implementación genérica de Observer con tipos — similar a `EventEmitter` de Node.js pero tipada:

```typescript
type EventMap = Record<string, any>;

class TypedEventEmitter<T extends EventMap> {
    private listeners = new Map<keyof T, Set<Function>>();

    on<K extends keyof T>(event: K, listener: (data: T[K]) => void): () => void {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(listener);
        // Retorna función de desuscripción
        return () => this.listeners.get(event)?.delete(listener);
    }

    emit<K extends keyof T>(event: K, data: T[K]): void {
        this.listeners.get(event)?.forEach(listener => listener(data));
    }
}

// Uso tipado
interface AppEvents {
    "user:login":   { userId: string; timestamp: Date };
    "user:logout":  { userId: string };
    "order:placed": { orderId: string; total: number };
}

const emitter = new TypedEventEmitter<AppEvents>();

const offLogin = emitter.on("user:login", ({ userId }) => {
    console.log(`Usuario ${userId} inició sesión`);
});

emitter.on("order:placed", ({ orderId, total }) => {
    console.log(`Orden ${orderId} por $${total}`);
});

emitter.emit("user:login",   { userId: "user_42", timestamp: new Date() });
emitter.emit("order:placed", { orderId: "ord_001", total: 350 });

offLogin(); // desuscribe solo el listener de login
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas
- **Desacoplamiento**: el Subject no conoce a sus Observers — solo sabe que implementan `update()`.
- **Open/Closed**: agregar un nuevo Observer no toca el Subject.
- **Broadcast**: un solo evento notifica a múltiples consumidores simultáneamente.
- **Suscripción dinámica**: los Observers pueden conectarse y desconectarse en runtime.

### ❌ Desventajas
- **Orden de notificación no garantizado**: los observers reciben el evento en orden de suscripción, lo que puede causar dependencias implícitas.
- **Memory leaks**: si no se desuscriben correctamente, los observers pueden quedar en memoria.
- **Cascada de actualizaciones**: un cambio puede disparar notificaciones que causan más cambios — difícil de depurar.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Observer? |
|---|---|
| Cambios en un objeto deben **propagarse a otros** sin conocerlos | ✅ Sí |
| Necesitas **suscripción dinámica** en runtime | ✅ Sí |
| Implementas un sistema de **eventos o mensajería** | ✅ Sí |
| Construyes **UI reactiva** (actualizar vistas cuando cambia el modelo) | ✅ Sí |
| Solo hay un consumidor y nunca cambiará | ❌ Llámalo directamente |

---

*Patrón: Observer — Familia: Comportamiento — GoF (Gang of Four)*
