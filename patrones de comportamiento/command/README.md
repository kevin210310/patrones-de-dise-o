# 📟 Patrón de Comportamiento: Command

> Encapsula una solicitud como un objeto — permitiendo parametrizar acciones, encolarlas, deshacerlas y rehacerlas.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Editor de texto con undo/redo](#-ejemplo--editor-de-texto-con-undoredo)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ejemplo adicional — Cola de tareas asíncronas](#-ejemplo-adicional--cola-de-tareas-asíncronas)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Comparación con otros patrones de comportamiento](#-comparación-con-otros-patrones-de-comportamiento)

---

## 📋 Descripción

El **Command** es un patrón de diseño **de comportamiento** que convierte una solicitud en un objeto independiente que contiene toda la información sobre esa solicitud: qué acción ejecutar, sobre qué receptor y con qué parámetros.

Esto permite:
- **Parametrizar** objetos con diferentes acciones
- **Encolar** o programar acciones para ejecución posterior
- **Deshacer / Rehacer** operaciones (`undo` / `redo`)
- **Registrar** un historial de operaciones

> 💡 Piénsalo como un control remoto: cada botón es un comando encapsulado. El control no sabe cómo enciende el televisor — solo sabe que tiene un comando `EncenderTV` que sabe hacerlo. Puedes cambiar el televisor sin cambiar el control.

---

## 🔥 Problema que resuelve

Sin Command, las acciones están acopladas directamente al receptor — imposible deshacerlas, encolarlas o registrarlas:

```typescript
// ❌ Sin Command — acciones directas, sin historial ni undo
class TextEditor {
    private text = "";

    insertText(position: number, content: string): void {
        this.text = this.text.slice(0, position) + content + this.text.slice(position);
    }

    deleteText(position: number, length: number): void {
        this.text = this.text.slice(0, position) + this.text.slice(position + length);
    }
    // ¿Cómo deshaces la última acción? No hay forma — la información se perdió
}

// ✅ Con Command — cada acción es un objeto con toda su información
const editor = new TextEditor();
const history = new CommandHistory();

const cmd = new InsertTextCommand(editor, 0, "Hola mundo");
history.execute(cmd);   // ejecuta y guarda en historial

history.undo();         // deshace el InsertText
history.redo();         // rehace el InsertText
```

---

## 🗺️ Diagrama

```
  CLIENTE (Invoker)
  Construye y ejecuta comandos
  a través del CommandHistory
       │
       │ history.execute(command)
       ▼
┌──────────────────────────────┐
│       CommandHistory         │  ← Invoker
│                              │
│  history: Command[]          │
│  redoStack: Command[]        │
│                              │
│  + execute(cmd): void        │  → cmd.execute() + push al historial
│  + undo(): void              │  → cmd.undo()    + mueve al redoStack
│  + redo(): void              │  → cmd.execute() + mueve al historial
└──────────────────────────────┘
       │ usa
       ▼
┌─────────────────────┐
│   <<interface>>     │
│     Command         │
│  + execute(): void  │
│  + undo(): void     │
│  + describe(): str  │
└─────────────────────┘
          ▲
 ┌────────┼────────────┐
 │        │            │
 ▼        ▼            ▼
InsertText DeleteText FormatText   ← Comandos concretos
Command    Command    Command        (saben cómo ejecutarse
                                      y deshacerse)
 │         │            │
 └────┬────┘            │
      │ opera sobre     │
      ▼                 ▼
┌────────────┐    ┌────────────┐
│ TextEditor │    │ TextEditor │   ← Receiver
│ (Receptor) │    │ (Receptor) │
└────────────┘    └────────────┘
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Command** | Interfaz con `execute()` y `undo()` | `Command` |
| **Concrete Command** | Encapsula la acción y su inversa. Almacena el estado necesario para deshacer | `InsertTextCommand`, `DeleteTextCommand`, `FormatTextCommand` |
| **Receiver** | El objeto que sabe cómo realizar la operación real | `TextEditor` |
| **Invoker** | Ejecuta los comandos y gestiona el historial | `CommandHistory` |
| **Client** | Crea los comandos concretos y los pasa al Invoker | `main.ts` |

---

## 🌍 Ejemplo — Editor de texto con undo/redo

El escenario: un editor de texto donde cada operación (insertar, eliminar, dar formato) puede deshacerse y rehacerse indefinidamente. El historial actúa como un stack de comandos ejecutados.

---

## 💻 Implementación completa

### La interfaz Command

```typescript
// command.interface.ts
interface Command {
    execute(): void;
    undo(): void;
    describe(): string; // descripción legible para el historial
}
```

### El Receiver — el editor de texto

```typescript
// text-editor.ts
interface TextFormat {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
}

class TextEditor {
    private content: string = "";
    private formats: Map<string, TextFormat> = new Map(); // key: "start-end"

    // Operaciones que los comandos invocan
    insert(position: number, text: string): void {
        this.content =
            this.content.slice(0, position) +
            text +
            this.content.slice(position);
    }

    delete(position: number, length: number): string {
        const deleted = this.content.slice(position, position + length);
        this.content  =
            this.content.slice(0, position) +
            this.content.slice(position + length);
        return deleted; // retorna el texto eliminado para poder reinsertarlo en undo
    }

    applyFormat(start: number, end: number, format: TextFormat): TextFormat {
        const key         = `${start}-${end}`;
        const prevFormat  = this.formats.get(key) ?? {};
        this.formats.set(key, { ...prevFormat, ...format });
        return prevFormat; // retorna el formato anterior para poder revertirlo
    }

    getContent(): string {
        return this.content;
    }

    getLength(): number {
        return this.content.length;
    }

    display(): void {
        console.log(`  📄 Contenido: "${this.content}" (${this.content.length} chars)`);
        if (this.formats.size > 0) {
            this.formats.forEach((fmt, key) => {
                console.log(`     Formato [${key}]:`, fmt);
            });
        }
    }
}
```

### Comandos concretos

```typescript
// commands/insert-text.command.ts
class InsertTextCommand implements Command {
    constructor(
        private readonly editor: TextEditor,
        private readonly position: number,
        private readonly text: string,
    ) {}

    execute(): void {
        this.editor.insert(this.position, this.text);
    }

    undo(): void {
        // Inversa de insert → delete el texto que se insertó
        this.editor.delete(this.position, this.text.length);
    }

    describe(): string {
        return `Insertar "${this.text}" en posición ${this.position}`;
    }
}

// commands/delete-text.command.ts
class DeleteTextCommand implements Command {
    private deletedText: string = ""; // guarda el texto eliminado para el undo

    constructor(
        private readonly editor: TextEditor,
        private readonly position: number,
        private readonly length: number,
    ) {}

    execute(): void {
        // Guarda el texto antes de eliminarlo — necesario para undo
        this.deletedText = this.editor.delete(this.position, this.length);
    }

    undo(): void {
        // Inversa de delete → reinserta el texto guardado
        this.editor.insert(this.position, this.deletedText);
    }

    describe(): string {
        return `Eliminar ${this.length} caracteres desde posición ${this.position}`;
    }
}

// commands/format-text.command.ts
class FormatTextCommand implements Command {
    private previousFormat: TextFormat = {}; // guarda el formato anterior para undo

    constructor(
        private readonly editor: TextEditor,
        private readonly start: number,
        private readonly end: number,
        private readonly format: TextFormat,
    ) {}

    execute(): void {
        // Guarda el formato previo antes de aplicar el nuevo
        this.previousFormat = this.editor.applyFormat(this.start, this.end, this.format);
    }

    undo(): void {
        // Restaura el formato anterior
        this.editor.applyFormat(this.start, this.end, this.previousFormat);
    }

    describe(): string {
        const fmt = Object.entries(this.format)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ");
        return `Formatear [${this.start}-${this.end}]: ${fmt}`;
    }
}

// commands/composite-command.ts — agrupa múltiples comandos en uno (Command + Composite)
class CompositeCommand implements Command {
    private commands: Command[];

    constructor(...commands: Command[]) {
        this.commands = commands;
    }

    execute(): void {
        this.commands.forEach(cmd => cmd.execute());
    }

    undo(): void {
        // Deshace en orden inverso
        [...this.commands].reverse().forEach(cmd => cmd.undo());
    }

    describe(): string {
        return `Macro: [${this.commands.map(c => c.describe()).join(" | ")}]`;
    }
}
```

### El Invoker — el historial de comandos

```typescript
// command-history.ts
class CommandHistory {
    private history:   Command[] = [];
    private redoStack: Command[] = [];

    execute(command: Command): void {
        command.execute();
        this.history.push(command);
        this.redoStack = []; // un nuevo comando limpia el redo stack
        console.log(`  ▶️  Ejecutado: ${command.describe()}`);
    }

    undo(): void {
        const command = this.history.pop();
        if (!command) {
            console.log(`  ⚠️  Nada que deshacer`);
            return;
        }
        command.undo();
        this.redoStack.push(command);
        console.log(`  ↩️  Deshecho: ${command.describe()}`);
    }

    redo(): void {
        const command = this.redoStack.pop();
        if (!command) {
            console.log(`  ⚠️  Nada que rehacer`);
            return;
        }
        command.execute();
        this.history.push(command);
        console.log(`  ↪️  Rehecho: ${command.describe()}`);
    }

    printHistory(): void {
        console.log(`\n  📋 Historial (${this.history.length} comandos):`);
        this.history.forEach((cmd, i) => {
            console.log(`     ${i + 1}. ${cmd.describe()}`);
        });
        if (this.redoStack.length > 0) {
            console.log(`  🔄 Redo stack (${this.redoStack.length} comandos):`);
            this.redoStack.forEach((cmd, i) => {
                console.log(`     ${i + 1}. ${cmd.describe()}`);
            });
        }
    }
}
```

---

## 💡 Uso

```typescript
// main.ts
const editor  = new TextEditor();
const history = new CommandHistory();

console.log("=== Operaciones básicas ===\n");

// Insertar texto
history.execute(new InsertTextCommand(editor, 0, "Hola"));
editor.display();
// 📄 Contenido: "Hola" (4 chars)

history.execute(new InsertTextCommand(editor, 4, " mundo"));
editor.display();
// 📄 Contenido: "Hola mundo" (10 chars)

history.execute(new InsertTextCommand(editor, 10, "!"));
editor.display();
// 📄 Contenido: "Hola mundo!" (11 chars)

// Aplicar formato
history.execute(new FormatTextCommand(editor, 0, 4, { bold: true, color: "blue" }));
editor.display();
// 📄 Contenido: "Hola mundo!"
//    Formato [0-4]: { bold: true, color: 'blue' }

console.log("\n=== Undo × 2 ===\n");

history.undo();
// ↩️  Deshecho: Formatear [0-4]: bold=true, color=blue
editor.display();
// 📄 Contenido: "Hola mundo!" (sin formato)

history.undo();
// ↩️  Deshecho: Insertar "!" en posición 10
editor.display();
// 📄 Contenido: "Hola mundo" (10 chars)

console.log("\n=== Redo ===\n");

history.redo();
// ↪️  Rehecho: Insertar "!" en posición 10
editor.display();
// 📄 Contenido: "Hola mundo!" (11 chars)

console.log("\n=== Eliminar texto ===\n");

history.execute(new DeleteTextCommand(editor, 4, 6)); // elimina " mundo"
editor.display();
// 📄 Contenido: "Hola!" (5 chars)

history.undo();
// ↩️  Deshecho: Eliminar 6 caracteres desde posición 4
editor.display();
// 📄 Contenido: "Hola mundo!" (11 chars) — restaurado

console.log("\n=== Comando compuesto (Macro) ===\n");

const macro = new CompositeCommand(
    new InsertTextCommand(editor, 11, " ¿Cómo estás?"),
    new FormatTextCommand(editor, 12, 24, { italic: true }),
);

history.execute(macro);
// ▶️  Ejecutado: Macro: [Insertar " ¿Cómo estás?" en posición 11 | Formatear [12-24]: italic=true]
editor.display();

history.undo(); // deshace ambas operaciones del macro a la vez
// ↩️  Deshecho: Macro: [...]
editor.display();
// 📄 Contenido: "Hola mundo!" — volvió al estado anterior

history.printHistory();
// 📋 Historial (4 comandos):
//    1. Insertar "Hola" en posición 0
//    2. Insertar " mundo" en posición 4
//    3. Insertar "!" en posición 10
//    4. Eliminar 6 caracteres desde posición 4  ← el que se rehízo
// 🔄 Redo stack (1 comandos):
//    1. Macro: [...]
```

---

## ⏰ Ejemplo adicional — Cola de tareas asíncronas

Command es perfecto para encolar operaciones que deben ejecutarse diferido, en lote o en orden:

```typescript
// command.async.interface.ts
interface AsyncCommand {
    execute(): Promise<void>;
    describe(): string;
}

// Comandos concretos async
class SendEmailCommand implements AsyncCommand {
    constructor(private readonly to: string, private readonly subject: string) {}

    async execute(): Promise<void> {
        console.log(`  📧 Enviando email a ${this.to}: "${this.subject}"`);
        await new Promise(r => setTimeout(r, 100)); // simula I/O
    }

    describe(): string { return `SendEmail → ${this.to}`; }
}

class ResizeImageCommand implements AsyncCommand {
    constructor(private readonly file: string, private readonly width: number) {}

    async execute(): Promise<void> {
        console.log(`  🖼️  Redimensionando ${this.file} a ${this.width}px`);
        await new Promise(r => setTimeout(r, 200));
    }

    describe(): string { return `ResizeImage → ${this.file} @ ${this.width}px`; }
}

class GenerateReportCommand implements AsyncCommand {
    constructor(private readonly type: string) {}

    async execute(): Promise<void> {
        console.log(`  📊 Generando reporte: ${this.type}`);
        await new Promise(r => setTimeout(r, 300));
    }

    describe(): string { return `GenerateReport → ${this.type}`; }
}

// Cola de comandos — el Invoker async
class TaskQueue {
    private queue: AsyncCommand[] = [];
    private running = false;

    enqueue(command: AsyncCommand): void {
        this.queue.push(command);
        console.log(`  ➕ En cola: ${command.describe()} (${this.queue.length} pendientes)`);
    }

    async processAll(): Promise<void> {
        if (this.running) return;
        this.running = true;
        console.log(`\n  🚀 Procesando ${this.queue.length} tareas...\n`);

        while (this.queue.length > 0) {
            const command = this.queue.shift()!;
            await command.execute();
        }

        this.running = false;
        console.log(`\n  ✅ Cola vacía — todas las tareas completadas`);
    }
}

// Uso
const queue = new TaskQueue();

queue.enqueue(new SendEmailCommand("ana@mail.com", "Bienvenida"));
queue.enqueue(new ResizeImageCommand("avatar.png", 128));
queue.enqueue(new GenerateReportCommand("ventas-marzo"));
queue.enqueue(new SendEmailCommand("luis@mail.com", "Reporte listo"));

await queue.processAll();
// 🚀 Procesando 4 tareas...
//   📧 Enviando email a ana@mail.com: "Bienvenida"
//   🖼️  Redimensionando avatar.png a 128px
//   📊 Generando reporte: ventas-marzo
//   📧 Enviando email a luis@mail.com: "Reporte listo"
// ✅ Cola vacía — todas las tareas completadas
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Undo / Redo**: al encapsular la acción y su inversa en el mismo objeto, el historial se implementa naturalmente.
- **Encolar y diferir**: los comandos pueden almacenarse y ejecutarse más tarde — perfecto para colas de trabajo.
- **Desacoplamiento total**: el Invoker no sabe nada del Receiver — solo llama `execute()`.
- **Composición**: los `CompositeCommand` agrupan múltiples comandos en uno (macros).
- **Registro / Auditoría**: cada comando tiene un `describe()` — construir un log de auditoría es trivial.

### ❌ Desventajas

- **Explosión de clases**: cada operación distinta requiere su propia clase de Command.
- **Complejidad de undo**: para operaciones complejas, guardar el estado necesario para deshacer puede ser difícil o costoso en memoria.
- **Overhead**: para operaciones simples que nunca necesitan undo ni encolado, el patrón es sobredimensionado.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Command? |
|---|---|
| Necesitas **undo / redo** en tu aplicación | ✅ Sí |
| Quieres **encolar operaciones** para ejecución diferida o en lote | ✅ Sí |
| Necesitas un **log de auditoría** de todas las acciones realizadas | ✅ Sí |
| Quieres **parametrizar** botones o menús con acciones configurables | ✅ Sí |
| Necesitas **macros** (grupos de operaciones como una sola) | ✅ Sí |
| La operación es simple, única y nunca necesita deshacerse | ❌ No vale la complejidad |

---

## ⚖️ Comparación con otros patrones de comportamiento

| Patrón | Encapsula | Permite undo | Permite encolar | Cuándo usarlo |
|---|---|---|---|---|
| **Command** | Una acción con su inversa | ✅ Sí | ✅ Sí | Historial, colas, macros |
| **Chain of Responsibility** | Una solicitud que pasa por handlers | ❌ No | ❌ No | Validaciones en pipeline |
| **Strategy** | Un algoritmo intercambiable | ❌ No | ❌ No | Seleccionar comportamiento en runtime |
| **Observer** | Una notificación a suscriptores | ❌ No | ❌ No | Eventos y reactividad |
| **Memento** | El estado completo del objeto | ✅ Sí (snapshot) | ❌ No | Guardar / restaurar estado |

> 💡 **Command + Memento**: son complementarios — Command sabe *cómo* deshacer una acción específica, Memento guarda *todo el estado* del objeto. Para undo simples usa Command; para restaurar estados complejos combina ambos.

---

*Patrón: Command — Familia: Comportamiento — GoF (Gang of Four)*
