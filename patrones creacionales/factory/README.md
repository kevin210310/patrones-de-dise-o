# 🏭 Patrón Creacional: Factory Method

## 📋 Descripción

Este proyecto implementa el **patrón de diseño Factory Method** en JavaScript/TypeScript, aplicado al envío de emails.

La fábrica (`EmailServiceFactory`) decide en tiempo de ejecución qué servicio de email instanciar: **AWS SES** en producción o **Nodemailer** en desarrollo. El resto del código nunca toca esa decisión — solo llama a `.send()`.

---

## 🔥 Problema que resuelve

Sin una fábrica, la lógica de "¿qué servicio uso?" se dispersa por todo el código:

```javascript
// ❌ Sin Factory — lógica de entorno mezclada con lógica de negocio
async function enviarEmail(email) {
    if (process.env.NODE_ENV === "production") {
        const ses = new SESService();
        await ses.send(email);
    } else {
        const mailer = new NodemailerService();
        await mailer.send(email);
    }
}
// Si mañana agregas SendGrid, debes buscar y modificar cada if/else en el proyecto
```

```javascript
// ✅ Con Factory — la decisión vive en un solo lugar
const sender = new EmailSender(); // internamente usa la fábrica
await sender.send(email);         // no sabe ni necesita saber qué servicio usa
```

---

## 🏛️ Estructura del proyecto

```
email-system/
├── services/
│   ├── ses.service.js          # Servicio concreto — AWS SES (producción)
│   └── nodemailer.service.js   # Servicio concreto — Nodemailer (desarrollo)
├── email.factory.js            # Factory — decide qué servicio instanciar
├── email.sender.js             # Cliente — usa la fábrica, nunca los servicios directamente
├── email.builder.js            # Builder — construye el objeto Email
└── .env                        # Variables de entorno (NODE_ENV, AWS_REGION, etc.)
```

---

## 🗺️ Diagrama de flujo

```
  CLIENTE (uso)
       │
       │  new EmailSender()
       ▼
┌─────────────────────┐
│    EmailSender      │  ← nunca importa SES ni Nodemailer directamente
│  - service          │
│  + send(email)      │
└────────┬────────────┘
         │  EmailServiceFactory.create()
         ▼
┌─────────────────────────────────────────────────────┐
│               EmailServiceFactory                   │
│                                                     │
│  NODE_ENV === "production"?                         │
│         │ Sí                    │ No               │
│         ▼                       ▼                   │
│   new SESService()    new NodemailerService()       │
└─────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐
│   SESService    │    │  NodemailerService   │
│  AWS SDK + SES  │    │  SMTP local/remoto   │
│  + send(email)  │    │  + send(email)       │
└─────────────────┘    └──────────────────────┘
```

---

## 🧩 Componentes

### `SESService` — Servicio concreto (producción)

Envía emails usando **AWS Simple Email Service**. Se inicializa con la región definida en `AWS_REGION`.

| Dependencia       | Uso                          |
|-------------------|------------------------------|
| `@aws-sdk/client-ses` | Cliente oficial de AWS SES |
| `AWS_REGION`      | Variable de entorno requerida |

### `NodemailerService` — Servicio concreto (desarrollo)

