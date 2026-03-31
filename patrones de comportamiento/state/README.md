# 🚦 Patrón de Comportamiento: State

> Permite que un objeto altere su comportamiento cuando su estado interno cambia — el objeto parecerá cambiar de clase.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Máquina expendedora](#-ejemplo--máquina-expendedora)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ejemplo adicional — Ciclo de vida de un pedido](#-ejemplo-adicional--ciclo-de-vida-de-un-pedido)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)

---

## 📋 Descripción

El **State** es un patrón de diseño **de comportamiento** que permite a un objeto cambiar su comportamiento cuando su estado interno cambia. En lugar de usar `if/else` o `switch` por todo el código para manejar cada estado, cada estado se encapsula en su propia clase.

> 💡 Piénsalo como un semáforo: el objeto (semáforo) es el mismo, pero su comportamiento cambia completamente dependiendo de si está en rojo, amarillo o verde. El State encapsula cada color en su propia clase.

---

## 🔥 Problema que resuelve

Sin State, el código se llena de condicionales que crecen con cada nuevo estado:

```typescript
// ❌ Sin State — switch/if interminable que crece con cada estado nuevo
class VendingMachine {
    private state: "idle" | "hasCoins" | "dispensing" | "outOfStock" = "idle";

    insertCoin(): void {
        if      (this.state === "idle")       { this.state = "hasCoins"; }
        else if (this.state === "hasCoins")   { console.log("Ya tiene monedas"); }
        else if (this.state === "dispensing") { console.log("Espere..."); }
        else if (this.state === "outOfStock") { console.log("Sin stock"); }
        // Agregar un estado nuevo = modificar TODOS los métodos
    }
}

// ✅ Con State — cada estado sabe cómo responder a cada acción
class VendingMachine {
    insertCoin(): void {
        this.state.insertCoin(this); // el estado actual maneja la acción
    }
}
```

---

## 🗺️ Diagrama

```
  VendingMachine (Context)
  - state: VendingState
  - changeState(state)
  + insertCoin()
  + selectProduct()
  + dispense()
  + refund()
       │
       │ delega en
       ▼
  <<interface>>
  VendingState
  + insertCoin(machine)
  + selectProduct(machine)
  + dispense(machine)
  + refund(machine)
       ▲
       │ implementa
  ┌────┼────────────────┐
  │    │                │
IdleState  HasCoinsState  OutOfStockState
  │         │
  │ coin    │ select
  └──▶HasCoins──▶Dispensing──▶Idle
                             (ciclo)
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Context** | Mantiene referencia al estado actual y delega las acciones | `VendingMachine` |
| **State** | Interfaz con un método por cada acción | `VendingState` |
| **Concrete State** | Implementa el comportamiento para ese estado específico | `IdleState`, `HasCoinsState`, `DispensingState`, `OutOfStockState` |

---

## 💻 Implementación completa

### La interfaz State

```typescript
// vending-state.interface.ts
interface VendingState {
    insertCoin(machine: VendingMachine): void;
    selectProduct(machine: VendingMachine, productId: string): void;
    dispense(machine: VendingMachine): void;
    refund(machine: VendingMachine): void;
    getStateName(): string;
}
```

### El Context — la máquina expendedora

```typescript
// vending-machine.ts
interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
}

class VendingMachine {
    private state:           VendingState;
    private insertedCoins:   number = 0;
    private selectedProduct: Product | null = null;
    private products:        Map<string, Product>;

    constructor(products: Product[]) {
        this.products = new Map(products.map(p => [p.id, p]));
        // Estado inicial
        this.state = new IdleState();
        console.log(`  🤖 Máquina iniciada — estado: ${this.state.getStateName()}`);
    }

    // Acciones públicas — delegan al estado actual
    insertCoin(amount: number): void {
        this.insertedCoins += amount;
        console.log(`\n  💰 Insertando $${amount} (total: $${this.insertedCoins})`);
        this.state.insertCoin(this);
    }

    selectProduct(productId: string): void {
        console.log(`\n  🔘 Seleccionando producto: ${productId}`);
        this.state.selectProduct(this, productId);
    }

    dispense(): void {
        this.state.dispense(this);
    }

    refund(): void {
        console.log(`\n  🔄 Solicitando reembolso`);
        this.state.refund(this);
    }

    // Métodos internos para que los estados manipulen la máquina
    changeState(state: VendingState): void {
        console.log(`  🔄 Estado: ${this.state.getStateName()} → ${state.getStateName()}`);
        this.state = state;
    }

