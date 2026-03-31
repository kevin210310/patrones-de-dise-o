# 🧳 Patrón de Comportamiento: Visitor

> Permite agregar nuevas operaciones a una jerarquía de clases sin modificarlas — separa el algoritmo de la estructura sobre la que opera.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Double Dispatch](#-double-dispatch)
- [Componentes](#-componentes)
- [Ejemplo — Sistema de documentos con múltiples exportaciones](#-ejemplo--sistema-de-documentos-con-múltiples-exportaciones)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)

---

## 📋 Descripción

El **Visitor** es un patrón de diseño **de comportamiento** que te permite separar algoritmos de los objetos sobre los que operan. El "visitante" es un objeto que viaja a través de la estructura de otro objeto y ejecuta operaciones sobre cada elemento que encuentra.

> 💡 Piénsalo como un inspector de impuestos: visita distintos tipos de negocios (restaurantes, tiendas, fábricas) y aplica una lógica diferente a cada tipo sin que los negocios cambien cómo funcionan. El inspector es el Visitor; los negocios son los elementos visitados.

---

## 🔥 Problema que resuelve

Sin Visitor, agregar una nueva operación a una jerarquía de clases requiere modificar todas las clases:

```typescript
// ❌ Sin Visitor — agregar "exportar a XML" requiere modificar cada nodo del árbol
class Paragraph {
    exportToHTML(): string { /* ... */ }
    exportToPDF():  string { /* ... */ }
    exportToXML():  string { /* ... */ }  // ← modificas Paragraph
}
class Image {
    exportToHTML(): string { /* ... */ }
    exportToPDF():  string { /* ... */ }
    exportToXML():  string { /* ... */ }  // ← modificas Image
}
class Table {
    exportToHTML(): string { /* ... */ }
    exportToPDF():  string { /* ... */ }
    exportToXML():  string { /* ... */ }  // ← modificas Table
    // Cada nueva operación = modificar TODAS las clases
}

// ✅ Con Visitor — nueva operación = nueva clase Visitor, sin tocar los nodos
class XMLExportVisitor implements DocumentVisitor {
    visitParagraph(p: Paragraph): string { /* ... */ }
    visitImage(img: Image): string       { /* ... */ }
    visitTable(t: Table): string         { /* ... */ }
}
```

---

## 🗺️ Diagrama

```
  <<interface>>                    <<interface>>
  DocumentElement                  DocumentVisitor
  + accept(visitor): void          + visitParagraph(p): void
                                   + visitImage(img): void
        ▲                          + visitTable(t): void
        │                                ▲
   ┌────┼────┐                     ┌─────┼──────┐
   │    │    │                     │     │      │
Paragraph Image Table           HTMLVisitor PDFVisitor XMLVisitor

Paragraph.accept(visitor):
    visitor.visitParagraph(this)  ← Double Dispatch
                                    el elemento llama al método
                                    correcto del visitor
```

---

## 🔄 Double Dispatch

El mecanismo clave del Visitor es el **double dispatch** — la operación ejecutada depende del **tipo del elemento** y del **tipo del visitor**:

```typescript
// Sin double dispatch — solo un dispatch (el método del visitor)
visitor.visit(element); // ¿qué método llama? depende de cómo estés en runtime
                        // TypeScript/JS no tiene sobrecarga por tipo en runtime

// Con double dispatch — el elemento "redirige" al método correcto del visitor
element.accept(visitor); // 1er dispatch: qué tipo es element
                         // dentro del accept:
                         // visitor.visitParagraph(this) ← 2do dispatch: qué tipo es visitor
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Element** | Interfaz con `accept(visitor)` | `DocumentElement` |
| **Concrete Element** | Implementa `accept()` llamando al método correcto del visitor | `Paragraph`, `Image`, `Table`, `List` |
| **Visitor** | Interfaz con un método `visit` por cada tipo de elemento | `DocumentVisitor` |
| **Concrete Visitor** | Implementa la operación para cada tipo de elemento | `HTMLExportVisitor`, `PDFExportVisitor`, `WordCountVisitor` |

---

## 🌍 Ejemplo — Sistema de documentos con múltiples exportaciones

El escenario: un editor de documentos con varios tipos de elementos (párrafos, imágenes, tablas, listas). Necesitas exportar a HTML, PDF y contar palabras — sin modificar los elementos del documento cada vez que agregas una nueva operación.

---

## 💻 Implementación completa

### La interfaz Visitor

```typescript
// document-visitor.interface.ts
interface DocumentVisitor {
    visitParagraph(element: Paragraph): void;
    visitImage(element: ImageElement): void;
    visitTable(element: Table): void;
    visitList(element: ListElement): void;
}

// document-element.interface.ts
interface DocumentElement {
    accept(visitor: DocumentVisitor): void;
}
```

### Los elementos concretos

```typescript
// elements/paragraph.ts
class Paragraph implements DocumentElement {
    constructor(
        public readonly text: string,
        public readonly style: "normal" | "heading1" | "heading2" | "quote" = "normal",
    ) {}

    accept(visitor: DocumentVisitor): void {
        visitor.visitParagraph(this); // double dispatch
    }
}

// elements/image.ts
class ImageElement implements DocumentElement {
    constructor(
        public readonly src: string,
        public readonly alt: string,
        public readonly width: number,
        public readonly height: number,
    ) {}

    accept(visitor: DocumentVisitor): void {
        visitor.visitImage(this);
    }
}

// elements/table.ts
class Table implements DocumentElement {
    constructor(
        public readonly headers: string[],
        public readonly rows: string[][],
        public readonly caption?: string,
    ) {}

    accept(visitor: DocumentVisitor): void {
        visitor.visitTable(this);
    }
}

// elements/list.ts
class ListElement implements DocumentElement {
    constructor(
        public readonly items: string[],
        public readonly ordered: boolean = false,
    ) {}

    accept(visitor: DocumentVisitor): void {
        visitor.visitList(this);
    }
}

// document.ts — la estructura que contiene todos los elementos
class Document {
    private elements: DocumentElement[] = [];

    add(element: DocumentElement): Document {
        this.elements.push(element);
        return this;
    }

    // Aplica el visitor a todos los elementos
    accept(visitor: DocumentVisitor): void {
        this.elements.forEach(el => el.accept(visitor));
    }
}
```

### Los Visitors concretos — operaciones sobre la estructura

```typescript
// visitors/html-export.visitor.ts
class HTMLExportVisitor implements DocumentVisitor {
    private output: string[] = [];

    visitParagraph(el: Paragraph): void {
        const tag = el.style === "heading1" ? "h1"
                  : el.style === "heading2" ? "h2"
                  : el.style === "quote"    ? "blockquote"
                  : "p";
        this.output.push(`<${tag}>${el.text}</${tag}>`);
    }

    visitImage(el: ImageElement): void {
        this.output.push(
            `<img src="${el.src}" alt="${el.alt}" width="${el.width}" height="${el.height}" />`
        );
    }

    visitTable(el: Table): void {
        const caption = el.caption ? `<caption>${el.caption}</caption>` : "";
        const headers = el.headers.map(h => `<th>${h}</th>`).join("");
        const rows    = el.rows.map(row =>
            `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
        ).join("\n  ");
        this.output.push(
            `<table>${caption}\n  <thead><tr>${headers}</tr></thead>\n  <tbody>\n  ${rows}\n  </tbody>\n</table>`
        );
    }

    visitList(el: ListElement): void {
        const tag   = el.ordered ? "ol" : "ul";
        const items = el.items.map(i => `  <li>${i}</li>`).join("\n");
        this.output.push(`<${tag}>\n${items}\n</${tag}>`);
    }

    getOutput(): string {
        return this.output.join("\n\n");
    }

    reset(): void { this.output = []; }
}

// visitors/pdf-export.visitor.ts
class PDFExportVisitor implements DocumentVisitor {
    private lines: string[] = [];
    private pageWidth = 60;

    visitParagraph(el: Paragraph): void {
        if (el.style === "heading1") {
            this.lines.push("═".repeat(this.pageWidth));
            this.lines.push(`  ${el.text.toUpperCase()}`);
            this.lines.push("═".repeat(this.pageWidth));
        } else if (el.style === "heading2") {
            this.lines.push(`\n── ${el.text} ${"─".repeat(this.pageWidth - el.text.length - 4)}`);
        } else if (el.style === "quote") {
            this.lines.push(`  │ ${el.text}`);
        } else {
            this.lines.push(el.text);
        }
    }

    visitImage(el: ImageElement): void {
        this.lines.push(`[Imagen: ${el.alt} (${el.width}×${el.height}px) — ${el.src}]`);
    }

    visitTable(el: Table): void {
        if (el.caption) this.lines.push(`Tabla: ${el.caption}`);
        const colWidth = Math.floor((this.pageWidth - el.headers.length - 1) / el.headers.length);
        const header   = el.headers.map(h => h.padEnd(colWidth)).join(" │ ");
        this.lines.push(`┌${"─".repeat(this.pageWidth)}┐`);
        this.lines.push(`│ ${header} │`);
        this.lines.push(`├${"─".repeat(this.pageWidth)}┤`);
        el.rows.forEach(row => {
            this.lines.push(`│ ${row.map(c => c.padEnd(colWidth)).join(" │ ")} │`);
        });
        this.lines.push(`└${"─".repeat(this.pageWidth)}┘`);
    }

    visitList(el: ListElement): void {
        el.items.forEach((item, i) => {
            const bullet = el.ordered ? `${i + 1}.` : "•";
            this.lines.push(`  ${bullet} ${item}`);
        });
    }

    getOutput(): string { return this.lines.join("\n"); }
    reset(): void { this.lines = []; }
}

// visitors/word-count.visitor.ts — operación completamente diferente
class WordCountVisitor implements DocumentVisitor {
    private wordCount    = 0;
    private imageCount   = 0;
    private tableCount   = 0;
    private listItems    = 0;
    private paragraphs   = 0;

    private countWords(text: string): number {
        return text.trim().split(/\s+/).filter(Boolean).length;
    }

    visitParagraph(el: Paragraph): void {
        this.wordCount += this.countWords(el.text);
        this.paragraphs++;
    }

    visitImage(el: ImageElement): void {
        this.imageCount++;
    }

    visitTable(el: Table): void {
        this.tableCount++;
        el.rows.forEach(row => row.forEach(cell => {
            this.wordCount += this.countWords(cell);
        }));
    }

    visitList(el: ListElement): void {
        this.listItems += el.items.length;
        el.items.forEach(item => this.wordCount += this.countWords(item));
    }

    getStats() {
        return {
            words:      this.wordCount,
            paragraphs: this.paragraphs,
            images:     this.imageCount,
            tables:     this.tableCount,
            listItems:  this.listItems,
            readTime:   `~${Math.ceil(this.wordCount / 200)} min`,
        };
    }
}
```

---

## 💡 Uso

```typescript
// main.ts
const doc = new Document();

doc
    .add(new Paragraph("Informe de Ventas 2026", "heading1"))
    .add(new Paragraph("Este reporte resume las ventas del primer trimestre.", "normal"))
    .add(new Paragraph("Nota: Los datos son provisorios.", "quote"))
    .add(new Table(
        ["Producto", "Ventas", "Ingresos"],
        [
            ["Laptop",  "45",  "$54,000"],
            ["Mouse",   "120", "$5,400" ],
            ["Teclado", "89",  "$7,921" ],
        ],
        "Resumen de ventas Q1"
    ))
    .add(new ListElement(["Laptop lidera las ventas", "Mouse tuvo mayor volumen", "Teclado creció 20%"]))
    .add(new ImageElement("grafico-ventas.png", "Gráfico de ventas", 600, 400));

// ── Exportar a HTML ───────────────────────────────────────
const htmlVisitor = new HTMLExportVisitor();
doc.accept(htmlVisitor);
console.log("=== HTML ===\n");
console.log(htmlVisitor.getOutput());
// <h1>Informe de Ventas 2026</h1>
// <p>Este reporte resume...</p>
// <blockquote>Nota: Los datos...</blockquote>
// <table><caption>Resumen...

// ── Exportar a PDF ────────────────────────────────────────
const pdfVisitor = new PDFExportVisitor();
doc.accept(pdfVisitor);
console.log("\n=== PDF ===\n");
console.log(pdfVisitor.getOutput());

// ── Contar palabras ───────────────────────────────────────
const counter = new WordCountVisitor();
doc.accept(counter);
console.log("\n=== Estadísticas ===");
console.log(counter.getStats());
// { words: 48, paragraphs: 3, images: 1, tables: 1, listItems: 3, readTime: '~1 min' }

// ── Agregar una NUEVA operación sin tocar Document ni los elementos ──
class MarkdownExportVisitor implements DocumentVisitor {
    private lines: string[] = [];

    visitParagraph(el: Paragraph): void {
        const prefix = el.style === "heading1" ? "# "
                     : el.style === "heading2" ? "## "
                     : el.style === "quote"    ? "> "
                     : "";
        this.lines.push(`${prefix}${el.text}`);
    }

    visitImage(el: ImageElement): void {
        this.lines.push(`![${el.alt}](${el.src})`);
    }

    visitTable(el: Table): void {
        const header = `| ${el.headers.join(" | ")} |`;
        const sep    = `| ${el.headers.map(() => "---").join(" | ")} |`;
        const rows   = el.rows.map(r => `| ${r.join(" | ")} |`);
        this.lines.push([header, sep, ...rows].join("\n"));
    }

    visitList(el: ListElement): void {
        el.items.forEach((item, i) => {
            this.lines.push(el.ordered ? `${i + 1}. ${item}` : `- ${item}`);
        });
    }

    getOutput(): string { return this.lines.join("\n\n"); }
}

const mdVisitor = new MarkdownExportVisitor();
doc.accept(mdVisitor); // funciona sin modificar Document, Paragraph, Table, etc.
console.log("\n=== Markdown ===\n");
console.log(mdVisitor.getOutput());
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas
- **Open/Closed**: agregar una operación nueva = una clase Visitor nueva, sin tocar los elementos.
- **Responsabilidad única**: cada Visitor encapsula una operación completa sobre toda la jerarquía.
- **Acumulación de estado**: el visitor puede acumular estado durante el recorrido (como `WordCountVisitor`).
- **Operaciones relacionadas juntas**: todo el código de "exportar a HTML" está en un solo lugar.

### ❌ Desventajas
- **Difícil agregar nuevos elementos**: si agregas un tipo de elemento nuevo (`Video`), debes actualizar **todos** los Visitors existentes.
- **Rompe el encapsulamiento**: los Visitors necesitan acceso a los detalles internos de los elementos (por eso los campos son `public readonly`).
- **Acoplamiento**: el Visitor conoce todos los tipos concretos de la jerarquía.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Visitor? |
|---|---|
| Tienes una jerarquía **estable** de clases y necesitas agregar **muchas operaciones** | ✅ Sí |
| Las operaciones no tienen relación entre sí y no pertenecen a los elementos | ✅ Sí |
| Necesitas **acumular estado** mientras recorres la estructura | ✅ Sí |
| La jerarquía cambia frecuentemente (se agregan tipos nuevos) | ❌ Cada tipo nuevo rompe todos los visitors |
| Solo necesitas **una operación** sobre la jerarquía | ❌ Sobrecomplica sin beneficio |

---

*Patrón: Visitor — Familia: Comportamiento — GoF (Gang of Four)*
