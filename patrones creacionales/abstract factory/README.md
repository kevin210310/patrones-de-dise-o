# 🏭🏭 Patrón Creacional: Abstract Factory

## 📋 Descripción

Este proyecto implementa el **patrón Abstract Factory** en TypeScript usando como ejemplo un sistema de restaurantes.

La idea central: en lugar de crear productos sueltos, defines una **fábrica por familia**. Cada fábrica concreta garantiza que todos sus productos son coherentes entre sí — un `FastFoodRestaurant` siempre produce `BeefHamburger` + `Soda`, nunca una combinación mezclada.

> 💡 Piénsalo como un menú cerrado: en un restaurante de comida rápida no te sirven agua con ensalada de quinua — todo sigue el estilo del local.

---

## 🔥 Problema que resuelve

Sin Abstract Factory, la creación de productos relacionados puede generar **combinaciones incoherentes**:

```typescript
// ❌ Sin Abstract Factory — nada impide mezclar familias
const hamburger = new BeefHamburger(); // estilo fast food
const drink     = new Water();         // estilo saludable
// Combinación inconsistente — nadie lo garantiza en compilación
```

```typescript
// ✅ Con Abstract Factory — la fábrica garantiza coherencia
const restaurant = new FastFoodRestaurant();
const hamburger  = restaurant.createHamburger(); // → BeefHamburger
const drink      = restaurant.createDrink();     // → Soda
// Siempre compatibles — imposible mezclar familias por error
```

---

## 🏛️ Estructura del proyecto

```
abstract-factory-restaurant/
├── interfaces/
│   ├── Hamburger.ts            # Producto abstracto — contrato de hamburguesa
│   └── Drink.ts                # Producto abstracto — contrato de bebida
├── products/
│   ├── ChickenHamburger.ts     # Producto concreto — familia saludable
│   ├── BeefHamburger.ts        # Producto concreto — familia fast food
│   ├── Water.ts                # Producto concreto — familia saludable
│   └── Soda.ts                 # Producto concreto — familia fast food
├── factories/
│   ├── RestaurantFactory.ts    # Fábrica abstracta — define qué se puede crear
│   ├── FastFoodRestaurant.ts   # Fábrica concreta — familia fast food
│   └── HealthyFoodRestaurant.ts# Fábrica concreta — familia saludable
└── main.ts                     # Cliente — usa la fábrica, ignora los productos concretos
```

---

## 🗺️ Diagrama

```
          <<interface>>              <<interface>>
           Hamburger                   Drink
          + prepare()                 + pour()
               ▲                          ▲
       ┌───────┴───────┐          ┌───────┴───────┐
       │               │          │               │
ChickenHamburger  BeefHamburger  Water           Soda
  (saludable)     (fast food)  (saludable)    (fast food)


          <<interface>>
        RestaurantFactory
       + createHamburger(): Hamburger
       + createDrink(): Drink
               ▲
       ┌───────┴────────────────┐
       │                        │
FastFoodRestaurant     HealthyFoodRestaurant
+ createHamburger()    + createHamburger()
  → BeefHamburger        → ChickenHamburger
+ createDrink()        + createDrink()
  → Soda                 → Water


CLIENTE
  │  recibe RestaurantFactory (cualquiera)
  │  llama createHamburger() y createDrink()
  │  nunca instancia productos directamente
  └──────────────────────────────────────────
```

---

## 🧩 Componentes

### Productos Abstractos — las interfaces

Definen el **contrato** que deben cumplir todos los productos de ese tipo, sin importar la familia.

| Interfaz    | Método      | Descripción                          |
|-------------|-------------|--------------------------------------|
| `Hamburger` | `prepare()` | Prepara la hamburguesa según su tipo |
| `Drink`     | `pour()`    | Sirve la bebida según su tipo        |

### Productos Concretos — las implementaciones

Cada familia tiene su propia versión de cada producto:

| Familia      | Hamburguesa       | Bebida  |
|--------------|-------------------|---------|
| Fast Food    | `BeefHamburger`   | `Soda`  |
| Saludable    | `ChickenHamburger`| `Water` |

### `RestaurantFactory` — Fábrica Abstracta

Declara los métodos de creación para **cada producto** de la familia. Es el contrato que todas las fábricas concretas deben cumplir.

### `FastFoodRestaurant` / `HealthyFoodRestaurant` — Fábricas Concretas

Implementan `RestaurantFactory` y retornan **siempre productos de su propia familia**. Aquí vive la garantía de coherencia.

---

## 💻 Implementación

### Productos abstractos

```typescript
// interfaces/Hamburger.ts
interface Hamburger {
    prepare(): void;
}

// interfaces/Drink.ts
interface Drink {
    pour(): void;
}
```

### Productos concretos