Envía emails a través de un transporte **SMTP**, por defecto apuntando a `localhost:1025` (compatible con [Mailpit](https://mailpit.axllent.org/) o Mailtrap).

| Dependencia    | Uso                       |
|----------------|---------------------------|
| `nodemailer`   | Transporte SMTP           |
| `MAIL_HOST`    | Host SMTP (default: `localhost`) |
| `MAIL_PORT`    | Puerto SMTP (default: `1025`)    |

### `EmailServiceFactory` — La Fábrica

Contiene **toda** la lógica de decisión. Es el único archivo que conoce ambos servicios.

```javascript
static create() {
    if (process.env.NODE_ENV === "production") {
        return new SESService();
    }
    return new NodemailerService();
}
```

> 💡 **Clave del patrón**: si mañana agregas SendGrid o Resend, solo modificas este archivo.

### `EmailSender` — El Cliente

Orquesta el envío. No importa ningún servicio directamente — delega en la fábrica.

---

## 💻 Implementación

### `services/ses.service.js`

```javascript
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

class SESService {
    constructor() {
        this.client = new SESClient({
            region: process.env.AWS_REGION,
        });
    }

    async send(email) {
        const command = new SendEmailCommand({
            Destination: {
                ToAddresses: [email.to],
                CcAddresses: email.cc,
            },
            Message: {
                Subject: { Data: email.subject },
                Body: {
                    Html: { Data: email.html },
                    Text: { Data: email.text },
                },
            },
            Source: email.from,
        });

        return this.client.send(command);
    }
}

module.exports = SESService;
```

---

### `services/nodemailer.service.js`

```javascript
const nodemailer = require("nodemailer");

class NodemailerService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST ?? "localhost",
            port: process.env.MAIL_PORT ?? 1025,
        });
    }

    async send(email) {
        return this.transporter.sendMail({
            from:        email.from,
            to:          email.to,
            cc:          email.cc,
            subject:     email.subject,
            html:        email.html,
            text:        email.text,
            attachments: email.attachments,
        });
    }
}

module.exports = NodemailerService;
```

---

### `email.factory.js`

```javascript
const SESService        = require("./services/ses.service");
const NodemailerService = require("./services/nodemailer.service");

class EmailServiceFactory {
    static create() {
        if (process.env.NODE_ENV === "production") {
            return new SESService();
        }
        return new NodemailerService();
    }
}

module.exports = EmailServiceFactory;
```

---

### `email.sender.js`

```javascript
const EmailServiceFactory = require("./email.factory");

class EmailSender {
    constructor() {
        this.service = EmailServiceFactory.create();
    }

    async send(email) {
        try {
            await this.service.send(email);
            console.log(`Email enviado a ${email.to}`);
        } catch (error) {
            console.error("Error enviando email:", error);
            throw error;
        }
    }
}

module.exports = EmailSender;
```

---

## 💡 Uso

```javascript
const EmailBuilder = require("./email.builder");
const EmailSender  = require("./email.sender");

const sender = new EmailSender();

// Correo de bienvenida
const email = new EmailBuilder()
    .to("juan@example.com")
    .subject("Bienvenido a MiApp 🎉")
    .html("<h1>Hola Juan, gracias por registrarte</h1>")
    .text("Hola Juan, gracias por registrarte")
    .build();

await sender.send(email);

// Correo con adjunto y CC
const invoice = new EmailBuilder()
    .to("cliente@empresa.com")
    .cc("admin@miapp.com")
    .subject("Tu factura #1234")
    .html("<p>Adjuntamos tu factura del mes</p>")
    .attach({ filename: "factura.pdf", path: "./facturas/1234.pdf" })
    .build();

await sender.send(invoice);
```

> El cliente **nunca menciona** `SESService` ni `NodemailerService`. La fábrica se encarga de todo en silencio.

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Entorno — controla qué servicio usa la fábrica
NODE_ENV=development        # "production" activa SES, cualquier otro usa Nodemailer

# AWS SES (solo requerido en producción)
AWS_REGION=us-east-1

# Nodemailer SMTP (solo requerido en desarrollo)
MAIL_HOST=localhost
MAIL_PORT=1025
```

| Variable     | Requerida en        | Default       | Descripción                          |
|--------------|---------------------|---------------|--------------------------------------|
| `NODE_ENV`   | Siempre             | —             | Controla qué servicio instancia la fábrica |
| `AWS_REGION` | Producción          | —             | Región de AWS para SES               |
| `MAIL_HOST`  | Desarrollo          | `localhost`   | Host del servidor SMTP               |
| `MAIL_PORT`  | Desarrollo          | `1025`        | Puerto del servidor SMTP             |

---

## ➕ Ventajas y desventajas

### ✅ Ventajas

- **Punto único de decisión**: toda la lógica de "qué servicio usar" vive en `email.factory.js`.
- **Abierto/Cerrado**: agregar un nuevo proveedor (SendGrid, Resend) solo requiere crear un nuevo service y una línea en la fábrica — sin tocar `EmailSender` ni el código cliente.
- **Testeable**: en tests puedes inyectar un mock en lugar de pasar por la fábrica.
- **Desacoplamiento total**: `EmailSender` no importa ni conoce los servicios concretos.

### ❌ Desventajas

- **Rigidez por entorno**: la fábrica usa `NODE_ENV` como único criterio — si necesitas más granularidad (staging, QA, etc.) deberás extender la lógica.
- **Acoplamiento en la fábrica**: la fábrica sí conoce todos los servicios concretos — es el precio del patrón.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Factory? |
|---|---|
| Múltiples implementaciones de una misma interfaz | ✅ Sí |
| La implementación correcta depende del **entorno o configuración** | ✅ Sí |
| Quieres que el cliente esté **completamente desacoplado** del servicio concreto | ✅ Sí |
| Solo hay una implementación posible y nunca cambiará | ❌ No |
| El objeto a crear es simple y siempre el mismo | ❌ No |

---

## 🔗 Combinación con Builder

Este proyecto usa **ambos patrones juntos**, y se complementan perfectamente:

| Patrón      | Responsabilidad                                      |
|-------------|------------------------------------------------------|
| **Builder** | Construir el objeto `Email` paso a paso y validarlo  |
| **Factory** | Decidir qué servicio de envío instanciar             |

```
EmailBuilder  →  Email (objeto validado)
                      │
                      ▼
              EmailSender.send(email)
                      │
                      ▼
          EmailServiceFactory.create()
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
       SESService        NodemailerService
```

> Cada patrón resuelve su propio problema — Builder maneja la **construcción de datos**, Factory maneja la **selección de comportamiento**.

---

*Patrón: Factory Method — Familia: Creacionales — GoF (Gang of Four)*