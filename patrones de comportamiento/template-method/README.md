# 📐 Patrón de Comportamiento: Template Method

> Define el esqueleto de un algoritmo en una clase base, dejando que las subclases implementen los pasos específicos sin cambiar la estructura del algoritmo.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Generador de reportes](#-ejemplo--generador-de-reportes)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Hooks — pasos opcionales](#-hooks--pasos-opcionales)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Template Method vs Strategy](#-template-method-vs-strategy)

---

## 📋 Descripción

El **Template Method** es un patrón de diseño **de comportamiento** que define el esqueleto de un algoritmo en una clase base, delegando algunos pasos a las subclases. Las subclases pueden redefinir ciertos pasos del algoritmo sin cambiar su estructura general.

> 💡 Piénsalo como una receta de cocina: los pasos siempre son los mismos — preparar ingredientes, cocinar, emplatar, servir. Pero cómo cocinas varía enormemente según el plato. La receta es el template; la implementación de cada paso es lo que cambia.

---

## 🔥 Problema que resuelve

Sin Template Method, el código duplicado aparece cuando múltiples clases comparten la misma estructura de algoritmo pero difieren en los detalles:

```typescript
// ❌ Sin Template Method — estructura duplicada en cada clase
class PDFReportGenerator {
    generate(): void {
        this.fetchData();        // igual en todos
        this.validateData();     // igual en todos
        this.formatAsPDF();      // distinto
        this.addHeader();        // distinto
        this.addFooter();        // distinto
        this.save();             // igual en todos
        this.notify();           // igual en todos
    }
}

class ExcelReportGenerator {
    generate(): void {
        this.fetchData();        // duplicado
        this.validateData();     // duplicado
        this.formatAsExcel();    // distinto
        this.addHeader();        // distinto
        this.addFooter();        // distinto
        this.save();             // duplicado
        this.notify();           // duplicado
    }
}

// ✅ Con Template Method — el esqueleto en la clase base, los detalles en las subclases
abstract class ReportGenerator {
    generate(): void {           // el template — nunca se sobreescribe
        this.fetchData();        // ← implementación base
        this.validateData();     // ← implementación base
        this.formatReport();     // ← abstracto: cada subclase lo define
        this.addHeader();        // ← abstracto: cada subclase lo define
        this.addFooter();        // ← hook: opcional, con default vacío
        this.save();             // ← implementación base
        this.notify();           // ← implementación base
    }
}
```

---

## 🗺️ Diagrama

```
  ReportGenerator (clase abstracta)
  ┌────────────────────────────────────────┐
  │ + generate()  ← TEMPLATE (final)      │
  │   1. fetchData()    ← implementado    │
  │   2. validateData() ← implementado    │
  │   3. formatReport() ← ABSTRACTO       │
  │   4. addHeader()    ← ABSTRACTO       │
  │   5. addFooter()    ← HOOK (opcional) │
  │   6. save()         ← implementado    │
  │   7. notify()       ← implementado    │
  └────────────────────────────────────────┘
               ▲
    ┌──────────┼──────────┐
    │          │          │
PDFReport  ExcelReport  HTMLReport
Implementa:  Implementa:  Implementa:
formatReport formatReport formatReport
addHeader    addHeader    addHeader
             addFooter    (no sobreescribe
             (hook)        el hook)
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Abstract Class** | Define el template method y los pasos abstractos y concretos | `ReportGenerator` |
| **Template Method** | El método que define el esqueleto — generalmente `final` | `generate()` |
| **Abstract Steps** | Pasos obligatorios que cada subclase debe implementar | `formatReport()`, `addHeader()` |
| **Hooks** | Pasos opcionales con implementación vacía por defecto | `addFooter()`, `onBeforeSave()` |
| **Concrete Class** | Implementa los pasos abstractos con su lógica específica | `PDFReportGenerator`, `ExcelReportGenerator`, `HTMLReportGenerator` |

---

## 💻 Implementación completa

### La clase abstracta — el template

```typescript
// report-generator.abstract.ts
interface ReportData {
    title: string;
    rows: Record<string, any>[];
    generatedAt: Date;
    author: string;
}

abstract class ReportGenerator {
    private data: ReportData | null = null;

    // ── TEMPLATE METHOD — define el esqueleto ─────────────
    // Se marca como final (convention en TS: no abstract, documentado)
    final generate(title: string, author: string): string {
        console.log(`\n📊 Generando reporte: ${title}`);

        this.data = this.fetchData(title, author);  // 1
        this.validateData(this.data);               // 2
        this.onBeforeFormat(this.data);             // 3 hook
        const content = this.formatReport(this.data); // 4 abstracto
        const header  = this.addHeader(this.data);    // 5 abstracto
        const footer  = this.addFooter(this.data);    // 6 hook
        const output  = this.assemble(header, content, footer); // 7
        this.save(output, title);                   // 8
        this.notify(title, author);                 // 9

        return output;
    }

    // ── PASOS CONCRETOS — implementados en la clase base ──
    private fetchData(title: string, author: string): ReportData {
        console.log(`  📥 Obteniendo datos...`);
        // Simula consulta a base de datos
        return {
            title,
            author,
            generatedAt: new Date(),
            rows: [
                { producto: "Laptop",  ventas: 45, ingresos: 54_000 },
                { producto: "Mouse",   ventas: 120, ingresos: 5_400  },
                { producto: "Teclado", ventas: 89,  ingresos: 7_921  },
            ],
        };
    }

    private validateData(data: ReportData): void {
        console.log(`  ✅ Validando datos (${data.rows.length} filas)...`);
        if (data.rows.length === 0) throw new Error("Sin datos para el reporte");
    }

    private assemble(header: string, content: string, footer: string): string {
        return [header, content, footer].filter(Boolean).join("\n");
    }

    private save(output: string, title: string): void {
        const filename = `${title.replace(/\s+/g, "_")}_${Date.now()}`;
        console.log(`  💾 Guardando ${filename}.${this.getExtension()}...`);
    }

    private notify(title: string, author: string): void {
        console.log(`  📧 Notificando a ${author}: reporte "${title}" listo`);
    }

    // ── PASOS ABSTRACTOS — cada subclase debe implementarlos ──
    protected abstract formatReport(data: ReportData): string;
    protected abstract addHeader(data: ReportData): string;
    protected abstract getExtension(): string;

    // ── HOOKS — opcionales, con implementación vacía por defecto ──
    protected onBeforeFormat(data: ReportData): void {}  // hook
    protected addFooter(data: ReportData): string { return ""; } // hook con default
}
```

### Subclases concretas

```typescript
// generators/pdf-report.generator.ts
class PDFReportGenerator extends ReportGenerator {
    protected getExtension() { return "pdf"; }

    protected addHeader(data: ReportData): string {
        return [
            "═".repeat(60),
            `  ${data.title.toUpperCase()}`,
            `  Generado: ${data.generatedAt.toLocaleDateString("es-ES")}`,
            `  Autor: ${data.author}`,
            "═".repeat(60),
        ].join("\n");
    }

    protected formatReport(data: ReportData): string {
        const lines = data.rows.map(row =>
            `  │ ${row.producto.padEnd(12)} │ ${String(row.ventas).padStart(6)} │ $${String(row.ingresos).padStart(8)} │`
        );
        return [
            `  ┌${"─".repeat(14)}┬${"─".repeat(8)}┬${"─".repeat(11)}┐`,
            `  │ Producto     │ Ventas │   Ingresos │`,
            `  ├${"─".repeat(14)}┼${"─".repeat(8)}┼${"─".repeat(11)}┤`,
            ...lines,
            `  └${"─".repeat(14)}┴${"─".repeat(8)}┴${"─".repeat(11)}┘`,
        ].join("\n");
    }

    protected addFooter(data: ReportData): string {
        const total = data.rows.reduce((s, r) => s + r.ingresos, 0);
        return `\n  TOTAL INGRESOS: $${total.toLocaleString()}\n${"─".repeat(60)}`;
    }

    // Sobreescribe el hook para loguear antes del formato
    protected onBeforeFormat(data: ReportData): void {
        console.log(`  🎨 Aplicando estilos PDF...`);
    }
}

// generators/excel-report.generator.ts
class ExcelReportGenerator extends ReportGenerator {
    protected getExtension() { return "xlsx"; }

    protected addHeader(data: ReportData): string {
        return `"${data.title}"\n"Generado:","${data.generatedAt.toISOString()}"\n"Autor:","${data.author}"\n`;
    }

    protected formatReport(data: ReportData): string {
        const headers = "Producto,Ventas,Ingresos";
        const rows    = data.rows.map(r => `${r.producto},${r.ventas},${r.ingresos}`);
        return [headers, ...rows].join("\n");
    }
    // No sobreescribe addFooter — usa el default (vacío)
}

// generators/html-report.generator.ts
class HTMLReportGenerator extends ReportGenerator {
    protected getExtension() { return "html"; }

    protected addHeader(data: ReportData): string {
        return `<!DOCTYPE html><html><head><title>${data.title}</title></head><body>\n<h1>${data.title}</h1>\n<p>Autor: ${data.author} | ${data.generatedAt.toLocaleDateString()}</p>`;
    }

    protected formatReport(data: ReportData): string {
        const rows = data.rows.map(r =>
            `  <tr><td>${r.producto}</td><td>${r.ventas}</td><td>$${r.ingresos}</td></tr>`
        ).join("\n");
        return `<table>\n  <tr><th>Producto</th><th>Ventas</th><th>Ingresos</th></tr>\n${rows}\n</table>`;
    }

    protected addFooter(data: ReportData): string {
        return `\n</body></html>`;
    }
}
```

---

## 💡 Uso

```typescript
// main.ts — el cliente usa el template method, nunca llama los pasos individuales
const pdfGen   = new PDFReportGenerator();
const excelGen = new ExcelReportGenerator();
const htmlGen  = new HTMLReportGenerator();

pdfGen.final("Reporte de Ventas Q1", "Ana García");
// 📊 Generando reporte: Reporte de Ventas Q1
//   📥 Obteniendo datos...
//   ✅ Validando datos (3 filas)...
//   🎨 Aplicando estilos PDF...   ← hook sobreescrito
//   [formatea tabla con bordes]
//   [agrega footer con total]
//   💾 Guardando Reporte_de_Ventas_Q1_timestamp.pdf...
//   📧 Notificando a Ana García

excelGen.final("Inventario Mensual", "Luis Pérez");
// 📊 Generando reporte: Inventario Mensual
//   📥 Obteniendo datos...
//   ✅ Validando datos...
//   [formatea como CSV]
//   💾 Guardando .xlsx...
//   📧 Notificando a Luis Pérez

htmlGen.final("Dashboard Web", "Sara López");
```

---

## 🪝 Hooks — pasos opcionales

Los **hooks** son métodos con implementación vacía (o con un default) en la clase base que las subclases pueden sobreescribir opcionalmente:

```typescript
abstract class DataProcessor {
    // Template method
    final process(input: string): string {
        const data     = this.parse(input);      // abstracto
        this.onParsed(data);                     // hook — opcional
        const result   = this.transform(data);  // abstracto
        this.onComplete(result);                 // hook — opcional
        return result;
    }

    protected abstract parse(input: string): any;
    protected abstract transform(data: any): string;

    // Hooks con implementación vacía
    protected onParsed(data: any): void {}
    protected onComplete(result: string): void {}
}

class JSONProcessor extends DataProcessor {
    protected parse(input: string)    { return JSON.parse(input); }
    protected transform(data: any)    { return JSON.stringify(data, null, 2); }

    // Sobreescribe solo el hook que necesita
    protected onParsed(data: any): void {
        console.log(`Parseados ${Object.keys(data).length} campos`);
    }
}
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas
- **Elimina código duplicado**: el esqueleto del algoritmo vive en un solo lugar.
- **Open/Closed**: agregar un nuevo tipo de reporte = una nueva subclase.
- **Control centralizado**: el orden de los pasos está garantizado por el template.
- **Hooks**: flexibilidad sin obligar a sobreescribir todo.

### ❌ Desventajas
- **Herencia**: está basado en herencia — si la jerarquía crece mucho, puede volverse rígido.
- **Inversión de control**: las subclases no controlan cuándo se llaman sus métodos — el template lo hace.
- **Difícil de depurar**: el flujo salta entre la clase base y la subclase constantemente.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Template Method? |
|---|---|
| Múltiples clases comparten la **misma estructura de algoritmo** | ✅ Sí |
| Quieres evitar **código duplicado** en subclases | ✅ Sí |
| El **orden de los pasos es fijo** pero los detalles varían | ✅ Sí |
| Necesitas **pasos opcionales** (hooks) en el algoritmo | ✅ Sí |
| Las variantes no tienen relación jerárquica entre sí | ❌ Usa Strategy |

---

## ⚖️ Template Method vs Strategy

| Aspecto | Template Method | Strategy |
|---|---|---|
| **Mecanismo** | Herencia | Composición |
| **Quién define el algoritmo** | Clase base | El cliente elige la estrategia |
| **Cambio en runtime** | ❌ No | ✅ Sí |
| **Granularidad** | Pasos individuales del algoritmo | El algoritmo completo |
| **Cuándo elegirlo** | Esqueleto fijo, detalles variables | Algoritmo completo intercambiable |

---

*Patrón: Template Method — Familia: Comportamiento — GoF (Gang of Four)*
