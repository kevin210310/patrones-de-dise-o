# 🏗️ Patrón Creacional: Builder

## 📋 Descripción

Este proyecto implementa el **patrón de diseño Builder** en TypeScript usando como ejemplo práctico la construcción de un objeto `Email`.

El patrón Builder permite construir objetos complejos **paso a paso**, encadenando métodos de forma fluida (*fluent interface*), y centralizar las **validaciones** justo antes de obtener el objeto final con `.build()`.

---

## 🔥 Problema que resuelve

Sin el patrón Builder, construir un email con campos opcionales obliga a mutar el objeto manualmente sin ninguna garantía:

```typescript
// ❌ Sin Builder — confuso, propenso a errores
const email = new Email();
email.to = "kevin@mail.com";
email.subject = "Hola";
email.text = "Mensaje";
email.cc.push("otro@mail.com");
// ¿Dónde se valida que `to` y `subject` existan? ¿Quién lo garantiza?
```

```typescript
// ✅ Con Builder — legible, validado y encadenado
const email = new EmailBuilder()
    .to("kevin@mail.com")
    .subject("Hola")
    .text("Mensaje")
    .cc("otro@mail.com")
    .build(); // ← validación centralizada aquí
```

---

## 🏛️ Estructura del proyecto

```
builder-email/
├── Email.ts          # Producto — modelo de datos del email
├── EmailBuilder.ts   # Builder concreto — construcción paso a paso
└── main.ts           # Cliente — uso del builder
```

---

## 🧩 Componentes

### `Email` — El Producto

Representa el objeto final que se construye. Sus propiedades son mayormente opcionales durante la construcción, y algunas tienen valores por defecto.

| Propiedad     | Tipo       | Default                | Requerido   |
|---------------|------------|------------------------|-------------|
| `to`          | `string`   | `null`                 | ✅          |
| `subject`     | `string`   | `null`                 | ✅          |
| `html`        | `string`   | `null`                 | ✅ o `text` |
| `text`        | `string`   | `null`                 | ✅ o `html` |
| `from`        | `string`   | `"no-reply@miapp.com"` | ⬜          |
| `attachments` | `string[]` | `[]`                   | ⬜          |
| `cc`          | `string[]` | `[]`                   | ⬜          |

### `EmailBuilder` — El Builder

Expone un método por cada propiedad del `Email`. Cada método retorna `this`, habilitando el **encadenamiento fluido**. El método `.build()` valida las reglas de negocio y retorna el objeto final.

---

## 💻 Implementación

```typescript
// ── Producto ──────────────────────────────────────────────
class Email {
    public to: string | null = null;
    public subject: string | null = null;
    public html: string | null = null;
    public text: string | null = null;
    public from: string = "no-reply@miapp.com";
    public attachments: string[] = [];
    public cc: string[] = [];
}

// ── Builder ───────────────────────────────────────────────
class EmailBuilder {
    private email: Email;

    constructor() {
        this.email = new Email();
    }

    to(address: string): EmailBuilder {
        this.email.to = address;
        return this;
    }

    from(address: string): EmailBuilder {
        this.email.from = address;
        return this;
    }

    subject(subject: string): EmailBuilder {
        this.email.subject = subject;
        return this;
    }

    html(html: string): EmailBuilder {
        this.email.html = html;
        return this;
    }

    text(text: string): EmailBuilder {
        this.email.text = text;
        return this;
    }

    cc(address: string): EmailBuilder {
        this.email.cc.push(address);
        return this;
    }

    attach(file: string): EmailBuilder {
        this.email.attachments.push(file);
        return this;
    }

    build(): Email {
        if (!this.email.to)                       throw new Error("El destinatario es requerido");
        if (!this.email.subject)                  throw new Error("El asunto es requerido");
        if (!this.email.html && !this.email.text) throw new Error("El cuerpo es requerido");

        return this.email;
    }
}
```

---

## 💡 Uso

### Email de texto plano

```typescript
const email = new EmailBuilder()
    .to("kevin@mail.com")
    .subject("Bienvenido")
    .text("Hola mundo")
    .build();
```

**Resultado:**
```json
{
  "to": "kevin@mail.com",
  "subject": "Bienvenido",
  "text": "Hola mundo",
  "html": null,
  "from": "no-reply@miapp.com",
  "attachments": [],
  "cc": []
}
```

---

### Email HTML

```typescript
const email2 = new EmailBuilder()
    .to("kevin2@mail.com")
    .subject("Notificación")
    .html("<p>hola mundo</p>")
    .build();
```

**Resultado:**
```json
{
  "to": "kevin2@mail.com",
  "subject": "Notificación",
  "html": "<p>hola mundo</p>",
  "text": null,
  "from": "no-reply@miapp.com",
  "attachments": [],
  "cc": []
}
```

---

### Email completo con adjuntos y CC

```typescript
const emailCompleto = new EmailBuilder()
    .to("cliente@empresa.com")
    .from("ventas@miapp.com")
    .subject("Tu factura del mes")
    .html("<h1>Factura adjunta</h1>")
    .text("Factura adjunta")           // fallback para clientes sin HTML
    .cc("contabilidad@miapp.com")
    .cc("soporte@miapp.com")
    .attach("factura-octubre.pdf")
    .attach("detalle.xlsx")
    .build();
```

---

## 🛡️ Validaciones en `build()`

El método `build()` actúa como **guardián** del objeto: centraliza todas las reglas de negocio antes de entregar el producto.

```typescript
build(): Email {
    // Regla 1: destinatario obligatorio
    if (!this.email.to)
        throw new Error("El destinatario es requerido");

    // Regla 2: asunto obligatorio
    if (!this.email.subject)
        throw new Error("El asunto es requerido");

    // Regla 3: debe tener al menos un tipo de cuerpo
    if (!this.email.html && !this.email.text)
        throw new Error("El cuerpo es requerido");

    return this.email;
}
```

> 💡 **Buena práctica**: en `build()` también podrías agregar validaciones de formato (email válido, subject no vacío, tamaño de adjuntos, etc.) sin afectar al resto del código.

**Ejemplo de error en tiempo de ejecución:**
```typescript
new EmailBuilder()
    .subject("Sin destinatario")
    .text("Esto fallará")
    .build();

// ❌ Error: El destinatario es requerido
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Interfaz fluida**: el encadenamiento hace el código muy legible.
- **Validación centralizada**: todas las reglas viven en `.build()`, no dispersas por el código.
- **Valores por defecto claros**: `from` y los arrays se inicializan en el Producto.
- **Campos acumulables**: `cc()` y `attach()` se pueden llamar múltiples veces sin sobreescribir.
- **Fácil de extender**: agregar un nuevo campo solo requiere un método más en el Builder.

### ❌ Desventajas

- **Mutabilidad interna**: el `Email` retornado por `build()` sigue siendo mutable. Considera `Object.freeze()` si necesitas inmutabilidad.
- **Una instancia por objeto**: cada `new EmailBuilder()` crea un builder separado — no reutilices la misma instancia para construir dos emails distintos.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Builder? |
|---|---|
| Objeto con **campos opcionales** y **valores por defecto** | ✅ Sí |
| **Validaciones de negocio** antes de crear el objeto | ✅ Sí |
| Campos que se acumulan (arrays como `cc`, `attachments`) | ✅ Sí |
| Quieres código **legible y encadenable** | ✅ Sí |
| El objeto tiene solo 1–2 campos sin opcionales | ❌ No |

---

*Patrón: Builder — Familia: Creacionales — GoF (Gang of Four)*