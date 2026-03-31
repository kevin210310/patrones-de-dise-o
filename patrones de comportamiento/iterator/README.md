# 🔁 Patrón de Comportamiento: Iterator

> Proporciona una forma de recorrer los elementos de una colección secuencialmente sin exponer su representación interna.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Iteradores de colecciones personalizadas](#-ejemplo--iteradores-de-colecciones-personalizadas)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Iterator nativo de TypeScript](#-iterator-nativo-de-typescript)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)

---

## 📋 Descripción

El **Iterator** es un patrón de diseño **de comportamiento** que extrae la lógica de recorrido de una colección y la coloca en un objeto separado llamado *iterador*. El cliente itera sobre la colección sin saber si es un árbol, un grafo, una lista enlazada o cualquier otra estructura.

> 💡 Piénsalo como el índice de un libro: no necesitas saber cómo está impreso ni encuadernado para encontrar el capítulo que buscas — solo sigues el índice.

---

## 🔥 Problema que resuelve

Sin Iterator, el cliente debe conocer la estructura interna de la colección para recorrerla:

```typescript
// ❌ Sin Iterator — el cliente conoce los internos de cada colección
const array = [1, 2, 3];
for (let i = 0; i < array.length; i++) { /* usa array[i] */ }

const tree = new BinaryTree();
// ¿Cómo lo recorro? ¿En orden? ¿Pre-orden? ¿Post-orden?
// El cliente debe implementar el algoritmo de recorrido

// ✅ Con Iterator — mismo código para cualquier colección
const iterator = collection.createIterator();
while (iterator.hasNext()) {
    const item = iterator.next();
    // no importa si es array, árbol, grafo o lista enlazada
}
```

---

## 🗺️ Diagrama

```
  <<interface>>              <<interface>>
   Collection                  Iterator
+ createIterator(): Iter    + hasNext(): boolean
                            + next(): T
        ▲                   + current(): T
        │                         ▲
        │                         │
UserCollection              UserIterator
- users: User[]             - collection: UserCollection
+ createIterator()          - position: number
+ add(user): void           + hasNext()
+ getUsers(): User[]        + next()
                            + current()

RangeCollection             RangeIterator
- start: number             - current: number
- end: number               + hasNext()
- step: number              + next()
+ createIterator()          + current()
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Iterator** | Interfaz con `hasNext()`, `next()`, `current()` | `Iterator<T>` |
| **Concrete Iterator** | Implementa el recorrido para una colección específica | `UserIterator`, `RangeIterator` |
| **Collection** | Interfaz que declara `createIterator()` | `IterableCollection<T>` |
| **Concrete Collection** | La colección real que crea su iterador | `UserCollection`, `RangeCollection` |

---

## 💻 Implementación completa

### Las interfaces

```typescript
// iterator.interface.ts
interface Iterator<T> {
    hasNext(): boolean;
    next(): T;
    current(): T;
    reset(): void;
}

interface IterableCollection<T> {
    createIterator(): Iterator<T>;
    createReverseIterator(): Iterator<T>;
}
```

### Colección de usuarios con dos tipos de iterador

```typescript
// user.ts
interface User {
    id: number;
    name: string;
    role: "admin" | "editor" | "viewer";
    age: number;
}

// user-iterator.ts
class UserIterator implements Iterator<User> {
    private position = 0;

    constructor(private readonly users: User[]) {}

    hasNext(): boolean  { return this.position < this.users.length; }
    current(): User     { return this.users[this.position]; }
    next(): User        { return this.users[this.position++]; }
    reset(): void       { this.position = 0; }
}

class UserReverseIterator implements Iterator<User> {
    private position: number;

    constructor(private readonly users: User[]) {
        this.position = users.length - 1;
    }

    hasNext(): boolean  { return this.position >= 0; }
    current(): User     { return this.users[this.position]; }
    next(): User        { return this.users[this.position--]; }
    reset(): void       { this.position = this.users.length - 1; }
}

// user-collection.ts
class UserCollection implements IterableCollection<User> {
    private users: User[] = [];

    add(user: User): void         { this.users.push(user); }
    getAll(): User[]              { return [...this.users]; }
    getCount(): number            { return this.users.length; }

    createIterator(): Iterator<User> {
        return new UserIterator(this.users);
    }

    createReverseIterator(): Iterator<User> {
        return new UserReverseIterator(this.users);
    }

    // Iterador filtrado — solo usuarios con cierto rol
    createFilteredIterator(role: User["role"]): Iterator<User> {
        return new UserIterator(this.users.filter(u => u.role === role));
    }
}
```

### Colección de rango numérico

```typescript
// range-collection.ts — colección que no almacena datos, los genera al iterar
class RangeIterator implements Iterator<number> {
    private currentValue: number;

    constructor(
        private readonly start: number,
        private readonly end: number,
        private readonly step: number,
    ) {
        this.currentValue = start;
    }

    hasNext(): boolean  { return this.currentValue <= this.end; }
    current(): number   { return this.currentValue; }
    next(): number {
        const val = this.currentValue;
        this.currentValue += this.step;
        return val;
    }
    reset(): void       { this.currentValue = this.start; }
}

class RangeCollection implements IterableCollection<number> {
    constructor(
        private readonly start: number,
        private readonly end: number,
        private readonly step: number = 1,
    ) {}

    createIterator(): Iterator<number> {
        return new RangeIterator(this.start, this.end, this.step);
    }

    createReverseIterator(): Iterator<number> {
        return new RangeIterator(this.end, this.start, -this.step);
    }
}
```

---

## 💡 Uso

```typescript
// main.ts
const collection = new UserCollection();
collection.add({ id: 1, name: "Ana",   role: "admin",  age: 32 });
collection.add({ id: 2, name: "Luis",  role: "editor", age: 28 });
collection.add({ id: 3, name: "Sara",  role: "viewer", age: 24 });
collection.add({ id: 4, name: "Pedro", role: "admin",  age: 41 });
collection.add({ id: 5, name: "Marta", role: "editor", age: 35 });

// ── Iterador normal ───────────────────────────────────────
console.log("=== Recorrido normal ===");
const iterator = collection.createIterator();
while (iterator.hasNext()) {
    const user = iterator.next();
    console.log(`  ${user.id}. ${user.name} (${user.role})`);
}
// 1. Ana (admin)  2. Luis (editor)  3. Sara (viewer) ...

// ── Iterador inverso ──────────────────────────────────────
console.log("\n=== Recorrido inverso ===");
const reverse = collection.createReverseIterator();
while (reverse.hasNext()) {
    console.log(`  ${reverse.next().name}`);
}
// Marta, Pedro, Sara, Luis, Ana

// ── Iterador filtrado ─────────────────────────────────────
console.log("\n=== Solo admins ===");
const admins = collection.createFilteredIterator("admin");
while (admins.hasNext()) {
    console.log(`  ${admins.next().name}`);
}
// Ana, Pedro

// ── Rango numérico ────────────────────────────────────────
console.log("\n=== Pares del 2 al 10 ===");
const range = new RangeCollection(2, 10, 2).createIterator();
while (range.hasNext()) process.stdout.write(range.next() + " ");
// 2 4 6 8 10

// ── Función genérica que acepta cualquier iterador ────────
function printAll<T>(iterator: Iterator<T>, label: string): void {
    console.log(`\n${label}:`);
    while (iterator.hasNext()) console.log(`  →`, iterator.next());
}

printAll(collection.createFilteredIterator("editor"), "Editores");
```

---

## 🟦 Iterator nativo de TypeScript

TypeScript soporta el protocolo de iteración con `Symbol.iterator` — te permite usar `for...of` directamente:

```typescript
class NumberRange implements Iterable<number> {
    constructor(
        private readonly start: number,
        private readonly end: number,
    ) {}

    [Symbol.iterator](): IterableIterator<number> {
        let current = this.start;
        const end   = this.end;

        return {
            next(): IteratorResult<number> {
                if (current <= end) {
                    return { value: current++, done: false };
                }
                return { value: undefined as any, done: true };
            },
            [Symbol.iterator]() { return this; },
        };
    }
}

// Uso nativo con for...of
const range = new NumberRange(1, 5);
for (const n of range) process.stdout.write(n + " ");
// 1 2 3 4 5

// También funciona con spread y destructuring
const nums = [...new NumberRange(1, 3)]; // [1, 2, 3]

// Función generadora — la forma más concisa en TypeScript
function* fibonacci(): Generator<number> {
    let [a, b] = [0, 1];
    while (true) {
        yield a;
        [a, b] = [b, a + b];
    }
}

const fib = fibonacci();
for (let i = 0; i < 8; i++) process.stdout.write(fib.next().value + " ");
// 0 1 1 2 3 5 8 13
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas
- **Principio de responsabilidad única**: la lógica de recorrido sale de la colección.
- **Múltiples iteradores simultáneos**: cada iterador tiene su propio estado de posición — puedes tener varios recorriendo la misma colección independientemente.
- **Interfaz uniforme**: el cliente usa el mismo código para cualquier tipo de colección.

### ❌ Desventajas
- **Overhead**: para colecciones simples como arrays, usar un iterador personalizado es más complejo que un `for` directo.
- **No siempre necesario**: TypeScript ya provee iteradores nativos con `for...of` y generadores.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Iterator? |
|---|---|
| Tienes una **colección personalizada** (árbol, grafo, lista enlazada) | ✅ Sí |
| Necesitas **múltiples formas de recorrer** la misma colección | ✅ Sí |
| Quieres que el cliente use la **misma interfaz** para cualquier colección | ✅ Sí |
| Necesitas **iteradores filtrados** sin copiar la colección | ✅ Sí |
| Solo tienes arrays o Maps estándar | ❌ Usa `for...of` nativo |

---

*Patrón: Iterator — Familia: Comportamiento — GoF (Gang of Four)*
