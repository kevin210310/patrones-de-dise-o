# 🧬 Patrón Creacional: Prototype

## 📋 Descripción

Este proyecto implementa el **patrón de diseño Prototype** en TypeScript usando como ejemplo la clonación de documentos.

La idea central: en lugar de construir un objeto desde cero, **copias uno que ya existe** y solo modificas lo que necesitas. El objeto prototipo encapsula su propia lógica de clonación en el método `clone()`.

> 💡 Piénsalo como duplicar un documento en Google Docs: obtienes una copia exacta y solo cambias el título — no rehaces todo desde cero.

---

## 🔥 Problema que resuelve

Sin Prototype, crear objetos similares repetidamente implica conocer todos sus detalles internos y repetir código de inicialización:

```typescript
// ❌ Sin Prototype — repites la construcción completa
const doc1 = new Document(
    "Contrato de servicios",
    "Lorem ipsum... (500 líneas de contenido estándar)",
    "Legal Dept."
);

// Quieres otro contrato igual pero con diferente título
const doc2 = new Document(
    "Contrato de confidencialidad",
    "Lorem ipsum... (500 líneas de contenido estándar)", // repetido
    "Legal Dept."                                        // repetido
);
// ¿Y si el constructor cambia? Debes actualizar cada instanciación
```

```typescript
// ✅ Con Prototype — clonas y solo cambias lo diferente
const doc1 = new Document(
    "Contrato de servicios",
    "Lorem ipsum... (500 líneas de contenido estándar)",
    "Legal Dept."
);

const doc2 = doc1.clone();
doc2.title = "Contrato de confidencialidad"; // solo esto cambia
```

---

## 🏛️ Estructura del proyecto

```
prototype-document/
├── Document.ts   # Prototipo concreto — contiene la lógica de clonación
└── main.ts       # Cliente — clona y modifica prototipos
```

---

## 🗺️ Diagrama

```
         <<interface>>
          Prototype
         + clone(): this
               ▲
               │ implementa
               │
        ┌──────────────┐
        │   Document   │  ← Prototipo concreto
        │              │
        │ + title       │
        │ + content     │
        │ + author      │
        │              │
        │ + clone()     │  → return new Document(this.title,
        │               │                        this.content,
        │ + displayInfo()│                        this.author)
        └──────────────┘
               │
     ┌─────────┴──────────┐
     │    clone()         │
     ▼                    ▼
┌──────────┐        ┌──────────┐
│  doc1    │        │  doc2    │  ← copia independiente
│ (origen) │        │ (clon)   │     mismos valores iniciales
└──────────┘        └──────────┘     puede modificarse libremente
```

---

## 🧩 Componentes

### `Document` — El Prototipo Concreto

Es al mismo tiempo el **molde** y el **producto**. Encapsula su propia lógica de clonación — nadie externo necesita saber cómo está construido para poder copiarlo.

| Propiedad     | Tipo     | Descripción                        |
|---------------|----------|------------------------------------|
| `title`       | `string` | Título del documento               |
| `content`     | `string` | Cuerpo del documento               |
| `author`      | `string` | Autor del documento                |

| Método          | Retorna    | Descripción                                          |
|-----------------|------------|------------------------------------------------------|
| `clone()`       | `Document` | Crea y retorna una copia independiente del documento |
| `displayInfo()` | `void`     | Imprime el estado actual del documento               |

---

## 💻 Implementación

```typescript
class Document {
    public title: string;
    public content: string;
    public author: string;

    constructor(title: string, content: string, author: string) {
        this.title   = title;
        this.content = content;
        this.author  = author;
    }

    clone(): Document {
        // Crea una nueva instancia con los mismos valores
        // El cliente no necesita conocer el constructor
        return new Document(this.title, this.content, this.author);
    }

    displayInfo(): void {
        console.log({
            title:   this.title,
            content: this.content,
            author:  this.author,
        });
    }
}
```

> 💡 **Clave del patrón**: `clone()` vive dentro de la clase — la responsabilidad de saber cómo copiarse es del propio objeto, no del código que lo usa.

---

## 💡 Uso

### Clonación básica

```typescript
// Documento original — plantilla base
const templateDoc = new Document(
    "Contrato de servicios",
    "Este contrato establece los términos y condiciones...",
    "Legal Dept."
);

// Clon — copia independiente del original
const clientDoc = templateDoc.clone();
clientDoc.title = "Contrato — Cliente Acme Corp";

templateDoc.displayInfo();
// { title: 'Contrato de servicios', content: 'Este contrato...', author: 'Legal Dept.' }

clientDoc.displayInfo();
// { title: 'Contrato — Cliente Acme Corp', content: 'Este contrato...', author: 'Legal Dept.' }
```

### Verificando independencia entre original y clon

