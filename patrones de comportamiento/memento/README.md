# 📸 Patrón de Comportamiento: Memento

> Captura y externaliza el estado interno de un objeto sin violar su encapsulamiento — permitiendo restaurarlo más tarde.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Editor con snapshots](#-ejemplo--editor-con-snapshots)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Memento vs Command para undo](#-memento-vs-command-para-undo)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)

---

## 📋 Descripción

El **Memento** es un patrón de diseño **de comportamiento** que permite guardar y restaurar el estado anterior de un objeto sin revelar los detalles de su implementación. El estado se almacena en un objeto externo llamado *memento*, pero solo el objeto creador puede leerlo.

> 💡 Piénsalo como una fotografía: captura exactamente cómo estaba algo en un momento dado. Puedes volver a ese momento en cualquier momento, pero la foto no te dice cómo está construido lo que fotografió.

---

## 🔥 Problema que resuelve

Sin Memento, para implementar undo debes exponer el estado interno del objeto o duplicar toda la lógica fuera de él:

```typescript
// ❌ Sin Memento — expones el estado interno para poder guardarlo
class GameCharacter {
    public health: number;    // debe ser público para guardarlo externamente
    public position: Point;   // idem
    public inventory: Item[]; // idem — rompe el encapsulamiento
}

// ✅ Con Memento — el estado se guarda de forma opaca
const snapshot = character.save();   // crea un Memento
// ... el personaje recibe daño, pierde items ...
character.restore(snapshot);         // vuelve al estado anterior
// El cliente nunca vio ni tocó los internos del personaje
```

---

## 🗺️ Diagrama

```
  ORIGINATOR                MEMENTO                  CARETAKER
  (el objeto a guardar)     (el snapshot)            (gestiona los snapshots)

┌─────────────────┐        ┌──────────────────┐     ┌────────────────────┐
│  TextDocument   │        │  DocumentMemento │     │  DocumentHistory   │
│                 │ save() │                  │     │                    │
│ - content       │───────▶│ - state: State   │     │ - mementos: []     │
│ - cursorPos     │        │   (opaco)        │     │                    │
│ - formatRules   │        │                  │     │ + save(orig)       │
│                 │        │ + getState()     │     │ + undo(orig)       │
│ + save()        │        │   (solo el       │     │ + redo(orig)       │
│ + restore(memo) │◀───────│    Originator    │     │ + getCount()       │
│                 │restore │    puede leer)   │     └────────────────────┘
└─────────────────┘        └──────────────────┘
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Originator** | El objeto cuyo estado se guarda. Crea y usa Mementos | `TextDocument` |
| **Memento** | Almacena el estado del Originator de forma opaca | `DocumentMemento` |
| **Caretaker** | Gestiona los Mementos sin acceder a su contenido | `DocumentHistory` |

---

## 💻 Implementación completa

### El Memento — el snapshot opaco

```typescript
// document-memento.ts
interface DocumentState {
    content: string;
    cursorPosition: number;
    selectionStart: number;
    selectionEnd: number;
    formatRules: Record<string, string>;
    timestamp: Date;
}

class DocumentMemento {
    // El estado es privado — solo el Originator puede acceder a él
    private readonly state: DocumentState;

    constructor(state: DocumentState) {
        // Deep copy para evitar que el Originator mute el snapshot
        this.state = {
            ...state,
            formatRules: { ...state.formatRules },
            timestamp:   new Date(),
        };
    }

    // Solo el Originator llama a este método
    getState(): DocumentState {
        return { ...this.state, formatRules: { ...this.state.formatRules } };
    }

    getTimestamp(): Date { return this.state.timestamp; }
    getPreview(): string { return this.state.content.slice(0, 40) + "..."; }
}
```

### El Originator — el documento

```typescript
// text-document.ts
class TextDocument {
    private content        = "";
    private cursorPosition = 0;
    private selectionStart = 0;
    private selectionEnd   = 0;
    private formatRules: Record<string, string> = {};

    // Operaciones del documento
    type(text: string): void {
        this.content =
            this.content.slice(0, this.cursorPosition) +
            text +
            this.content.slice(this.cursorPosition);
        this.cursorPosition += text.length;
    }

    delete(length: number): void {
        const start = Math.max(0, this.cursorPosition - length);
        this.content =
            this.content.slice(0, start) +
            this.content.slice(this.cursorPosition);
        this.cursorPosition = start;
    }

    moveCursor(position: number): void {
        this.cursorPosition = Math.max(0, Math.min(position, this.content.length));
    }

    select(start: number, end: number): void {
        this.selectionStart = start;
        this.selectionEnd   = end;
    }

    applyFormat(key: string, value: string): void {
        this.formatRules[key] = value;
    }

    // Memento: crea un snapshot del estado actual
    save(): DocumentMemento {
        return new DocumentMemento({
            content:        this.content,
            cursorPosition: this.cursorPosition,
            selectionStart: this.selectionStart,
            selectionEnd:   this.selectionEnd,
            formatRules:    this.formatRules,
            timestamp:      new Date(),
        });
    }

    // Memento: restaura desde un snapshot
    restore(memento: DocumentMemento): void {
        const state         = memento.getState();
        this.content        = state.content;
        this.cursorPosition = state.cursorPosition;
        this.selectionStart = state.selectionStart;
        this.selectionEnd   = state.selectionEnd;
        this.formatRules    = state.formatRules;
    }

    display(): void {
        console.log(`  📄 "${this.content}" | cursor: ${this.cursorPosition}`);
        if (Object.keys(this.formatRules).length > 0) {
            console.log(`     Formato:`, this.formatRules);
        }
    }
}
```

### El Caretaker — el historial

```typescript
// document-history.ts
class DocumentHistory {
    private undoStack: DocumentMemento[] = [];
    private redoStack: DocumentMemento[] = [];
    private readonly maxSnapshots: number;

    constructor(maxSnapshots: number = 50) {
        this.maxSnapshots = maxSnapshots;
    }

    // Guarda el estado actual del documento
    save(document: TextDocument): void {
        const memento = document.save();
        this.undoStack.push(memento);
        this.redoStack = []; // un nuevo cambio invalida el redo

        // Limita el historial para no consumir demasiada memoria
        if (this.undoStack.length > this.maxSnapshots) {
            this.undoStack.shift();
        }

        console.log(`  💾 Snapshot guardado (${this.undoStack.length} en historial)`);
    }

    undo(document: TextDocument): boolean {
        if (this.undoStack.length <= 1) {
            console.log(`  ⚠️  Nada que deshacer`);
            return false;
        }

        // Mueve el estado actual al redo stack
        const current = this.undoStack.pop()!;
        this.redoStack.push(current);

        // Restaura el estado anterior
        const previous = this.undoStack[this.undoStack.length - 1];
        document.restore(previous);
        console.log(`  ↩️  Undo → snapshot del ${previous.getTimestamp().toISOString()}`);
        return true;
    }

    redo(document: TextDocument): boolean {
        if (this.redoStack.length === 0) {
            console.log(`  ⚠️  Nada que rehacer`);
            return false;
        }

        const next = this.redoStack.pop()!;
        this.undoStack.push(next);
        document.restore(next);
        console.log(`  ↪️  Redo → snapshot del ${next.getTimestamp().toISOString()}`);
        return true;
    }

    printHistory(): void {
        console.log(`\n  📋 Historial (${this.undoStack.length} snapshots):`);
        this.undoStack.forEach((m, i) => {
            console.log(`     ${i + 1}. [${m.getTimestamp().toLocaleTimeString()}] "${m.getPreview()}"`);
        });
    }
}
```

---

## 💡 Uso

```typescript
// main.ts
const doc     = new TextDocument();
const history = new DocumentHistory();

// Estado inicial
history.save(doc);

doc.type("Hola");
history.save(doc);
doc.display(); // "Hola" | cursor: 4

doc.type(" mundo");
history.save(doc);
doc.display(); // "Hola mundo" | cursor: 10

doc.type("!");
doc.applyFormat("bold", "0-4");
history.save(doc);
doc.display(); // "Hola mundo!" | cursor: 11

// Undo dos veces
history.undo(doc);
doc.display(); // "Hola mundo" | cursor: 10

history.undo(doc);
doc.display(); // "Hola" | cursor: 4

// Redo
history.redo(doc);
doc.display(); // "Hola mundo" | cursor: 10

history.printHistory();
// 📋 Historial (3 snapshots):
//    1. [12:00:01] ""...
//    2. [12:00:02] "Hola"...
//    3. [12:00:03] "Hola mundo"...
```

---

## ⚖️ Memento vs Command para undo

| Aspecto | Memento | Command |
|---|---|---|
| **Qué guarda** | Todo el estado del objeto (snapshot) | Solo lo necesario para revertir esa acción |
| **Encapsulamiento** | ✅ El estado no se expone | ✅ Igual |
| **Memoria** | ⚠️ Alto — guarda todo el estado cada vez | ✅ Bajo — solo el delta |
| **Complejidad de undo** | ✅ Simple — restaurar el snapshot | ⚠️ Requiere implementar la inversa de cada operación |
| **Granularidad** | Un snapshot por "momento" | Un comando por operación |
| **Ideal para** | Estados complejos o cuando no puedes calcular la inversa | Operaciones simples con inversas claras |

---

## ➕ Ventajas y desventajas

### ✅ Ventajas
- **Encapsulamiento preservado**: el estado se guarda sin exponerlo al exterior.
- **Undo simple**: restaurar = cargar snapshot, sin lógica de inversión.
- **Historial completo**: puedes navegar a cualquier punto del historial.

### ❌ Desventajas
- **Consumo de memoria**: guardar el estado completo frecuentemente puede ser costoso.
- **Snapshots grandes**: objetos con mucho estado generan Mementos pesados.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Memento? |
|---|---|
| Necesitas **undo/redo** y el estado es complejo o no tiene inversa obvia | ✅ Sí |
| Quieres **guardar puntos de restauración** (checkpoints en un juego) | ✅ Sí |
| El estado del objeto **no debe exponerse** al exterior | ✅ Sí |
| El objeto tiene poco estado o las operaciones tienen inversas claras | ❌ Usa Command |

---

*Patrón: Memento — Familia: Comportamiento — GoF (Gang of Four)*