    getInsertedCoins(): number          { return this.insertedCoins; }
    setInsertedCoins(amount: number)    { this.insertedCoins = amount; }
    getSelectedProduct(): Product | null { return this.selectedProduct; }
    setSelectedProduct(p: Product | null){ this.selectedProduct = p; }

    getProduct(id: string): Product | undefined { return this.products.get(id); }
    hasStock(): boolean {
        return Array.from(this.products.values()).some(p => p.stock > 0);
    }

    decreaseStock(productId: string): void {
        const product = this.products.get(productId);
        if (product) product.stock--;
    }

    getStateName(): string { return this.state.getStateName(); }
}
```

### Estados concretos

```typescript
// states/idle.state.ts
class IdleState implements VendingState {
    getStateName() { return "Idle (esperando monedas)"; }

    insertCoin(machine: VendingMachine): void {
        console.log(`  ✅ Monedas aceptadas`);
        machine.changeState(new HasCoinsState());
    }

    selectProduct(machine: VendingMachine, productId: string): void {
        console.log(`  ❌ Primero inserte monedas`);
    }

    dispense(machine: VendingMachine): void {
        console.log(`  ❌ Sin monedas ni producto seleccionado`);
    }

    refund(machine: VendingMachine): void {
        console.log(`  ❌ No hay nada que reembolsar`);
    }
}

// states/has-coins.state.ts
class HasCoinsState implements VendingState {
    getStateName() { return "HasCoins (con monedas)"; }

    insertCoin(machine: VendingMachine): void {
        console.log(`  ✅ Monedas adicionales aceptadas (total: $${machine.getInsertedCoins()})`);
    }

    selectProduct(machine: VendingMachine, productId: string): void {
        const product = machine.getProduct(productId);

        if (!product) {
            console.log(`  ❌ Producto ${productId} no encontrado`);
            return;
        }
        if (product.stock === 0) {
            console.log(`  ❌ ${product.name} sin stock`);
            return;
        }
        if (machine.getInsertedCoins() < product.price) {
            console.log(`  ❌ Fondos insuficientes — necesitas $${product.price}, tienes $${machine.getInsertedCoins()}`);
            return;
        }

        console.log(`  ✅ Producto seleccionado: ${product.name} ($${product.price})`);
        machine.setSelectedProduct(product);
        machine.changeState(new DispensingState());
        machine.dispense(); // dispara el dispensado inmediatamente
    }

    dispense(machine: VendingMachine): void {
        console.log(`  ❌ Selecciona un producto primero`);
    }

    refund(machine: VendingMachine): void {
        const amount = machine.getInsertedCoins();
        machine.setInsertedCoins(0);
        console.log(`  ✅ Reembolso de $${amount}`);
        machine.changeState(new IdleState());
    }
}

// states/dispensing.state.ts
class DispensingState implements VendingState {
    getStateName() { return "Dispensing (dispensando)"; }

    insertCoin(machine: VendingMachine): void {
        console.log(`  ⚠️  Espere, dispensando producto...`);
    }

    selectProduct(machine: VendingMachine, productId: string): void {
        console.log(`  ⚠️  Espere, dispensando producto...`);
    }

    dispense(machine: VendingMachine): void {
        const product = machine.getSelectedProduct()!;
        const change  = machine.getInsertedCoins() - product.price;

        machine.decreaseStock(product.id);
        machine.setInsertedCoins(0);
        machine.setSelectedProduct(null);

        console.log(`  🎁 Dispensando: ${product.name}`);
        if (change > 0) console.log(`  💵 Cambio: $${change}`);

        // Verifica si queda stock para decidir el próximo estado
        if (machine.hasStock()) {
            machine.changeState(new IdleState());
        } else {
            machine.changeState(new OutOfStockState());
        }
    }

    refund(machine: VendingMachine): void {
        console.log(`  ❌ No se puede reembolsar mientras se dispensa`);
    }
}

// states/out-of-stock.state.ts
class OutOfStockState implements VendingState {
    getStateName() { return "OutOfStock (sin stock)"; }

    insertCoin(machine: VendingMachine): void {
        console.log(`  ❌ Sin stock — reembolsando $${machine.getInsertedCoins()}`);
        machine.setInsertedCoins(0);
    }

    selectProduct(machine: VendingMachine, productId: string): void {
        console.log(`  ❌ Sin stock disponible`);
    }

    dispense(machine: VendingMachine): void {
        console.log(`  ❌ Sin stock`);
    }

