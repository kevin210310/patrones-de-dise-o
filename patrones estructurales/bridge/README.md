# 🌉 Patrón Estructural: Bridge

> Separa una abstracción de su implementación para que ambas puedan evolucionar de forma independiente — sin que cambiar una obligue a cambiar la otra.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Sistema de notificaciones](#-ejemplo--sistema-de-notificaciones)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)
- [Bridge vs Adapter](#-bridge-vs-adapter)

---

## 📋 Descripción

El **patrón Bridge** es un patrón de diseño **estructural** que desacopla una abstracción de su implementación dividiéndolas en dos jerarquías de clases independientes conectadas por un "puente".

La idea central: en lugar de tener una jerarquía de clases que mezcla **qué hace** el objeto con **cómo lo hace**, separas ambas dimensiones. Cada una puede crecer por su lado sin afectar a la otra.

> 💡 Piénsalo como un control remoto (abstracción) y un televisor (implementación). Puedes tener distintos controles (básico, avanzado) con distintos televisores (Samsung, LG) — cualquier combinación funciona porque están conectados por una interfaz común.

---

## 🔥 Problema que resuelve

### La explosión de subclases

Imagina un sistema de notificaciones donde tienes dos dimensiones que varían:
- **Tipo de mensaje**: `AlertNotification`, `ReportNotification`
- **Canal de envío**: Email, SMS, Push

Sin Bridge, necesitas una clase por cada combinación:

```
❌ Sin Bridge — explosión de subclases:

AlertNotificationByEmail
AlertNotificationBySMS
AlertNotificationByPush
ReportNotificationByEmail
ReportNotificationBySMS
ReportNotificationByPush

→ 2 tipos × 3 canales = 6 clases
→ Si agregas WhatsApp: 2 × 4 = 8 clases
→ Si agregas InvoiceNotification: 3 × 4 = 12 clases
→ El número crece de forma MULTIPLICATIVA
```

```typescript
// ❌ Sin Bridge — cada combinación es una clase separada
class AlertNotificationByEmail {
    send(message: string) {
        // lógica de alerta + lógica de email mezcladas
    }
}
class AlertNotificationBySMS {
    send(message: string) {
        // lógica de alerta + lógica de SMS mezcladas
    }
}
// ... y así para cada combinación
```

```typescript
// ✅ Con Bridge — dos jerarquías independientes
// Agregar un nuevo canal → 1 clase nueva
// Agregar un nuevo tipo  → 1 clase nueva
// Sin tocar nada existente
```

---

## 🗺️ Diagrama

```
   ABSTRACCIÓN                          IMPLEMENTACIÓN
   (qué hace)                           (cómo lo hace)

┌──────────────────────────┐       ┌─────────────────────────┐
│     Notification         │       │  <<interface>>          │
│   (Abstracción base)     │       │  NotificationSender     │
│                          │  usa  │                         │
│  # sender: Sender ───────┼──────▶│  + send(                │
│                          │       │      to: string,        │
│  + notify(               │       │      subject: string,   │
│      to: string,         │       │      body: string       │
│      message: string     │       │    ): void              │
│    ): void               │       └─────────────────────────┘
└──────────────────────────┘                  ▲
               ▲                    ┌─────────┼─────────┐
               │                   │         │         │
    ┌──────────┴──────────┐  EmailSender  SMSSender  PushSender
    │                     │
AlertNotification   ReportNotification
(Abstracción         (Abstracción
 refinada A)          refinada B)

Combinaciones posibles sin nuevas clases:
  AlertNotification  + EmailSender  ✅
  AlertNotification  + SMSSender    ✅
  AlertNotification  + PushSender   ✅
  ReportNotification + EmailSender  ✅
  ReportNotification + SMSSender    ✅
  ReportNotification + PushSender   ✅
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Abstraction** | Define la interfaz de alto nivel. Mantiene referencia a la implementación | `Notification` |
| **Refined Abstraction** | Extiende la abstracción con lógica específica | `AlertNotification`, `ReportNotification` |
| **Implementor** | Interfaz de bajo nivel que define las operaciones concretas | `NotificationSender` |
| **Concrete Implementor** | Implementación concreta del canal de envío | `EmailSender`, `SMSSender`, `PushSender` |

---

## 🌍 Ejemplo — Sistema de notificaciones

El escenario: tienes distintos **tipos de notificaciones** (alertas críticas, reportes periódicos) que pueden enviarse por distintos **canales** (Email, SMS, Push). Ambas dimensiones deben poder crecer independientemente.

---

## 💻 Implementación completa

### Implementor — la interfaz de los canales

```typescript
// notification-sender.interface.ts
interface NotificationSender {
    send(to: string, subject: string, body: string): void;
}
```

### Concrete Implementors — los canales concretos

```typescript
// senders/email.sender.ts
class EmailSender implements NotificationSender {
    send(to: string, subject: string, body: string): void {
        console.log(`📧 [EMAIL]`);
        console.log(`   Para:    ${to}`);
        console.log(`   Asunto:  ${subject}`);
        console.log(`   Cuerpo:  ${body}`);
    }
}

// senders/sms.sender.ts
class SMSSender implements NotificationSender {
    send(to: string, subject: string, body: string): void {
        // SMS no tiene asunto — lo omite y trunca el cuerpo
        const shortBody = body.length > 160 ? body.slice(0, 157) + "..." : body;
        console.log(`📱 [SMS]`);
        console.log(`   Para:    ${to}`);
        console.log(`   Mensaje: ${subject}: ${shortBody}`);
    }
}

// senders/push.sender.ts
class PushSender implements NotificationSender {
    send(to: string, subject: string, body: string): void {
        // Push usa userId, no email
        console.log(`🔔 [PUSH]`);
        console.log(`   UserId: ${to}`);
        console.log(`   Título: ${subject}`);
        console.log(`   Body:   ${body.slice(0, 100)}`);
    }
}
```

---

### Abstraction — la base de notificaciones

```typescript
// notification.ts
abstract class Notification {
    // El "puente" — referencia a la implementación inyectada
    constructor(protected sender: NotificationSender) {}

    // Cada subclase define su propia lógica de formato y prioridad
    abstract notify(to: string, message: string): void;
}
```

---

### Refined Abstractions — los tipos de notificación

```typescript
// notifications/alert.notification.ts
class AlertNotification extends Notification {
    constructor(sender: NotificationSender) {
        super(sender);
    }

    notify(to: string, message: string): void {
        // Las alertas tienen formato urgente y prefijo de prioridad
        const subject = "🚨 ALERTA CRÍTICA";
        const body    = `ATENCIÓN INMEDIATA REQUERIDA\n\n${message}\n\nEste es un mensaje automático de alta prioridad.`;

        console.log(`\n--- Enviando alerta crítica ---`);
        this.sender.send(to, subject, body);
    }
}

// notifications/report.notification.ts
class ReportNotification extends Notification {
    constructor(
        sender: NotificationSender,
        private readonly reportTitle: string,
    ) {
        super(sender);
    }

    notify(to: string, message: string): void {
        // Los reportes tienen formato estructurado con título y fecha
        const now     = new Date().toLocaleDateString("es-ES");
        const subject = `📊 Reporte: ${this.reportTitle} — ${now}`;
        const body    = `Estimado usuario,\n\nAdjuntamos el reporte "${this.reportTitle}":\n\n${message}\n\nEste reporte fue generado automáticamente.`;

        console.log(`\n--- Enviando reporte ---`);
        this.sender.send(to, subject, body);
    }
}

// notifications/reminder.notification.ts
class ReminderNotification extends Notification {
    constructor(
        sender: NotificationSender,
        private readonly dueDate: Date,
    ) {
        super(sender);
    }

    notify(to: string, message: string): void {
        const formattedDate = this.dueDate.toLocaleDateString("es-ES");
        const subject       = `⏰ Recordatorio — Vence el ${formattedDate}`;
        const body          = `Tienes una tarea pendiente:\n\n${message}\n\nFecha límite: ${formattedDate}`;

        console.log(`\n--- Enviando recordatorio ---`);
        this.sender.send(to, subject, body);
    }
}
```

---

## 💡 Uso

```typescript
// main.ts

// ── Instanciamos los canales (implementaciones) ──
const emailSender = new EmailSender();
const smsSender   = new SMSSender();
const pushSender  = new PushSender();

// ── Combinación 1: Alerta por Email ──
const alertEmail = new AlertNotification(emailSender);
alertEmail.notify(
    "ops-team@miapp.com",
    "El servidor de base de datos no responde desde hace 5 minutos."
);
// --- Enviando alerta crítica ---
// 📧 [EMAIL]
//    Para:    ops-team@miapp.com
//    Asunto:  🚨 ALERTA CRÍTICA
//    Cuerpo:  ATENCIÓN INMEDIATA REQUERIDA
//             El servidor de base de datos no responde...


// ── Combinación 2: Alerta por SMS ──
const alertSMS = new AlertNotification(smsSender);
alertSMS.notify(
    "+56912345678",
    "El servidor de base de datos no responde desde hace 5 minutos."
);
// --- Enviando alerta crítica ---
// 📱 [SMS]
//    Para:    +56912345678
//    Mensaje: 🚨 ALERTA CRÍTICA: ATENCIÓN INMEDIATA...


// ── Combinación 3: Reporte por Email ──
const reportEmail = new ReportNotification(emailSender, "Ventas Mensuales");
reportEmail.notify(
    "gerencia@miapp.com",
    "Total vendido: $48.200\nNuevos clientes: 134\nTicket promedio: $360"
);
// --- Enviando reporte ---
// 📧 [EMAIL]
//    Para:    gerencia@miapp.com
//    Asunto:  📊 Reporte: Ventas Mensuales — 31/3/2026
//    Cuerpo:  Estimado usuario, ...


// ── Combinación 4: Recordatorio por Push ──
const reminderPush = new ReminderNotification(pushSender, new Date("2026-04-15"));
reminderPush.notify(
    "user_id_9821",
    "Renovar certificado SSL del dominio miapp.com"
);
// --- Enviando recordatorio ---
// 🔔 [PUSH]
//    UserId: user_id_9821
//    Título: ⏰ Recordatorio — Vence el 15/4/2026
//    Body:   Tienes una tarea pendiente: Renovar certificado...


// ── Cambiar canal en runtime ──────────────────────────────
// Puedes pasar el sender como parámetro — el tipo de notificación no cambia
function enviarAlertaCritica(
    sender: NotificationSender,
    destinatario: string,
    mensaje: string
): void {
    const alerta = new AlertNotification(sender);
    alerta.notify(destinatario, mensaje);
}

// La misma función, distintos canales según el contexto
enviarAlertaCritica(emailSender, "admin@miapp.com",  "Disco al 95% de capacidad");
enviarAlertaCritica(smsSender,   "+56987654321",     "Disco al 95% de capacidad");
enviarAlertaCritica(pushSender,  "user_id_0042",     "Disco al 95% de capacidad");
```

---

### Agregar un nuevo canal sin tocar nada

```typescript
// senders/whatsapp.sender.ts — NUEVA clase, nada más
class WhatsAppSender implements NotificationSender {
    send(to: string, subject: string, body: string): void {
        console.log(`💬 [WHATSAPP]`);
        console.log(`   Para:    ${to}`);
        console.log(`   Mensaje: *${subject}*\n${body}`);
    }
}

// Uso inmediato — sin modificar AlertNotification, ReportNotification ni nada
const alertWhatsApp = new AlertNotification(new WhatsAppSender());
alertWhatsApp.notify("+56911112222", "Pago fallido en producción");
```

### Agregar un nuevo tipo sin tocar nada

```typescript
// notifications/welcome.notification.ts — NUEVA clase, nada más
class WelcomeNotification extends Notification {
    notify(to: string, message: string): void {
        const subject = "👋 ¡Bienvenido a MiApp!";
        const body    = `Hola,\n\n${message}\n\nNos alegra tenerte con nosotros.`;

        console.log(`\n--- Enviando bienvenida ---`);
        this.sender.send(to, subject, body);
    }
}

// Funciona con cualquier sender ya existente
const welcomeEmail = new WelcomeNotification(emailSender);
welcomeEmail.notify("nuevo@usuario.com", "Tu cuenta ha sido creada exitosamente.");
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Crecimiento lineal**: agregar un canal o tipo es siempre 1 clase nueva, nunca N clases nuevas.
- **Principio abierto/cerrado**: extiendes sin modificar código existente.
- **Responsabilidad única**: la abstracción sabe qué enviar y cómo formatearlo; el sender sabe cómo entregarlo. Son responsabilidades separadas.
- **Inyección de dependencias**: el sender se inyecta en el constructor — fácil de mockear en tests.
- **Cambio en runtime**: puedes cambiar el canal sin recrear el objeto de notificación.

### ❌ Desventajas

- **Más complejidad inicial**: si solo tienes una o dos combinaciones, el patrón agrega capas innecesarias.
- **Dos jerarquías para mantener**: más clases en total — aunque cada una es más pequeña y enfocada.
- **Puede ser overengineering**: si las dimensiones no van a crecer, un diseño más simple es suficiente.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Bridge? |
|---|---|
| Tienes **dos dimensiones** que varían independientemente | ✅ Sí |
| Quieres evitar la **explosión de subclases** | ✅ Sí |
| Necesitas cambiar la implementación **en runtime** | ✅ Sí |
| Quieres que abstracción e implementación sean **extensibles por separado** | ✅ Sí |
| Solo tienes **una dimensión** de variación | ❌ No, usa herencia simple |
| Las combinaciones son fijas y pocas (2-3 clases máximo) | ❌ Es overengineering |

---

## ⚖️ Bridge vs Adapter

Son los dos patrones estructurales más confundidos entre sí:

| Aspecto | Bridge | Adapter |
|---|---|---|
| **Propósito** | Separar dos dimensiones que crecen independientemente | Hacer compatible una interfaz incompatible |
| **Cuándo se aplica** | Se **diseña desde el inicio** con esta separación en mente | Se aplica **después**, cuando hay incompatibilidad existente |
| **Interfaces** | Ambas interfaces se diseñan juntas y son compatibles | Una interfaz ya existe y la otra no encaja |
| **Problema** | Explosión de subclases por múltiples dimensiones | Incompatibilidad entre código propio y externo |
| **Ejemplo** | Tipos de notificación × canales de envío | Tu `PaymentProcessor` vs la API de Stripe |

> 💡 **Regla simple**: ¿El problema ya existe y necesitas arreglarlo? → **Adapter**. ¿Estás diseñando y prevés que dos dimensiones van a crecer? → **Bridge**.

---

*Patrón: Bridge — Familia: Estructurales — GoF (Gang of Four)*