```typescript
const original = new Document("Original", "Contenido base", "Autor");
const clon     = original.clone();

clon.title  = "Clon modificado";
clon.author = "Otro autor";

original.displayInfo();
// { title: 'Original', content: 'Contenido base', author: 'Autor' }
// ✅ El original no se vio afectado

clon.displayInfo();
// { title: 'Clon modificado', content: 'Contenido base', author: 'Otro autor' }
```

### Generación masiva de documentos similares

```typescript
const baseReport = new Document(
    "Reporte mensual",
    "Sección 1: Resumen ejecutivo\nSección 2: KPIs\nSección 3: Conclusiones",
    "Analytics Team"
);

const meses = ["Enero", "Febrero", "Marzo"];

const reportes = meses.map(mes => {
    const reporte = baseReport.clone();
    reporte.title = `Reporte ${mes} 2025`;
    return reporte;
});

reportes.forEach(r => r.displayInfo());
// { title: 'Reporte Enero 2025',   content: 'Sección 1: ...', author: 'Analytics Team' }
// { title: 'Reporte Febrero 2025', content: 'Sección 1: ...', author: 'Analytics Team' }
// { title: 'Reporte Marzo 2025',   content: 'Sección 1: ...', author: 'Analytics Team' }
```

---

## 🔬 Copia superficial vs copia profunda

Este es el punto más crítico del patrón Prototype. La implementación actual hace una **copia superficial** (*shallow copy*), lo que es suficiente cuando todas las propiedades son tipos primitivos (`string`, `number`, `boolean`).

### ✅ Copia superficial — funciona con primitivos

```typescript
clone(): Document {
    return new Document(this.title, this.content, this.author);
    // string, string, string → se copian por valor ✅
}
```

### ⚠️ Problema con objetos anidados

Si `Document` tuviera propiedades que son objetos o arrays, una copia superficial haría que el clon y el original **compartan la misma referencia**:

```typescript
class DocumentWithMeta {
    public title: string;
    public tags: string[];  // ← objeto/array

    clone(): DocumentWithMeta {
        const clon = new DocumentWithMeta(this.title, this.tags);
        // ❌ clon.tags y this.tags apuntan al MISMO array
        return clon;
    }
}

const doc1 = new DocumentWithMeta("Doc", ["legal", "contrato"]);
const doc2 = doc1.clone();

doc2.tags.push("urgente");
console.log(doc1.tags); // ["legal", "contrato", "urgente"] ← el original se contaminó
```

### ✅ Copia profunda — solución para objetos anidados

```typescript
clone(): DocumentWithMeta {
    const clon = new DocumentWithMeta(this.title, [...this.tags]); // copia el array
    return clon;
    // O para estructuras más complejas:
    // return JSON.parse(JSON.stringify(this));
    // return structuredClone(this); // disponible en Node 17+ y browsers modernos
}
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Clonación sin acoplamiento**: el cliente puede clonar cualquier objeto sin conocer su clase concreta ni su constructor.
- **Alternativa a la herencia**: en lugar de crear subclases para cada variación, clonas y ajustas.
- **Eficiencia**: evitar reinicializar objetos costosos (conexiones, datos cargados, configuraciones) — clonas el estado ya preparado.
- **Objetos preconfigurados**: puedes mantener un registro de prototipos listos para usar como plantillas.

### ❌ Desventajas

- **Copia profunda es compleja**: si el objeto tiene referencias circulares u objetos anidados, implementar `clone()` correctamente puede volverse complicado.
- **Responsabilidad en la clase**: la clase debe saber cómo clonarse — viola ligeramente el principio de responsabilidad única si la lógica de copia es muy compleja.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Prototype? |
|---|---|
| Crear objetos similares con **pequeñas variaciones** | ✅ Sí |
| El costo de inicializar un objeto desde cero es **alto** (BD, red, archivos) | ✅ Sí |
| Necesitas **independencia** entre el original y las copias | ✅ Sí |
| Quieres clonar sin conocer la **clase concreta** del objeto | ✅ Sí |
| El objeto tiene propiedades simples (primitivos) | ✅ Ideal |
| El objeto tiene **referencias circulares** o grafos complejos | ⚠️ Con cuidado |
| Los objetos son **completamente distintos** entre sí | ❌ No |

---

## ⚖️ Comparación con los otros patrones creacionales

| Patrón             | Crea a partir de...      | Cuándo usarlo                                              |
|--------------------|--------------------------|------------------------------------------------------------|
| **Builder**        | Cero, paso a paso        | Objeto complejo con muchos parámetros opcionales           |
| **Factory Method** | Una clase concreta       | Delegar la instanciación según el entorno o configuración  |
| **Abstract Factory**| Familias de clases      | Garantizar coherencia entre productos relacionados         |
| **Prototype**      | Una instancia existente  | Variaciones de un objeto ya construido y configurado       |

> 💡 **Regla práctica**: si ya tienes un objeto bien configurado y quieres uno parecido, usa **Prototype**. Si lo estás construyendo desde cero con variantes, usa **Builder**.

---

*Patrón: Prototype — Familia: Creacionales — GoF (Gang of Four)*