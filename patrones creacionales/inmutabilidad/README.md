# 🔒 Inmutabilidad con Copia

> Un objeto inmutable nunca cambia — si necesitas una versión modificada, creas una copia nueva con los cambios aplicados. El original siempre queda intacto.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [El problema con la mutabilidad](#-el-problema-con-la-mutabilidad)
- [Técnicas de inmutabilidad](#-técnicas-de-inmutabilidad)
- [Inmutabilidad con copia — el patrón](#-inmutabilidad-con-copia--el-patrón)
- [Shallow copy vs Deep copy](#-shallow-copy-vs-deep-copy)
- [Implementación en TypeScript](#-implementación-en-typescript)
- [Inmutabilidad en arrays](#-inmutabilidad-en-arrays)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Relación con Prototype](#-relación-con-prototype)

---

## 📋 Descripción

La **inmutabilidad con copia** es una técnica de diseño donde los objetos **nunca se modifican directamente**. En lugar de mutar el estado, cada operación retorna un **objeto nuevo** con los cambios aplicados, dejando el original intacto.

Es el principio detrás de lenguajes como Haskell, el estado en React, los reducers de Redux y los records inmutables de muchos lenguajes modernos.

> 💡 Piénsalo como el historial de versiones de un documento: cada cambio genera una nueva versión — las anteriores nunca desaparecen ni se alteran.

---

## 🔥 El problema con la mutabilidad

### Referencias compartidas — el bug silencioso

```typescript
class Document {
    constructor(
        public title: string,
        public tags: string[]
    ) {}
}

const doc1 = new Document("Contrato", ["legal"]);
const doc2 = doc1; // ← NO es una copia, es la MISMA referencia

doc2.title = "Modificado";
doc2.tags.push("urgente");

console.log(doc1.title); // "Modificado" ← ¡el original cambió!
console.log(doc1.tags);  // ["legal", "urgente"] ← ¡contaminado!
```

### El problema se amplifica en sistemas grandes

```typescript
function procesarDocumento(doc: Document) {
    doc.title = doc.title.toUpperCase(); // ← muta el objeto recibido
    return doc;
}

const original = new Document("Mi contrato", ["legal"]);
const resultado = procesarDocumento(original);

console.log(original.title); // "MI CONTRATO" ← efecto secundario inesperado
```

> ❌ Con mutabilidad: **cualquier parte del código puede alterar el estado** de cualquier objeto en cualquier momento. Esto hace que los bugs sean difíciles de rastrear.

---

## 🛡️ Técnicas de inmutabilidad

### 1. `readonly` en propiedades

Previene la reasignación de propiedades en tiempo de compilación (TypeScript):

```typescript
class Document {
    constructor(
        public readonly title: string,
        public readonly content: string,
        public readonly author: string,
    ) {}
}

const doc = new Document("Contrato", "Contenido...", "Legal");
doc.title = "Otro título"; // ❌ Error de compilación: Cannot assign to 'title'
```

> ⚠️ `readonly` protege la **referencia**, no el contenido. Un array `readonly` no puede reasignarse, pero sí puede mutar con `.push()`.

### 2. `Object.freeze()`

Congela el objeto en tiempo de ejecución — ninguna propiedad puede modificarse:

```typescript
const doc = Object.freeze({
    title: "Contrato",
    content: "Contenido...",
    author: "Legal"
});

doc.title = "Otro título"; // silencioso en JS, error en modo strict
console.log(doc.title);    // "Contrato" — no cambió
```

> ⚠️ `Object.freeze()` también es superficial — no congela objetos anidados.

### 3. `as const` para literales

```typescript
const CONFIG = {
    endpoint: "https://api.miapp.com",
    timeout: 3000,
    retries: 3,
} as const;

CONFIG.timeout = 5000; // ❌ Error de compilación
```

---

## 🧬 Inmutabilidad con Copia — el patrón

La técnica principal: en lugar de mutar, **retornas un objeto nuevo** con los cambios:

```typescript
class Document {
    constructor(
        public readonly title: string,
        public readonly content: string,
        public readonly author: string,
        public readonly tags: readonly string[],
    ) {}

    // En lugar de mutar, retorna una nueva instancia con el cambio
    withTitle(title: string): Document {
        return new Document(title, this.content, this.author, this.tags);
    }

    withContent(content: string): Document {
        return new Document(this.title, content, this.author, this.tags);
    }

    withAuthor(author: string): Document {
        return new Document(this.title, this.content, author, this.tags);
    }

    withTag(tag: string): Document {
        return new Document(
            this.title,
            this.content,
            this.author,
            [...this.tags, tag], // nuevo array, no muta el original
        );
    }

    displayInfo(): void {
        console.log({
            title:   this.title,
            content: this.content,
            author:  this.author,
            tags:    this.tags,
        });
    }
}
```

### Uso con interfaz fluida

```typescript
const original = new Document(
    "Contrato base",
    "Términos y condiciones estándar...",
    "Legal Dept.",
    ["plantilla"]
);

// Cada método retorna un NUEVO documento — el original nunca cambia
const clienteA = original
    .withTitle("Contrato — Cliente Acme")
    .withAuthor("Juan García")
    .withTag("cliente")
    .withTag("urgente");

const clienteB = original
    .withTitle("Contrato — Cliente Beta Corp")
    .withTag("cliente");

original.displayInfo();
// { title: 'Contrato base', author: 'Legal Dept.', tags: ['plantilla'] }

clienteA.displayInfo();
// { title: 'Contrato — Cliente Acme', author: 'Juan García', tags: ['plantilla', 'cliente', 'urgente'] }

clienteB.displayInfo();
// { title: 'Contrato — Cliente Beta Corp', author: 'Legal Dept.', tags: ['plantilla', 'cliente'] }
```

> ✅ Tres versiones del documento coexisten sin interferirse. El original **nunca cambió**.

---

## 🔬 Shallow Copy vs Deep Copy

### Shallow Copy — copia superficial

Copia solo el primer nivel. Las referencias internas siguen siendo compartidas:

```typescript
// Con spread operator — shallow copy
const copia = { ...original };

// Con Object.assign — también shallow
const copia2 = Object.assign({}, original);

// Problema:
const doc = { title: "Contrato", meta: { tags: ["legal"] } };
const clon = { ...doc };

clon.meta.tags.push("urgente"); // ← muta el objeto anidado compartido
console.log(doc.meta.tags);    // ["legal", "urgente"] ❌ contaminado
```

### Deep Copy — copia profunda

Copia todos los niveles — sin referencias compartidas:

```typescript
// Opción 1: structuredClone (recomendado, Node 17+ / browsers modernos)
const deepCopy = structuredClone(original);

// Opción 2: JSON (limitado — no soporta funciones, Date, undefined, etc.)
const deepCopy2 = JSON.parse(JSON.stringify(original));

// Verificación
const doc = { title: "Contrato", meta: { tags: ["legal"] } };
const clon = structuredClone(doc);

clon.meta.tags.push("urgente");
console.log(doc.meta.tags);  // ["legal"] ✅ intacto
console.log(clon.meta.tags); // ["legal", "urgente"]
```

### Resumen de técnicas de copia

| Técnica                  | Nivel    | Soporta funciones | Soporta Date | Rendimiento |
|--------------------------|----------|-------------------|--------------|-------------|
| `{ ...obj }`             | Shallow  | ✅                | ✅           | ⚡ Muy rápido |
| `Object.assign({}, obj)` | Shallow  | ✅                | ✅           | ⚡ Muy rápido |
| `JSON.parse/stringify`   | Deep     | ❌                | ❌           | 🐢 Lento     |
| `structuredClone(obj)`   | Deep     | ❌                | ✅           | 🟡 Medio     |
| Copia manual recursiva   | Deep     | ✅                | ✅           | 🟡 Variable  |

---

## 💻 Implementación en TypeScript

### Con `Readonly<T>` y spread

```typescript
type DocumentState = {
    title: string;
    content: string;
    author: string;
    tags: string[];
};

// Readonly<T> hace todas las propiedades readonly en un solo paso
type ImmutableDocument = Readonly<DocumentState>;

function updateTitle(
    doc: ImmutableDocument,
    newTitle: string
): ImmutableDocument {
    return { ...doc, title: newTitle }; // spread + override
}

function addTag(
    doc: ImmutableDocument,
    tag: string
): ImmutableDocument {
    return { ...doc, tags: [...doc.tags, tag] }; // nuevo array
}

// Uso
const base: ImmutableDocument = {
    title:   "Plantilla",
    content: "Contenido...",
    author:  "Legal",
    tags:    ["base"],
};

const v1 = updateTitle(base, "Contrato Acme");
const v2 = addTag(v1, "urgente");

console.log(base.tags); // ["base"] ✅ intacto
console.log(v2.tags);   // ["base", "urgente"]
```

### Con clase inmutable completa

```typescript
class ImmutableDocument {
    constructor(
        public readonly title: string,
        public readonly content: string,
        public readonly author: string,
        public readonly tags: readonly string[] = [],
        public readonly version: number = 1,
    ) {}

    // Método genérico de actualización — evita repetir lógica
    private with(changes: Partial<{
        title: string;
        content: string;
        author: string;
        tags: readonly string[];
    }>): ImmutableDocument {
        return new ImmutableDocument(
            changes.title   ?? this.title,
            changes.content ?? this.content,
            changes.author  ?? this.author,
            changes.tags    ?? this.tags,
            this.version + 1, // cada cambio incrementa la versión
        );
    }

    withTitle(title: string)     { return this.with({ title }); }
    withContent(content: string) { return this.with({ content }); }
    withAuthor(author: string)   { return this.with({ author }); }

    withTag(tag: string) {
        return this.with({ tags: [...this.tags, tag] });
    }

    withoutTag(tag: string) {
        return this.with({ tags: this.tags.filter(t => t !== tag) });
    }
}

// Uso
const v1 = new ImmutableDocument("Borrador", "...", "Ana");
const v2 = v1.withTitle("Contrato Final").withTag("aprobado");
const v3 = v2.withAuthor("Legal Dept.").withoutTag("aprobado").withTag("firmado");

console.log(v1.version); // 1
console.log(v2.version); // 3 (2 cambios aplicados)
console.log(v3.version); // 6 (3 cambios más)

console.log(v1.title);   // "Borrador"  ✅ intacto
console.log(v3.title);   // "Contrato Final"
```

---

## 📚 Inmutabilidad en arrays

Los arrays son especialmente propensos a mutaciones accidentales:

```typescript
const tags = ["legal", "contrato"];

// ❌ Operaciones que MUTAN el array original
tags.push("urgente");       // agrega al final
tags.pop();                 // elimina el último
tags.splice(0, 1);          // elimina por índice
tags.sort();                // ordena in-place
tags.reverse();             // invierte in-place

// ✅ Operaciones que retornan un NUEVO array (inmutables)
const conNuevoTag   = [...tags, "urgente"];          // agrega
const sinPrimero    = tags.slice(1);                 // elimina por índice
const sinUrgente    = tags.filter(t => t !== "urgente"); // elimina por valor
const ordenado      = [...tags].sort();              // ordena sin mutar
const invertido     = [...tags].reverse();           // invierte sin mutar
const transformado  = tags.map(t => t.toUpperCase()); // transforma
```

---

## ✅ Cuándo usarlo

| Situación | ¿Usar inmutabilidad con copia? |
|---|---|
| Múltiples partes del código comparten el mismo objeto | ✅ Sí |
| Necesitas **historial de versiones** o poder deshacer cambios | ✅ Sí |
| Funciones que reciben objetos y **no deben tener efectos secundarios** | ✅ Sí |
| Estado en React, Redux, o arquitecturas basadas en eventos | ✅ Sí |
| Objetos pequeños con pocas propiedades | ✅ Ideal (bajo costo de copia) |
| Objetos enormes que se modifican con alta frecuencia | ⚠️ Evaluar rendimiento |
| Objeto local dentro de una función sin referencias externas | ❌ Innecesario |

---

## 🔗 Relación con Prototype

La **inmutabilidad con copia** y el **patrón Prototype** comparten la idea de trabajar con copias, pero con objetivos distintos:

| Aspecto | Prototype | Inmutabilidad con copia |
|---|---|---|
| **Objetivo** | Crear nuevos objetos a partir de una plantilla | Proteger el estado de objetos existentes |
| **Quién inicia la copia** | El cliente llama a `clone()` | El propio objeto retorna una copia modificada |
| **Estado del original** | Puede modificarse después del clon | Nunca se modifica — es garantía del diseño |
| **Método central** | `clone()` | `with*()`, `update()`, spread `{ ...obj }` |
| **Uso típico** | Plantillas y objetos costosos de inicializar | Estado compartido, reducers, value objects |

> 💡 Puedes combinar ambos: un **Prototype** que además es **inmutable** — `clone()` retorna un objeto frozen, y cualquier "modificación" pasa por métodos `with*()` que crean nuevas instancias.

---

*Concepto: Inmutabilidad con Copia — complemento de Prototype — aplicable a todos los patrones creacionales*