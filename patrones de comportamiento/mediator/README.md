# 📡 Patrón de Comportamiento: Mediator

> Define un objeto que encapsula cómo interactúan un conjunto de objetos — reduce las dependencias directas entre ellos haciendo que se comuniquen solo a través del mediador.

---

## 📖 Tabla de Contenidos

- [Descripción](#-descripción)
- [Problema que resuelve](#-problema-que-resuelve)
- [Diagrama](#-diagrama)
- [Componentes](#-componentes)
- [Ejemplo — Sistema de chat con salas](#-ejemplo--sistema-de-chat-con-salas)
- [Implementación completa](#-implementación-completa)
- [Uso](#-uso)
- [Ejemplo adicional — Formulario con campos dependientes](#-ejemplo-adicional--formulario-con-campos-dependientes)
- [Ventajas y desventajas](#-ventajas-y-desventajas)
- [Cuándo usarlo](#-cuándo-usarlo)

---

## 📋 Descripción

El **Mediator** es un patrón de diseño **de comportamiento** que reduce el acoplamiento entre componentes haciendo que se comuniquen indirectamente, a través de un objeto mediador central, en lugar de comunicarse directamente entre sí.

> 💡 Piénsalo como la torre de control de un aeropuerto: los aviones no se comunican directamente entre sí — todos hablan con la torre, y la torre coordina quién aterriza, quién despega y quién espera. Sin la torre, sería caos.

---

## 🔥 Problema que resuelve

Sin Mediator, cada componente conoce y depende de todos los demás — una red de dependencias que crece exponencialmente:

```typescript
// ❌ Sin Mediator — cada usuario conoce a todos los demás
class User {
    send(message: string, to: User[]): void {
        to.forEach(user => user.receive(message, this));
        // User A conoce a B, C, D, E...
        // Si hay 10 usuarios = 10×9 = 90 dependencias
    }
}

// ✅ Con Mediator — cada usuario solo conoce al mediador
class User {
    send(message: string): void {
        this.chatRoom.broadcast(message, this); // solo habla con la sala
    }
}
// 10 usuarios × 1 mediador = 10 dependencias
```

---

## 🗺️ Diagrama

```
  SIN MEDIATOR                    CON MEDIATOR
  (red de dependencias)           (hub central)

  A ←──→ B                           A
  ↕  ╲ ↕  ╲                          │
  C ←──→ D                        ┌──▼──────┐
  ↕     ↕                         │ ChatRoom│  ← Mediator
  E ←──→ F                        └──┬──────┘
  Cada uno conoce                    │ notifica
  a todos los demás                  ▼
  n×(n-1) conexiones          B  C  D  E  F
                               cada uno solo
                               conoce al mediador
```

---

## 🧩 Componentes

| Componente | Rol | En el ejemplo |
|---|---|---|
| **Mediator** | Interfaz del mediador con el método de notificación | `ChatMediator` |
| **Concrete Mediator** | Coordina la comunicación entre componentes | `ChatRoom` |
| **Component** | Conoce al mediador, se comunica solo a través de él | `ChatUser` |

---

## 💻 Implementación completa

### Las interfaces

```typescript
// chat-mediator.interface.ts
interface ChatMediator {
    addUser(user: ChatUser): void;
    sendMessage(message: string, sender: ChatUser): void;
    sendPrivate(message: string, sender: ChatUser, recipientName: string): void;
    getHistory(): { sender: string; message: string; time: Date }[];
}
```

### El Mediator concreto — la sala de chat

```typescript
// chat-room.ts
class ChatRoom implements ChatMediator {
    private users    = new Map<string, ChatUser>();
    private history: { sender: string; message: string; time: Date }[] = [];

    addUser(user: ChatUser): void {
        this.users.set(user.name, user);
        console.log(`  🟢 ${user.name} se unió a la sala`);
        // Notifica a todos sobre la llegada del nuevo usuario
        this.broadcast(`${user.name} se unió al chat`, user, true);
    }

    removeUser(user: ChatUser): void {
        this.users.delete(user.name);
        console.log(`  🔴 ${user.name} salió de la sala`);
        this.broadcast(`${user.name} abandonó el chat`, user, true);
    }

    sendMessage(message: string, sender: ChatUser): void {
        const entry = { sender: sender.name, message, time: new Date() };
        this.history.push(entry);

        console.log(`  💬 [${sender.name}]: ${message}`);

        // Entrega el mensaje a TODOS excepto al emisor
        this.users.forEach((user) => {
            if (user.name !== sender.name) {
                user.receive(message, sender.name);
            }
        });
    }

    sendPrivate(message: string, sender: ChatUser, recipientName: string): void {
        const recipient = this.users.get(recipientName);
        if (!recipient) {
            console.log(`  ⚠️  Usuario ${recipientName} no encontrado`);
            return;
        }
        console.log(`  🔒 [${sender.name} → ${recipientName}]: ${message}`);
        recipient.receive(`(privado) ${message}`, sender.name);
    }

    getHistory() { return [...this.history]; }

    private broadcast(message: string, sender: ChatUser, isSystem: boolean): void {
        if (isSystem) {
            this.users.forEach(user => {
                if (user.name !== sender.name) {
                    user.receiveSystem(message);
                }
            });
        }
    }
}
```

### El Component — el usuario de chat

```typescript
// chat-user.ts
class ChatUser {
    private inbox: { from: string; message: string }[] = [];

    constructor(
        public readonly name: string,
        private mediator: ChatMediator,
    ) {}

    joinRoom(): void {
        this.mediator.addUser(this);
    }

    send(message: string): void {
        this.mediator.sendMessage(message, this);
    }

    sendTo(message: string, recipientName: string): void {
        this.mediator.sendPrivate(message, this, recipientName);
    }

    // Llamado por el Mediator — el usuario recibe sin saber quién se lo envía directamente
    receive(message: string, from: string): void {
        this.inbox.push({ from, message });
    }

    receiveSystem(message: string): void {
        console.log(`  ℹ️  [Sistema → ${this.name}]: ${message}`);
    }

    getInbox() { return [...this.inbox]; }
}
```

---

## 💡 Uso

```typescript
// main.ts
const sala = new ChatRoom();

const ana   = new ChatUser("Ana",   sala);
const luis  = new ChatUser("Luis",  sala);
const sara  = new ChatUser("Sara",  sala);
const pedro = new ChatUser("Pedro", sala);

// Todos se unen — el mediador notifica a los existentes
ana.joinRoom();   // 🟢 Ana se unió
luis.joinRoom();  // 🟢 Luis se unió  → Ana recibe notificación
sara.joinRoom();  // 🟢 Sara se unió  → Ana, Luis reciben notificación
pedro.joinRoom(); // 🟢 Pedro se unió → Ana, Luis, Sara reciben notificación

console.log("\n--- Mensajes grupales ---");
ana.send("¡Hola a todos!");
// 💬 [Ana]: ¡Hola a todos!
// Luis, Sara y Pedro reciben el mensaje — Ana no se lo envía a sí misma

luis.send("¡Hola Ana! ¿Cómo estás?");
// 💬 [Luis]: ¡Hola Ana! ¿Cómo estás?

console.log("\n--- Mensaje privado ---");
sara.sendTo("Luis, ¿nos reunimos mañana?", "Luis");
// 🔒 [Sara → Luis]: Luis, ¿nos reunimos mañana?
// Solo Luis recibe el mensaje privado

console.log("\n--- Inbox de Ana ---");
ana.getInbox().forEach(m => console.log(`  De ${m.from}: ${m.message}`));
// De Luis: ¡Hola Ana! ¿Cómo estás?
// (Ana no recibió el privado de Sara a Luis)
```

---

## 🎛️ Ejemplo adicional — Formulario con campos dependientes

Otro caso clásico: campos de un formulario que se afectan entre sí (País → Estado → Ciudad):

```typescript
interface FormMediator {
    notify(sender: FormComponent, event: string, value: string): void;
}

abstract class FormComponent {
    constructor(
        protected readonly name: string,
        protected mediator: FormMediator,
    ) {}

    abstract setValue(value: string): void;
    abstract getValue(): string;
}

class SelectField extends FormComponent {
    private value = "";
    private options: string[] = [];

    setValue(value: string): void {
        this.value = value;
        console.log(`  📋 ${this.name} = "${value}"`);
        this.mediator.notify(this, "change", value);
    }

    setOptions(options: string[]): void {
        this.options = options;
        console.log(`  🔄 ${this.name} opciones: [${options.join(", ")}]`);
    }

    getValue(): string { return this.value; }
}

// Mediator del formulario
class LocationFormMediator implements FormMediator {
    constructor(
        private country: SelectField,
        private state:   SelectField,
        private city:    SelectField,
    ) {}

    notify(sender: FormComponent, event: string, value: string): void {
        if (sender === this.country && event === "change") {
            // Al cambiar el país, actualiza los estados disponibles
            const states: Record<string, string[]> = {
                CL: ["Metropolitana", "Valparaíso", "Biobío"],
                AR: ["Buenos Aires", "Córdoba", "Mendoza"],
                MX: ["CDMX", "Jalisco", "Nuevo León"],
            };
            this.state.setOptions(states[value] ?? []);
        }

        if (sender === this.state && event === "change") {
            // Al cambiar el estado, actualiza las ciudades
            const cities: Record<string, string[]> = {
                "Metropolitana": ["Santiago", "Puente Alto", "Maipú"],
                "Valparaíso":    ["Valparaíso", "Viña del Mar", "Quilpué"],
            };
            this.city.setOptions(cities[value] ?? []);
        }
    }
}

// Uso
const country = new SelectField("País",   null!);
const state   = new SelectField("Estado", null!);
const city    = new SelectField("Ciudad", null!);
const mediator = new LocationFormMediator(country, state, city);

// Inyectamos el mediador después (circular dependency)
(country as any).mediator = mediator;
(state   as any).mediator = mediator;
(city    as any).mediator = mediator;

country.setValue("CL");
// 📋 País = "CL"
// 🔄 Estado opciones: [Metropolitana, Valparaíso, Biobío]

state.setValue("Metropolitana");
// 📋 Estado = "Metropolitana"
// 🔄 Ciudad opciones: [Santiago, Puente Alto, Maipú]

city.setValue("Santiago");
// 📋 Ciudad = "Santiago"
```

---

## ➕ Ventajas y desventajas

### ✅ Ventajas
- **Reduce el acoplamiento**: los componentes no se conocen entre sí — solo conocen al mediador.
- **Centraliza la lógica de coordinación**: fácil de encontrar y modificar.
- **Reutilización**: los componentes son más reutilizables al no depender de los demás.

### ❌ Desventajas
- **Objeto dios potencial**: el mediador puede crecer descontroladamente si gestiona demasiadas interacciones.
- **Punto único de falla**: si el mediador falla, toda la comunicación se rompe.

---

## ✅ Cuándo usarlo

| Situación | ¿Usar Mediator? |
|---|---|
| Múltiples objetos se comunican directamente creando **acoplamiento fuerte** | ✅ Sí |
| Quieres **centralizar la lógica de coordinación** en un solo lugar | ✅ Sí |
| Tienes un **formulario** con campos que se afectan entre sí | ✅ Sí |
| Implementas un **sistema de mensajería** o sala de chat | ✅ Sí |
| Solo hay **dos componentes** que interactúan | ❌ Innecesario |

---

*Patrón: Mediator — Familia: Comportamiento — GoF (Gang of Four)*