    refund(machine: VendingMachine): void {
        console.log(`  ❌ No hay monedas insertadas`);
    }
}
```

---

## 💡 Uso

```typescript
const machine = new VendingMachine([
    { id: "A1", name: "Coca-Cola", price: 150, stock: 2 },
    { id: "A2", name: "Agua",      price: 100, stock: 1 },
]);

// Flujo normal
machine.insertCoin(100);
machine.insertCoin(100); // total: 200
machine.selectProduct("A1"); // Coca-Cola $150 → dispensa, vuelve 50 de cambio

// Sin fondos suficientes
machine.insertCoin(50);
machine.selectProduct("A1"); // ❌ necesita $150, solo tiene $50
machine.refund();             // ✅ reembolso de $50

// Último item → OutOfStock
machine.insertCoin(150);
machine.selectProduct("A2");  // Agua $100 → dispensa, vuelve $50
// Stock de A1 = 1, A2 = 0 → todavía hay stock → IdleState
machine.insertCoin(200);
machine.selectProduct("A1");  // último Coca-Cola → OutOfStockState

machine.insertCoin(100); // ❌ sin stock — reembolso automático
```

---

## 📦 Ejemplo adicional — Ciclo de vida de un pedido

```typescript
// Los estados del pedido como clases independientes
interface OrderState {
    confirm(order: Order): void;
    ship(order: Order): void;
    deliver(order: Order): void;
    cancel(order: Order): void;
    getName(): string;
}

class PendingState implements OrderState {
    getName() { return "Pendiente"; }
    confirm(order: Order): void { console.log("✅ Confirmado"); order.setState(new ConfirmedState()); }
    ship(order: Order):    void { console.log("❌ Confirmar primero"); }
    deliver(order: Order): void { console.log("❌ No enviado aún"); }
    cancel(order: Order):  void { console.log("✅ Cancelado"); order.setState(new CancelledState()); }
}

class ConfirmedState implements OrderState {
    getName() { return "Confirmado"; }
    confirm(order: Order): void { console.log("ℹ️ Ya confirmado"); }
    ship(order: Order):    void { console.log("✅ En camino"); order.setState(new ShippedState()); }
    deliver(order: Order): void { console.log("❌ No enviado aún"); }
    cancel(order: Order):  void { console.log("✅ Cancelado"); order.setState(new CancelledState()); }
}

class ShippedState implements OrderState {
    getName() { return "En camino"; }
    confirm(order: Order): void { console.log("❌ Ya enviado"); }
    ship(order: Order):    void { console.log("ℹ️ Ya en camino"); }
    deliver(order: Order): void { console.log("✅ Entregado"); order.setState(new DeliveredState()); }
    cancel(order: Order):  void { console.log("❌ No se puede cancelar un envío en curso"); }
}

class DeliveredState implements OrderState {
    getName() { return "Entregado"; }
    confirm(order: Order): void { console.log("❌ Ya entregado"); }
    ship(order: Order):    void { console.log("❌ Ya entregado"); }
    deliver(order: Order): void { console.log("ℹ️ Ya entregado"); }
    cancel(order: Order):  void { console.log("❌ No se puede cancelar un pedido entregado"); }
}

class CancelledState implements OrderState {
    getName() { return "Cancelado"; }
    confirm(order: Order): void { console.log("❌ Pedido cancelado"); }
    ship(order: Order):    void { console.log("❌ Pedido cancelado"); }
    deliver(order: Order): void { console.log("❌ Pedido cancelado"); }
    cancel(order: Order):  void { console.log("ℹ️ Ya cancelado"); }
}
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas
- **Elimina condicionales**: no más `switch(state)` dispersos por el código.
- **Principio abierto/cerrado**: agregar un estado nuevo = crear una clase, sin tocar las existentes.
- **Responsabilidad única**: cada estado sabe exactamente cómo responder a cada acción.
- **Transiciones explícitas**: el flujo de estados es claro y fácil de visualizar.

### ❌ Desventajas
- **Muchas clases**: un estado por cada combinación puede generar muchos archivos.
- **Acoplamiento State-Context**: los estados concretos necesitan conocer al Context para cambiarlo.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar State? |
|---|---|
| Un objeto cambia su comportamiento según su **estado interno** | ✅ Sí |
| Tienes `if/else` o `switch` que crecen con cada estado nuevo | ✅ Sí |
| Los **estados y transiciones** son numerosos o complejos | ✅ Sí |
| Implementas una **máquina de estados finita** | ✅ Sí |
| Solo tienes 2 estados simples que nunca crecerán | ❌ Un booleano es suficiente |

---

*Patrón: State — Familia: Comportamiento — GoF (Gang of Four)*
