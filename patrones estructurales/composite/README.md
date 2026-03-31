# 🌳 Patrón Estructural: Composite

> Compone objetos en estructuras de árbol para representar jerarquías parte-todo — el cliente trata a objetos individuales y composiciones de la misma manera.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Sistema de archivos](#-ejemplo--sistema-de-archivos)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ejemplo adicional — Menú de UI](#-ejemplo-adicional--menú-de-ui)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Comparación con otros patrones estructurales](#-comparación-con-otros-patrones-estructurales)

---

## 📋 Descripción

El **Composite** es un patrón de diseño **estructural** que permite componer objetos en estructuras de árbol y trabajar con esas estructuras como si fueran objetos individuales.

La idea central: tanto los **nodos hoja** (sin hijos) como los **nodos compuestos** (con hijos) implementan la **misma interfaz**. El cliente nunca distingue entre un objeto simple y una jerarquía entera — les llama exactamente igual.

> 💡 Piénsalo como el sistema de archivos de tu computadora: puedes copiar un archivo o una carpeta completa con el mismo comando `cp`. No importa si dentro hay 1 archivo o 10,000 — el comportamiento se aplica de forma recursiva.

---

## 🔥 Problema que resuelve

Sin Composite, el cliente debe distinguir entre objetos simples y compuestos para operar sobre ellos:

```typescript
// ❌ Sin Composite — el cliente maneja dos tipos de forma diferente
function calcularTamaño(item: File | Folder): number {
    if (item instanceof File) {
        return item.size; // hoja
    } else {
        // compuesto — el cliente hace la recursión manualmente
        let total = 0;
        for (const child of item.children) {
            total += calcularTamaño(child); // y si hay carpetas dentro de carpetas...
        }
        return total;
    }
}

// ✅ Con Composite — el cliente llama lo mismo sin importar el tipo
function calcularTamaño(item: FileSystemItem): number {
    return item.getSize(); // recursión encapsulada dentro del árbol
}
```

---

## 🗺️ Diagrama

```
          <<interface>>
          FileSystemItem
          + name: string
          + getSize(): number
          + print(indent?: string): void
                 ▲
        ┌────────┴────────┐
        │                 │
      File              Folder
   (Hoja / Leaf)    (Compuesto / Composite)
                          │
   + name                 + name
   + size                 + children: FileSystemItem[]
                          │
   + getSize()            + add(item): void
     → this.size          + remove(item): void
                          + getSize()
   + print()               → sum of children.getSize()
     → imprime             + print()
       el archivo           → imprime y delega
                              a cada hijo

Estructura en árbol:
  📁 root/                     ← Folder (Composite)
  ├── 📄 readme.txt            ← File (Leaf)
  ├── 📄 index.ts              ← File (Leaf)
  └── 📁 src/                  ← Folder (Composite)
      ├── 📄 app.ts            ← File (Leaf)
      └── 📁 components/       ← Folder (Composite)
          ├── 📄 Button.tsx    ← File (Leaf)
          └── 📄 Input.tsx     ← File (Leaf)

  root.getSize() → suma recursiva de todos los nodos
  El cliente llama getSize() igual sobre File o Folder
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Component** | Interfaz común para hojas y compuestos | `FileSystemItem` |
| **Leaf** | Nodo sin hijos — implementa la operación directamente | `File` |
| **Composite** | Nodo con hijos — delega la operación a sus hijos recursivamente | `Folder` |
| **Client** | Opera sobre la interfaz `Component` sin distinguir Leaf de Composite | `main.ts` |

---

## 🌍 Ejemplo — Sistema de archivos

El escenario: un sistema de archivos donde carpetas pueden contener archivos y otras carpetas. Las operaciones como `getSize()` y `print()` deben funcionar igual sobre un archivo individual o una carpeta con miles de archivos.

---

## 💻 Implementación completa

### Component — la interfaz común

```typescript
// file-system-item.interface.ts
interface FileSystemItem {
    name: string;
    getSize(): number;                  // tamaño en bytes
    print(indent?: string): void;       // visualización del árbol
    getPath(parentPath?: string): string;
}
```

### Leaf — el archivo (nodo sin hijos)

```typescript
// file.ts
class File implements FileSystemItem {
    constructor(
        public readonly name: string,
        private readonly size: number,  // en bytes
        private readonly extension: string,
    ) {}

    getSize(): number {
        return this.size; // un archivo simplemente retorna su propio tamaño
    }

    getPath(parentPath: string = ""): string {
        return `${parentPath}/${this.name}`;
    }

    print(indent: string = ""): void {
        const icon = this.getIcon();
        const kb   = (this.size / 1024).toFixed(1);
        console.log(`${indent}${icon} ${this.name} (${kb} KB)`);
    }

    private getIcon(): string {
        const icons: Record<string, string> = {
            ts:   "📘", tsx:  "⚛️",
            js:   "📙", json: "📋",
            md:   "📝", css:  "🎨",
            png:  "🖼️",  pdf:  "📄",
        };
        return icons[this.extension] ?? "📄";
    }
}
```

### Composite — la carpeta (nodo con hijos)

```typescript
// folder.ts
class Folder implements FileSystemItem {
    private children: FileSystemItem[] = [];

    constructor(public readonly name: string) {}

    // Gestión de hijos
    add(item: FileSystemItem): Folder {
        this.children.push(item);
        return this; // permite encadenamiento
    }

    remove(item: FileSystemItem): void {
        const index = this.children.indexOf(item);
        if (index !== -1) this.children.splice(index, 1);
    }

    getChildren(): FileSystemItem[] {
        return [...this.children];
    }

    // Operaciones — delegan recursivamente a los hijos
    getSize(): number {
        // La recursión ocurre aquí — el cliente nunca la ve
        return this.children.reduce((total, child) => total + child.getSize(), 0);
    }

    getPath(parentPath: string = ""): string {
        return `${parentPath}/${this.name}`;
    }

    print(indent: string = ""): void {
        const size = this.formatSize(this.getSize());
        console.log(`${indent}📁 ${this.name}/ (${size})`);

        // Delega a cada hijo — ellos saben cómo imprimirse
        for (const child of this.children) {
            child.print(indent + "  ");
        }
    }

    // Búsqueda recursiva dentro del árbol
    find(name: string): FileSystemItem | null {
        if (this.name === name) return this;

        for (const child of this.children) {
            if (child.name === name) return child;
            if (child instanceof Folder) {
                const found = child.find(name);
                if (found) return found;
            }
        }
        return null;
    }

    // Cuenta recursiva de todos los archivos (no carpetas)
    countFiles(): number {
        return this.children.reduce((count, child) => {
            if (child instanceof File)   return count + 1;
            if (child instanceof Folder) return count + child.countFiles();
            return count;
        }, 0);
    }

    private formatSize(bytes: number): string {
        if (bytes < 1024)        return `${bytes} B`;
        if (bytes < 1024 ** 2)   return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
        return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    }
}
```

---

## 💡 Uso

```typescript
// main.ts

// ── Construcción del árbol ────────────────────────────────
const root = new Folder("proyecto");

// Archivos en raíz
root
    .add(new File("README.md",      2_048, "md"))
    .add(new File("package.json",   1_200, "json"))
    .add(new File("tsconfig.json",    800, "json"));

// Carpeta src con subcarpetas
const src = new Folder("src");

const components = new Folder("components");
components
    .add(new File("Button.tsx",   4_500, "tsx"))
    .add(new File("Input.tsx",    3_200, "tsx"))
    .add(new File("Modal.tsx",    6_100, "tsx"));

const services = new Folder("services");
services
    .add(new File("auth.service.ts",    8_300, "ts"))
    .add(new File("api.service.ts",     5_700, "ts"))
    .add(new File("storage.service.ts", 3_100, "ts"));

const assets = new Folder("assets");
assets
    .add(new File("logo.png",    45_000, "png"))
    .add(new File("banner.png", 120_000, "png"));

src
    .add(new File("main.ts",   1_500, "ts"))
    .add(new File("app.ts",    3_800, "ts"))
    .add(components)
    .add(services)
    .add(assets);

root.add(src);

// ── Operaciones — el cliente trata todo igual ─────────────

// Imprimir el árbol completo
console.log("=== Estructura del proyecto ===\n");
root.print();
// 📁 proyecto/ (205.3 KB)
//   📝 README.md (2.0 KB)
//   📋 package.json (1.2 KB)
//   📋 tsconfig.json (0.8 KB)
//   📁 src/ (201.2 KB)
//     📘 main.ts (1.5 KB)
//     📘 app.ts (3.7 KB)
//     📁 components/ (13.5 KB)
//       ⚛️  Button.tsx (4.4 KB)
//       ⚛️  Input.tsx (3.1 KB)
//       ⚛️  Modal.tsx (6.0 KB)
//     📁 services/ (16.7 KB)
//       📘 auth.service.ts (8.1 KB)
//       📘 api.service.ts (5.6 KB)
//       📘 storage.service.ts (3.0 KB)
//     📁 assets/ (161.1 KB)
//       🖼️  logo.png (43.9 KB)
//       🖼️  banner.png (117.2 KB)

// getSize() funciona igual sobre File o Folder
console.log("\n=== Tamaños ===");
console.log(`Proyecto completo: ${(root.getSize() / 1024).toFixed(1)} KB`);
console.log(`Solo components:   ${(components.getSize() / 1024).toFixed(1)} KB`);
console.log(`Solo assets:       ${(assets.getSize() / 1024).toFixed(1)} KB`);

// Contar archivos
console.log(`\nTotal de archivos en el proyecto: ${root.countFiles()}`);
console.log(`Archivos en src/components:       ${components.countFiles()}`);

// Buscar en el árbol
const found = root.find("auth.service.ts");
console.log(`\nBuscando auth.service.ts: ${found ? "encontrado ✅" : "no encontrado ❌"}`);
console.log(`Tamaño: ${found?.getSize()} bytes`);
```

---

## 🌿 Ejemplo adicional — Menú de UI

El Composite es ideal para representar jerarquías de UI donde los elementos pueden ser simples (un botón) o compuestos (un grupo de botones, un menú con submenús):

```typescript
// component.interface.ts
interface UIComponent {
    render(depth?: number): void;
    isEnabled(): boolean;
}

// Hoja — elemento simple
class MenuItem implements UIComponent {
    constructor(
        private readonly label: string,
        private readonly action: () => void,
        private readonly enabled: boolean = true,
    ) {}

    render(depth: number = 0): void {
        const indent = "  ".repeat(depth);
        const status = this.enabled ? "" : " [deshabilitado]";
        console.log(`${indent}• ${this.label}${status}`);
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}

// Composite — grupo con hijos
class MenuGroup implements UIComponent {
    private items: UIComponent[] = [];

    constructor(private readonly title: string) {}

    add(item: UIComponent): MenuGroup {
        this.items.push(item);
        return this;
    }

    render(depth: number = 0): void {
        const indent = "  ".repeat(depth);
        console.log(`${indent}▶ ${this.title}`);
        this.items.forEach(item => item.render(depth + 1));
    }

    // Un grupo está habilitado si al menos un hijo lo está
    isEnabled(): boolean {
        return this.items.some(item => item.isEnabled());
    }
}

// ── Construcción del menú ─────────────────────────────────
const menu = new MenuGroup("Archivo");

menu
    .add(new MenuItem("Nuevo",   () => console.log("Nuevo archivo")))
    .add(new MenuItem("Abrir",   () => console.log("Abrir archivo")))
    .add(new MenuItem("Guardar", () => console.log("Guardar")));

const exportMenu = new MenuGroup("Exportar como");
exportMenu
    .add(new MenuItem("PDF",  () => console.log("Exportar PDF")))
    .add(new MenuItem("DOCX", () => console.log("Exportar DOCX")))
    .add(new MenuItem("CSV",  () => console.log("Exportar CSV"), false)); // deshabilitado

menu.add(exportMenu);
menu.add(new MenuItem("Cerrar", () => console.log("Cerrar"), false));

// render() funciona igual sobre MenuItem o MenuGroup
menu.render();
// ▶ Archivo
//   • Nuevo
//   • Abrir
//   • Guardar
//   ▶ Exportar como
//     • PDF
//     • DOCX
//     • CSV [deshabilitado]
//   • Cerrar [deshabilitado]
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Uniformidad total**: el cliente llama exactamente igual a un `File` o a un `Folder` con 10,000 archivos dentro — no hay `if/else` por tipo.
- **Recursión encapsulada**: la complejidad de recorrer el árbol vive dentro de los nodos, no en el cliente.
- **Árbol abierto a extensión**: puedes agregar nuevos tipos de nodos (`SymLink`, `ZipFile`) sin tocar el cliente ni los nodos existentes.
- **Composición infinita**: los Composites pueden anidarse a cualquier profundidad.

### ❌ Desventajas

- **Interfaz demasiado general**: al unificar Leaf y Composite en la misma interfaz, puede ser difícil restringir qué operaciones aplican a cuál (por ejemplo, `add()` no tiene sentido en un `File`).
- **Difícil de restringir**: si necesitas que ciertas hojas no puedan estar en ciertos compuestos, debes agregar validaciones manuales.
- **Rendimiento en árboles grandes**: operaciones como `getSize()` recorren todo el árbol — si el árbol es muy grande y la operación es frecuente, puede necesitar caché.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Composite? |
|---|---|
| Tienes una **jerarquía parte-todo** (árbol) | ✅ Sí |
| El cliente debe tratar **hojas y compuestos** de la misma forma | ✅ Sí |
| Las operaciones deben aplicarse **recursivamente** sobre la jerarquía | ✅ Sí |
| Necesitas representar **estructuras anidadas** de profundidad variable | ✅ Sí |
| Los objetos son siempre simples, sin jerarquía | ❌ No hace falta |
| Necesitas **tipos diferentes de nodos** con interfaces muy distintas | ❌ Complica la interfaz común |

---

## ⚖️ Comparación con otros patrones estructurales

| Patrón | Estructura | Propósito principal |
|---|---|---|
| **Composite** | Árbol (parte-todo) | Tratar nodos simples y compuestos de igual forma |
| **Decorator** | Cadena de envoltura | Agregar comportamiento en capas sin cambiar la interfaz |
| **Facade** | Plano (un nivel) | Simplificar acceso a un subsistema complejo |
| **Flyweight** | Pool compartido | Compartir estado entre muchas instancias para ahorrar memoria |
| **Iterator** | Secuencial | Recorrer una colección sin exponer su estructura interna |

> 💡 **Composite + Iterator**: es muy común usar un Iterator para recorrer un árbol Composite sin exponer su estructura interna. **Composite + Visitor**: otro patrón clásico — el Visitor define operaciones sobre el árbol sin modificar los nodos.

---

*Patrón: Composite — Familia: Estructurales — GoF (Gang of Four)*
