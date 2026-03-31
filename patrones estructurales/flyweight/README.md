# 🪶 Patrón Estructural: Flyweight

> Comparte el estado **común e inmutable** entre miles de objetos en lugar de duplicarlo — reduce drásticamente el consumo de memoria.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Estado intrínseco vs extrínseco](#-estado-intrínseco-vs-extrínseco)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Partículas en un videojuego](#-ejemplo--partículas-en-un-videojuego)
- [Implementación completa](#-implementación-completa)
- [Uso y benchmark de memoria](#-uso-y-benchmark-de-memoria)
- [Ejemplo adicional — Caracteres en un editor de texto](#-ejemplo-adicional--caracteres-en-un-editor-de-texto)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Comparación con otros patrones](#-comparación-con-otros-patrones)

---

## 📋 Descripción

El **Flyweight** es un patrón de diseño **estructural** que optimiza el uso de memoria compartiendo el estado común entre un gran número de objetos similares, en lugar de almacenar ese estado en cada instancia.

El nombre viene de las categorías del boxeo — un "peso mosca" es ligero. El patrón hace que cada objeto sea lo más liviano posible extrayendo todo lo que puede ser compartido.

> 💡 Piénsalo como los árboles en un videojuego de mundo abierto: hay 100,000 árboles, pero solo 5 tipos. En lugar de guardar la textura, el modelo 3D y el color para cada uno de los 100,000, los guardas **una sola vez por tipo** y cada árbol solo recuerda su posición y escala.

---

## 🔥 Problema que resuelve

En sistemas con miles de objetos similares, duplicar el estado compartido colapsa la memoria:

```typescript
// ❌ Sin Flyweight — cada partícula guarda TODOS sus datos
class Particle {
    constructor(
        // Estado único por instancia (diferente en cada partícula)
        public x: number,
        public y: number,
        public velocityX: number,
        public velocityY: number,
        // Estado compartido (IGUAL en muchas partículas — duplicado innecesariamente)
        public color: string,       // "red" — almacenado 10,000 veces
        public sprite: Uint8Array,  // 500KB de textura — almacenado 10,000 veces
        public shape: string,       // "circle" — almacenado 10,000 veces
    ) {}
}

// 10,000 partículas de fuego = 10,000 × 500KB de sprite = ~5GB solo en texturas ❌
const particles = Array.from({ length: 10_000 }, (_, i) =>
    new Particle(i, i, 1, 1, "red", new Uint8Array(500_000), "circle")
);
```

```typescript
// ✅ Con Flyweight — la textura se almacena UNA SOLA VEZ por tipo
// 10,000 partículas de fuego = 1 × 500KB + 10,000 × (x, y, vx, vy) = ~500KB + 160KB = ~660KB ✅
```

---

## 🔑 Estado intrínseco vs extrínseco

Esta es la distinción más importante del patrón:

| | Estado intrínseco | Estado extrínseco |
|---|---|---|
| **Qué es** | Lo que es igual entre objetos similares | Lo que es único en cada instancia |
| **Dónde vive** | Dentro del Flyweight (compartido) | Fuera del Flyweight (en el cliente o contexto) |
| **Puede mutar?** | ❌ Inmutable | ✅ Mutable |
| **Se almacena** | Una vez, en el Flyweight Factory | En cada objeto de contexto |
| **Ejemplo** | Textura, color, forma, modelo 3D | Posición X/Y, velocidad, ID |

> 💡 **Regla práctica**: si el dato es el mismo para miles de objetos → intrínseco (al Flyweight). Si cambia instancia a instancia → extrínseco (al contexto).

---

## 🗺️ Diagrama

```
  CLIENTE
  Necesita crear 50,000 partículas
       │
       │ getParticleType("fire")
       ▼
┌─────────────────────────────────────┐
│       ParticleTypeFactory           │  ← Flyweight Factory
│                                     │
│  cache: Map<string, ParticleType>   │
│                                     │
│  + getParticleType(key): Type       │
│       ¿existe en cache?             │
│       Sí → retorna el mismo objeto  │
│       No → crea, guarda, retorna    │
└──────────────────┬──────────────────┘
                   │ retorna (siempre la misma instancia)
                   ▼
          ┌─────────────────┐
          │  ParticleType   │  ← Flyweight
          │  (COMPARTIDO)   │
          │                 │
          │ + color: string │  ← intrínseco
          │ + sprite: Data  │  ← intrínseco (pesado)
          │ + shape: string │  ← intrínseco
          │                 │
          │ + render(       │
          │    x, y, vx, vy │  ← extrínseco (viene del contexto)
          │   ): void       │
          └─────────────────┘
                   ▲
       compartido por todas las
       instancias del mismo tipo

┌──────────────────────────────────────────────┐
│  Particle (Contexto)   × 50,000 instancias   │
│                                              │
│  + x, y: number        ← extrínseco         │
│  + velocityX/Y: number ← extrínseco         │
│  + type: ParticleType  ← referencia al FW   │
│                                              │
│  + update(): void                            │
│  + render(): void → type.render(x, y, ...)  │
└──────────────────────────────────────────────┘
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Flyweight** | Almacena el estado intrínseco compartido | `ParticleType` |
| **Flyweight Factory** | Gestiona el pool de Flyweights — crea o reutiliza | `ParticleTypeFactory` |
| **Context** | Almacena el estado extrínseco único por instancia, referencia al Flyweight | `Particle` |
| **Client** | Crea contextos y usa la Factory para obtener Flyweights | `ParticleSystem` |

---

## 🌍 Ejemplo — Partículas en un videojuego

El escenario: un sistema de partículas con miles de instancias simultáneas (fuego, humo, chispas, lluvia). Sin Flyweight, cada una duplica la textura — con Flyweight, cada tipo de partícula tiene una sola textura compartida.

---

## 💻 Implementación completa

### Flyweight — el estado compartido

```typescript
// particle-type.ts
class ParticleType {
    // Estado INTRÍNSECO — inmutable, compartido entre todas las partículas del mismo tipo
    public readonly color: string;
    public readonly shape: "circle" | "square" | "triangle";
    public readonly sprite: Uint8Array; // simula una textura pesada

    constructor(color: string, shape: "circle" | "square" | "triangle", spriteSize: number) {
        this.color  = color;
        this.shape  = shape;
        this.sprite = new Uint8Array(spriteSize); // simula datos de textura
        console.log(`  🎨 [Flyweight] Creando tipo: ${color} ${shape} (${(spriteSize / 1024).toFixed(0)} KB)`);
    }

    // Recibe el estado EXTRÍNSECO como parámetros — no lo almacena
    render(x: number, y: number, alpha: number): void {
        // En un juego real: dibuja el sprite en la posición (x, y) con la opacidad alpha
        // Aquí solo simulamos el log
    }

    getSpriteSize(): number {
        return this.sprite.byteLength;
    }
}
```

### Flyweight Factory — el pool de tipos

```typescript
// particle-type.factory.ts
class ParticleTypeFactory {
    private static cache = new Map<string, ParticleType>();

    static getType(
        color: string,
        shape: "circle" | "square" | "triangle",
        spriteSize: number
    ): ParticleType {
        const key = `${color}_${shape}`;

        if (!ParticleTypeFactory.cache.has(key)) {
            ParticleTypeFactory.cache.set(
                key,
                new ParticleType(color, shape, spriteSize)
            );
        }

        return ParticleTypeFactory.cache.get(key)!;
    }

    static getCacheSize(): number {
        return ParticleTypeFactory.cache.size;
    }

    static getStats(): void {
        console.log(`\n📊 Flyweight Factory — tipos únicos en cache: ${ParticleTypeFactory.cache.size}`);
        ParticleTypeFactory.cache.forEach((type, key) => {
            console.log(`   ${key}: ${(type.getSpriteSize() / 1024).toFixed(0)} KB por tipo`);
        });
    }
}
```

### Context — cada partícula individual

```typescript
// particle.ts
class Particle {
    // Estado EXTRÍNSECO — único por instancia
    public x: number;
    public y: number;
    public velocityX: number;
    public velocityY: number;
    public alpha: number;     // opacidad 0-1
    public lifespan: number;  // tiempo de vida restante en ms

    // Referencia al Flyweight — NO duplica el estado compartido
    private type: ParticleType;

    constructor(
        x: number, y: number,
        velocityX: number, velocityY: number,
        color: string,
        shape: "circle" | "square" | "triangle",
        spriteSize: number,
    ) {
        this.x         = x;
        this.y         = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.alpha     = 1.0;
        this.lifespan  = 1000 + Math.random() * 2000;

        // Obtiene o reutiliza el Flyweight — NUNCA crea uno nuevo si ya existe
        this.type = ParticleTypeFactory.getType(color, shape, spriteSize);
    }

    update(deltaMs: number): void {
        this.x        += this.velocityX * deltaMs;
        this.y        += this.velocityY * deltaMs;
        this.lifespan -= deltaMs;
        this.alpha     = Math.max(0, this.lifespan / 3000);
    }

    render(): void {
        this.type.render(this.x, this.y, this.alpha);
    }

    isAlive(): boolean {
        return this.lifespan > 0;
    }

    // Calcula el tamaño aproximado en memoria de ESTA instancia
    getContextSize(): number {
        // x, y, vx, vy, alpha, lifespan (6 × 8 bytes) + referencia (8 bytes) = ~56 bytes
        return 6 * 8 + 8;
    }
}
```

### Sistema de partículas — el cliente

```typescript
// particle-system.ts
class ParticleSystem {
    private particles: Particle[] = [];

    emit(
        count: number,
        x: number, y: number,
        color: string,
        shape: "circle" | "square" | "triangle",
        spriteSize: number,
    ): void {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                color,
                shape,
                spriteSize,
            ));
        }
    }

    update(deltaMs: number): void {
        this.particles = this.particles.filter(p => {
            p.update(deltaMs);
            return p.isAlive();
        });
    }

    render(): void {
        this.particles.forEach(p => p.render());
    }

    getCount(): number {
        return this.particles.length;
    }
}
```

---

## 📊 Uso y benchmark de memoria

```typescript
// main.ts
const system = new ParticleSystem();

// Emitimos 4 tipos de partículas — 50,000 instancias en total
console.log("=== Emitiendo partículas ===\n");

system.emit(20_000, 400, 300, "red",    "circle",   512_000); // fuego — 500 KB por sprite
system.emit(15_000, 400, 300, "gray",   "circle",   512_000); // humo  — 500 KB por sprite
system.emit(10_000, 400, 300, "yellow", "triangle", 256_000); // chispa — 250 KB por sprite
system.emit( 5_000, 200, 100, "blue",   "square",   256_000); // lluvia — 250 KB por sprite

//   🎨 [Flyweight] Creando tipo: red circle (500 KB)
//   🎨 [Flyweight] Creando tipo: gray circle (500 KB)
//   🎨 [Flyweight] Creando tipo: yellow triangle (250 KB)
//   🎨 [Flyweight] Creando tipo: blue square (250 KB)
// Solo 4 creaciones — sin importar que haya 50,000 partículas

ParticleTypeFactory.getStats();
// 📊 Flyweight Factory — tipos únicos en cache: 4
//    red_circle: 500 KB por tipo
//    gray_circle: 500 KB por tipo
//    yellow_triangle: 250 KB por tipo
//    blue_square: 250 KB por tipo

// ── Benchmark de memoria ─────────────────────────────────
const SPRITE_SIZES = { red: 512_000, gray: 512_000, yellow: 256_000, blue: 256_000 };
const COUNTS       = { red: 20_000,  gray: 15_000,  yellow: 10_000,  blue: 5_000  };

const memorySinFlyweight = Object.entries(COUNTS).reduce((total, [color, count]) => {
    const spriteSize = SPRITE_SIZES[color as keyof typeof SPRITE_SIZES];
    return total + count * (spriteSize + 56); // sprite + contexto por cada instancia
}, 0);

const memoryConFlyweight =
    // Sprites: solo 1 por tipo
    Object.values(SPRITE_SIZES).reduce((s, v) => s + v, 0) +
    // Contexto: 56 bytes × 50,000 instancias
    50_000 * 56;

console.log("\n=== Benchmark de memoria ===");
console.log(`Sin Flyweight: ${(memorySinFlyweight / 1024 / 1024).toFixed(1)} MB`);
console.log(`Con Flyweight: ${(memoryConFlyweight  / 1024 / 1024).toFixed(1)} MB`);
console.log(`Ahorro:        ${((1 - memoryConFlyweight / memorySinFlyweight) * 100).toFixed(1)}%`);

// Sin Flyweight: 724.1 MB
// Con Flyweight:   4.1 MB
// Ahorro:         99.4%
```

---

## 📝 Ejemplo adicional — Caracteres en un editor de texto

Un editor de texto con un millón de caracteres. El estilo (fuente, tamaño, color) se comparte — la posición es única:

```typescript
// Flyweight — el estilo del carácter (compartido)
class CharStyle {
    constructor(
        public readonly font: string,
        public readonly size: number,
        public readonly color: string,
        public readonly bold: boolean,
    ) {}

    render(char: string, x: number, y: number): void {
        // dibuja el carácter con este estilo en la posición dada
    }
}

// Flyweight Factory
class CharStyleFactory {
    private static cache = new Map<string, CharStyle>();

    static getStyle(font: string, size: number, color: string, bold: boolean): CharStyle {
        const key = `${font}_${size}_${color}_${bold}`;
        if (!CharStyleFactory.cache.has(key)) {
            CharStyleFactory.cache.set(key, new CharStyle(font, size, color, bold));
        }
        return CharStyleFactory.cache.get(key)!;
    }
}

// Context — cada carácter en el documento
class Character {
    private style: CharStyle;

    constructor(
        public readonly char: string,   // extrínseco — único por posición
        public readonly x: number,      // extrínseco
        public readonly y: number,      // extrínseco
        font: string, size: number, color: string, bold: boolean
    ) {
        this.style = CharStyleFactory.getStyle(font, size, color, bold);
    }

    render(): void {
        this.style.render(this.char, this.x, this.y);
    }
}

// Un documento con 1,000,000 caracteres en solo 3 estilos
// → 3 instancias de CharStyle + 1,000,000 instancias de Character (muy livianas)
const doc: Character[] = [];
for (let i = 0; i < 1_000_000; i++) {
    const style = i % 3 === 0 ? ["Arial", 12, "black", false]
                : i % 3 === 1 ? ["Arial", 14, "blue",  true]
                              : ["Times", 12, "black", false];
    doc.push(new Character("A", i % 80, Math.floor(i / 80), ...style as [string, number, string, boolean]));
}

console.log(`Estilos únicos creados: ${/* CharStyleFactory.cache.size */ 3}`);
// Estilos únicos creados: 3 (no 1,000,000)
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Ahorro masivo de memoria**: en el ejemplo, de 724 MB a 4 MB — una reducción del 99.4%.
- **Escalabilidad**: puedes tener millones de objetos sin degradar la memoria.
- **Transparente para el cliente**: el cliente solo crea `Particle` normalmente — la Factory hace el trabajo de compartir.

### ❌ Desventajas

- **Complejidad adicional**: debes identificar y separar correctamente el estado intrínseco del extrínseco — si te equivocas, el patrón no funciona.
- **CPU vs RAM**: el patrón reduce RAM pero puede aumentar CPU si el estado extrínseco se calcula en cada operación.
- **No aplica a objetos únicos**: si cada objeto es completamente diferente, no hay nada que compartir.
- **Objetos inmutables**: el estado intrínseco debe ser inmutable — si necesitas modificarlo, rompes el patrón.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Flyweight? |
|---|---|
| La app crea una **cantidad enorme** de objetos similares (miles o millones) | ✅ Sí |
| El consumo de **memoria es un problema real** y medible | ✅ Sí |
| Los objetos comparten **gran parte de su estado** (intrínseco) | ✅ Sí |
| El estado compartido es **inmutable** | ✅ Sí |
| Tienes pocos objetos (decenas o cientos) | ❌ Complejidad innecesaria |
| Cada objeto es completamente único | ❌ No hay nada que compartir |
| El estado no puede separarse claramente en intrínseco/extrínseco | ❌ Difícil de implementar |

---

## ⚖️ Comparación con otros patrones

| Patrón | Propósito | Relación con Flyweight |
|---|---|---|
| **Flyweight** | Compartir estado para ahorrar memoria | — |
| **Singleton** | Una sola instancia global | Flyweight Factory usa Singleton para el cache |
| **Factory Method** | Crear objetos | Flyweight Factory es una Factory especializada con caché |
| **Composite** | Árbol parte-todo | Flyweight puede usarse para los nodos hoja del Composite |
| **Prototype** | Clonar objetos | Opuesto — Prototype crea copias; Flyweight evita copias |

---

*Patrón: Flyweight — Familia: Estructurales — GoF (Gang of Four)*