```typescript
// products/BeefHamburger.ts
class BeefHamburger implements Hamburger {
    prepare() {
        console.log("preparando hamburguesa de carne");
    }
}

// products/ChickenHamburger.ts
class ChickenHamburger implements Hamburger {
    prepare() {
        console.log("preparando hamburguesa de pollo");
    }
}

// products/Soda.ts
class Soda implements Drink {
    pour() {
        console.log("sirviendo gaseosa en vaso");
    }
}

// products/Water.ts
class Water implements Drink {
    pour() {
        console.log("sirviendo agua en vaso");
    }
}
```

### Fábrica abstracta

```typescript
// factories/RestaurantFactory.ts
interface RestaurantFactory {
    createHamburger(): Hamburger;
    createDrink(): Drink;
}
```

### Fábricas concretas

```typescript
// factories/FastFoodRestaurant.ts
class FastFoodRestaurant implements RestaurantFactory {
    createHamburger(): Hamburger {
        return new BeefHamburger();  // siempre carne
    }

    createDrink(): Drink {
        return new Soda();           // siempre gaseosa
    }
}

// factories/HealthyFoodRestaurant.ts
class HealthyFoodRestaurant implements RestaurantFactory {
    createHamburger(): Hamburger {
        return new ChickenHamburger(); // siempre pollo
    }

    createDrink(): Drink {
        return new Water();            // siempre agua
    }
}
```

---

## 💡 Uso

El cliente recibe **cualquier fábrica** que cumpla `RestaurantFactory` — no sabe ni necesita saber qué productos concretos produce:

```typescript
// main.ts
function servirCombo(factory: RestaurantFactory): void {
    const hamburger = factory.createHamburger();
    const drink     = factory.createDrink();

    hamburger.prepare();
    drink.pour();
}

// Fast food
console.log("=== Restaurante Fast Food ===");
servirCombo(new FastFoodRestaurant());
// preparando hamburguesa de carne
// sirviendo gaseosa en vaso

// Saludable
console.log("=== Restaurante Saludable ===");
servirCombo(new HealthyFoodRestaurant());
// preparando hamburguesa de pollo
// sirviendo agua en vaso
```

### Cambiando de familia en runtime

La fábrica puede inyectarse por configuración, variable de entorno, o parámetro:

```typescript
const tipo = process.env.RESTAURANT_TYPE;

const factory: RestaurantFactory =
    tipo === "healthy"
        ? new HealthyFoodRestaurant()
        : new FastFoodRestaurant();

servirCombo(factory); // el resto del código no cambia
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Coherencia garantizada**: una fábrica concreta solo produce productos de su familia — es imposible mezclar `BeefHamburger` con `Water` por error.
- **Principio abierto/cerrado**: agregar una nueva familia (ej. `VeganRestaurant`) solo requiere implementar la interfaz `RestaurantFactory` — sin tocar el código existente.
- **Desacoplamiento total**: el cliente trabaja únicamente con interfaces (`Hamburger`, `Drink`, `RestaurantFactory`), nunca con clases concretas.
- **Fácil de testear**: puedes inyectar una `MockFactory` en tests sin modificar el código cliente.

### ❌ Desventajas

- **Explosión de clases**: por cada nueva familia necesitas una fábrica + un producto concreto por cada tipo. Con muchas familias y productos, el número de clases crece rápido.
- **Difícil agregar nuevos tipos de producto**: si quieres agregar `createDessert()` a `RestaurantFactory`, debes modificar **todas** las fábricas concretas existentes.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Abstract Factory? |
|---|---|
| Tienes **familias de objetos relacionados** que deben usarse juntos | ✅ Sí |
| Quieres garantizar **coherencia entre productos** de la misma familia | ✅ Sí |
| El sistema debe ser independiente de **cómo se crean sus productos** | ✅ Sí |
| Solo tienes **un tipo de producto** (no una familia) | ❌ No, usa Factory Method |
| Las familias cambian con mucha frecuencia | ❌ Con cuidado, es costoso de modificar |

---

## ⚖️ Comparación: Factory vs Abstract Factory

| Aspecto | Factory Method | Abstract Factory |
|---|---|---|
| **Crea** | Un tipo de producto | Una familia de productos relacionados |
| **Foco** | Delegar la instanciación de **un objeto** | Garantizar **coherencia entre varios objetos** |
| **Ejemplo en este repo** | `EmailServiceFactory.create()` → un servicio | `RestaurantFactory` → hamburguesa + bebida |
| **Cuándo cambia** | Al agregar un nuevo proveedor | Al agregar una nueva familia completa |
| **Código cliente conoce** | Solo la interfaz del producto | Solo las interfaces de todos los productos |

> 💡 **Regla práctica**: si tu Factory empieza a crear más de un tipo de objeto relacionado, probablemente necesitas Abstract Factory.

---

*Patrón: Abstract Factory — Familia: Creacionales — GoF (Gang of Four)*