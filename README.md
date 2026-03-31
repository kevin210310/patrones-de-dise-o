# 🗺️ Guía de Patrones de Diseño GoF — Cuándo usar cada uno

> Referencia rápida de los 23 patrones del Gang of Four organizados por familia, con criterios claros para elegir el patrón correcto según el problema que enfrentas.

---

## 📖 Tabla de Contenidos

- [Los tres grupos de patrones](#-los-tres-grupos-de-patrones)
- [Patrones Creacionales — ¿Cómo crear objetos?](#-patrones-creacionales--cómo-crear-objetos)
- [Patrones Estructurales — ¿Cómo componer clases?](#-patrones-estructurales--cómo-componer-clases)
- [Patrones de Comportamiento — ¿Cómo colaboran los objetos?](#-patrones-de-comportamiento--cómo-colaboran-los-objetos)
- [Árbol de decisión](#-árbol-de-decisión)
- [Tabla maestra de referencia rápida](#-tabla-maestra-de-referencia-rápida)
- [Combinaciones frecuentes](#-combinaciones-frecuentes)
- [Señales de que necesitas un patrón](#-señales-de-que-necesitas-un-patrón)
- [Señales de que estás sobrediseñando](#-señales-de-que-estás-sobrediseñando)

---

## 🧭 Los tres grupos de patrones

```
┌─────────────────────────────────────────────────────────────────┐
│                    23 PATRONES GOF                              │
├──────────────────┬──────────────────┬───────────────────────────┤
│   CREACIONALES   │   ESTRUCTURALES  │      COMPORTAMIENTO       │
│   (5 patrones)   │   (7 patrones)   │      (11 patrones)        │
│                  │                  │                           │
│  ¿CÓMO CREO     │  ¿CÓMO COMPONGO  │  ¿CÓMO COLABORAN Y       │
│  los objetos?   │  las clases?     │  SE COMUNICAN?            │
│                  │                  │                           │
│  • Singleton    │  • Adapter       │  • Chain of Resp.         │
│  • Factory Meth.│  • Bridge        │  • Command                │
│  • Abstract Fac.│  • Composite     │  • Iterator               │
│  • Builder      │  • Decorator     │  • Mediator               │
│  • Prototype    │  • Facade        │  • Memento                │
│                  │  • Flyweight     │  • Observer               │
│                  │  • Proxy        │  • State                  │
│                  │                  │  • Strategy               │
│                  │                  │  • Template Method        │
│                  │                  │  • Visitor                │
│                  │                  │  • Interpreter*           │
└──────────────────┴──────────────────┴───────────────────────────┘
* Interpreter es el menos usado en la práctica — no se documenta aquí
```

---

## 🏭 Patrones Creacionales — ¿Cómo crear objetos?

Resuelven el problema de **instanciar objetos** de forma flexible, desacoplada y controlada.

---

### 👤 Singleton
**Una sola instancia global controlada.**

```
Úsalo cuando:
  ✅ Necesitas exactamente UNA instancia compartida (conexión a BD, config, logger)
  ✅ El recurso es costoso de crear y debe reutilizarse
  ✅ Necesitas un punto de acceso global controlado

No lo uses cuando:
  ❌ Necesitas testearlo fácilmente sin un método resetInstance()
  ❌ El estado varía por usuario, request o contexto
  ❌ Tu framework ya gestiona el ciclo de vida (NestJS, Spring, etc.)

Señal de que lo necesitas:
  "Estoy haciendo new DatabaseConnection() en cada módulo y
   abriéndose múltiples conexiones"
```

---

### 🏗️ Factory Method
**Delega la creación a una subclase o método.**

```
Úsalo cuando:
  ✅ No sabes de antemano qué clase concreta crear
  ✅ La clase a crear depende del entorno o configuración
  ✅ Quieres que las subclases decidan qué instanciar

No lo uses cuando:
  ❌ Solo hay una implementación posible y nunca cambiará
  ❌ El objeto es simple y siempre el mismo

Señal de que lo necesitas:
  "Según NODE_ENV creo SESService o NodemailerService —
   este if/else está en 5 lugares distintos"
```

---

### 🏭🏭 Abstract Factory
**Crea familias de objetos relacionados y coherentes.**

```
Úsalo cuando:
  ✅ Tienes familias de objetos que SIEMPRE deben usarse juntos
  ✅ Quieres garantizar coherencia entre productos de la misma familia
  ✅ El sistema debe ser independiente de cómo se crean sus productos

No lo uses cuando:
  ❌ Solo tienes un tipo de producto (usa Factory Method)
  ❌ Las familias cambian muy frecuentemente

Señal de que lo necesitas:
  "Tengo FastFoodRestaurant que crea BeefHamburger + Soda, y
   HealthyRestaurant que crea ChickenBurger + Water — nada debe
   mezclarse entre familias"
```

---

### 🏗️ Builder
**Construye objetos complejos paso a paso.**

```
Úsalo cuando:
  ✅ El objeto tiene muchos parámetros opcionales (más de 4)
  ✅ Necesitas validaciones centralizadas antes de crear el objeto
  ✅ Algunos campos se acumulan (arrays como cc[], attachments[])
  ✅ Quieres una interfaz fluida encadenable

No lo uses cuando:
  ❌ El objeto es simple con 1-2 campos obligatorios
  ❌ Todos los parámetros son obligatorios (usa constructor normal)

Señal de que lo necesitas:
  "Mi constructor tiene 8 parámetros y la mitad son null —
   no sé qué representa cada posición"
```

---

### 🧬 Prototype
**Clona objetos existentes sin conocer su clase concreta.**

```
Úsalo cuando:
  ✅ Necesitas variaciones de un objeto ya construido y configurado
  ✅ La inicialización del objeto es costosa (BD, red, config compleja)
  ✅ Quieres objetos similares con pequeñas diferencias

No lo uses cuando:
  ❌ Los objetos son completamente distintos entre sí
  ❌ El objeto tiene referencias circulares complejas (deep copy difícil)

Señal de que lo necesitas:
  "Tengo una plantilla de documento configurada con 50 parámetros
   y quiero variantes que solo cambien el título"
```

---

## 🏛️ Patrones Estructurales — ¿Cómo componer clases?

Resuelven el problema de **organizar y combinar** clases y objetos en estructuras mayores.

---

### 🔌 Adapter
**Traduce una interfaz incompatible a otra que el cliente espera.**

```
Úsalo cuando:
  ✅ Integras una librería de terceros con tu sistema
  ✅ Tienes múltiples proveedores con APIs distintas (pagos, email, storage)
  ✅ Quieres aislar tu código de SDKs externos para poder cambiarlos

No lo uses cuando:
  ❌ La interfaz de la librería ya es compatible con la tuya
  ❌ Solo tienes un proveedor y nunca cambiará (es overengineering)

Señal de que lo necesitas:
  "Stripe usa amount en centavos y MercadoPago en pesos directos —
   mi código cliente no debería saber esa diferencia"
```

---

### 🌉 Bridge
**Separa abstracción de implementación para que crezcan independientemente.**

```
Úsalo cuando:
  ✅ Tienes DOS dimensiones que varían independientemente
  ✅ Quieres evitar la explosión de subclases (N×M combinaciones)
  ✅ Necesitas cambiar la implementación en runtime

No lo uses cuando:
  ❌ Solo hay una dimensión de variación (usa herencia simple)
  ❌ Las combinaciones son fijas y pocas (2-3 clases máximo)

Señal de que lo necesitas:
  "Tengo AlertEmail, AlertSMS, AlertPush, ReportEmail, ReportSMS,
   ReportPush... y si agrego WhatsApp serán 6 clases nuevas"

Diferencia clave con Adapter:
  Bridge se DISEÑA desde el inicio para separar dimensiones.
  Adapter se APLICA después cuando hay incompatibilidad existente.
```

---

### 🌳 Composite
**Trata objetos individuales y composiciones de la misma forma.**

```
Úsalo cuando:
  ✅ Tienes una jerarquía parte-todo (árbol)
  ✅ El cliente debe tratar hojas y compuestos de la misma forma
  ✅ Las operaciones deben aplicarse recursivamente en la jerarquía

No lo uses cuando:
  ❌ Los objetos son siempre simples, sin jerarquía
  ❌ Necesitas tipos muy diferentes de nodos con interfaces distintas

Señal de que lo necesitas:
  "Tengo archivos y carpetas. Una carpeta puede contener archivos
   y otras carpetas. getSize() debe funcionar igual en ambos"
```

---

### 🎨 Decorator
**Agrega comportamiento a un objeto dinámicamente sin modificar su clase.**

```
Úsalo cuando:
  ✅ Necesitas agregar comportamiento OPCIONAL en capas (auth, log, cache)
  ✅ El comportamiento puede componerse en runtime
  ✅ Quieres evitar subclases por cada combinación posible

No lo uses cuando:
  ❌ Solo necesitas comportamiento fijo (usa herencia)
  ❌ La interfaz del objeto va a cambiar frecuentemente

Señal de que lo necesitas:
  "Quiero que mi handler tenga auth Y cache Y logging, pero en
   algunos endpoints solo auth, en otros solo logging..."

Diferencia clave con Proxy:
  Decorator AGREGA funcionalidad.
  Proxy CONTROLA el acceso.
  Ambos usan la misma interfaz — la diferencia es de intención.
```

---

### 🏛️ Facade
**Provee una interfaz simplificada a un subsistema complejo.**

```
Úsalo cuando:
  ✅ Tienes múltiples subsistemas que siempre se usan juntos
  ✅ Quieres aislar al cliente de los detalles internos
  ✅ Necesitas centralizar la orquestación y el manejo de errores/rollback

No lo uses cuando:
  ❌ El cliente necesita control fino sobre cada subsistema
  ❌ El subsistema es simple con pocas clases

Señal de que lo necesitas:
  "Para procesar un pedido necesito llamar a Inventory, Payment,
   Order, Shipping, Email y Loyalty en el orden correcto —
   y si falla, hacer rollback de todo"
```

---

### 🪶 Flyweight
**Comparte el estado común entre miles de objetos para ahorrar memoria.**

```
Úsalo cuando:
  ✅ La app crea una cantidad ENORME de objetos similares (miles o millones)
  ✅ El consumo de memoria es un problema real y medible
  ✅ Los objetos comparten gran parte de su estado (intrínseco)

No lo uses cuando:
  ❌ Tienes pocos objetos (decenas o cientos)
  ❌ Cada objeto es completamente único (nada que compartir)
  ❌ El estado no puede separarse claramente en intrínseco/extrínseco

Señal de que lo necesitas:
  "Tengo 50,000 partículas de fuego y cada una guarda una
   textura de 500KB — son 25GB solo en texturas"

Concepto clave:
  Estado INTRÍNSECO = compartido, inmutable (textura, color, forma)
  Estado EXTRÍNSECO = único por instancia (posición X/Y, velocidad)
```

---

### 🪞 Proxy
**Controla el acceso a un objeto con la misma interfaz.**

```
Úsalo cuando:
  ✅ Necesitas caché de operaciones costosas (BD, red, disco)
  ✅ Quieres control de acceso sin modificar el servicio real
  ✅ La inicialización del objeto es costosa y puede diferirse (lazy)
  ✅ Necesitas auditoría o logging de todas las llamadas

Tipos principales:
  • Virtual Proxy  → lazy loading (crea el objeto real solo cuando se necesita)
  • Protection     → control de acceso por permisos
  • Cache Proxy    → almacena resultados para evitar llamadas repetidas
  • Remote Proxy   → representa un objeto en otro servidor

No lo uses cuando:
  ❌ El objeto es simple y no tiene lógica transversal
  ❌ La interfaz va a cambiar frecuentemente

Señal de que lo necesitas:
  "Estoy repitiendo la misma lógica de caché en cada servicio
   que llama a la base de datos"
```

---

## 🎭 Patrones de Comportamiento — ¿Cómo colaboran los objetos?

Resuelven el problema de **comunicación y distribución de responsabilidades** entre objetos.

---

### ⛓️ Chain of Responsibility
**Pasa una solicitud a lo largo de una cadena hasta que alguien la procese.**

```
Úsalo cuando:
  ✅ Tienes múltiples validaciones o pasos secuenciales independientes
  ✅ Quieres que cada paso sea independiente y testeable por separado
  ✅ La cadena puede variar según el contexto (pedido normal vs express)
  ✅ Necesitas poder insertar o quitar pasos sin modificar los demás

No lo uses cuando:
  ❌ Solo hay un paso de procesamiento
  ❌ El orden de los pasos nunca cambia y son pocos (un método es suficiente)

Señal de que lo necesitas:
  "Para validar un pedido necesito: auth → stock → crédito →
   dirección → fraude. Cada validación debería poder quitarse
   o reordenarse según el tipo de pedido"
```

---

### 📟 Command
**Encapsula una acción como un objeto con toda su información.**

```
Úsalo cuando:
  ✅ Necesitas undo/redo en tu aplicación
  ✅ Quieres encolar operaciones para ejecución diferida o en lote
  ✅ Necesitas un log de auditoría de todas las acciones
  ✅ Quieres parametrizar botones/menús con acciones configurables
  ✅ Necesitas macros (grupos de operaciones como una sola)

No lo uses cuando:
  ❌ La operación es simple, única y nunca necesita deshacerse

Señal de que lo necesitas:
  "Tengo un editor de texto y necesito Ctrl+Z / Ctrl+Y.
   Cada acción (insertar, eliminar, formatear) debe poder
   revertirse independientemente"

Diferencia clave con Strategy:
  Command encapsula UNA acción concreta (con su historia).
  Strategy encapsula UN algoritmo intercambiable (sin historia).
```

---

### 🔁 Iterator
**Recorre una colección sin exponer su representación interna.**

```
Úsalo cuando:
  ✅ Tienes una colección personalizada (árbol, grafo, lista enlazada)
  ✅ Necesitas múltiples formas de recorrer la misma colección
  ✅ Quieres una interfaz uniforme para distintos tipos de colección
  ✅ Necesitas iteradores filtrados sin copiar la colección

No lo uses cuando:
  ❌ Solo tienes arrays o Maps estándar (usa for...of nativo)

Señal de que lo necesitas:
  "Tengo un árbol de categorías y necesito recorrerlo en orden,
   en reverso y filtrado por nivel — con la misma interfaz"

Nota TypeScript:
  Implementa Symbol.iterator para usar for...of nativo.
  Los generadores (function*) son la forma más concisa.
```

---

### 📡 Mediator
**Centraliza la comunicación entre objetos para reducir el acoplamiento.**

```
Úsalo cuando:
  ✅ Múltiples objetos se comunican directamente creando acoplamiento fuerte
  ✅ Quieres centralizar la lógica de coordinación
  ✅ Tienes un formulario con campos que se afectan entre sí
  ✅ Implementas un sistema de mensajería o sala de chat

No lo uses cuando:
  ❌ Solo hay dos componentes que interactúan (llámense directamente)
  ❌ El mediador crece tanto que se convierte en un objeto dios

Señal de que lo necesitas:
  "Tengo 10 componentes de UI que se notifican entre sí —
   cuando cambia A, actualiza B y C; cuando cambia B, actualiza D...
   son 40 dependencias entre componentes"

Diferencia clave con Observer:
  Mediator: los componentes hablan CON el mediador (bidireccional).
  Observer: el Subject notifica A sus observers (unidireccional).
```

---

### 📸 Memento
**Captura y restaura el estado de un objeto sin violar su encapsulamiento.**

```
Úsalo cuando:
  ✅ Necesitas undo/redo y el estado es complejo o sin inversa obvia
  ✅ Quieres guardar puntos de restauración (checkpoints en un juego)
  ✅ El estado del objeto no debe exponerse al exterior

No lo uses cuando:
  ❌ El objeto tiene poco estado o las operaciones tienen inversas claras
     (usa Command en su lugar — consume menos memoria)
  ❌ El estado es enorme y se guarda muy frecuentemente (problema de RAM)

Señal de que lo necesitas:
  "El estado de mi juego tiene 200 variables — no puedo calcular
   la 'inversa' de una acción, necesito guardar todo el estado
   en un checkpoint"

Diferencia clave con Command:
  Command guarda SOLO lo necesario para revertir esa operación.
  Memento guarda TODO el estado del objeto (snapshot completo).
  Command: bajo consumo de memoria, requiere implementar la inversa.
  Memento: alto consumo de memoria, undo trivial (cargar snapshot).
```

---

### 👁️ Observer
**Notifica automáticamente a múltiples objetos cuando uno cambia.**

```
Úsalo cuando:
  ✅ Cambios en un objeto deben propagarse a otros sin conocerlos
  ✅ Necesitas suscripción dinámica en runtime
  ✅ Implementas un sistema de eventos o mensajería
  ✅ Construyes UI reactiva (actualizar vistas cuando cambia el modelo)

No lo uses cuando:
  ❌ Solo hay un consumidor y nunca cambiará (llámalo directamente)
  ❌ El orden de notificación importa y debe ser garantizado

Señal de que lo necesitas:
  "Cuando cambia el precio de una acción, debo actualizar el
   dashboard, enviar un email, registrar en el log Y notificar
   por SMS — sin que StockMarket sepa quién recibe qué"

Cuidado:
  Siempre desuscribir los observers al destruir el componente
  para evitar memory leaks.
```

---

### 🚦 State
**El objeto cambia su comportamiento cuando cambia su estado interno.**

```
Úsalo cuando:
  ✅ Un objeto cambia su comportamiento según su estado interno
  ✅ Tienes if/else o switch que crecen con cada estado nuevo
  ✅ Los estados y transiciones son numerosos o complejos
  ✅ Implementas una máquina de estados finita

No lo uses cuando:
  ❌ Solo tienes 2 estados simples que nunca crecerán
     (un booleano es suficiente)

Señal de que lo necesitas:
  "Mi VendingMachine tiene métodos con switch(state) de 5 casos
   cada uno — si agrego un estado nuevo modifico 6 métodos"

Diferencia clave con Strategy:
  State:    el PROPIO OBJETO decide cuándo transicionar de estado.
  Strategy: el CLIENTE decide qué estrategia usar.
  State: los estados se conocen entre sí (para transicionar).
  Strategy: las estrategias son independientes entre sí.
```

---

### 🎯 Strategy
**Encapsula algoritmos intercambiables y los hace seleccionables en runtime.**

```
Úsalo cuando:
  ✅ Tienes múltiples variantes de un algoritmo
  ✅ Necesitas cambiar el algoritmo en runtime
  ✅ Quieres aislar la lógica de cada variante para testearlo
  ✅ Tienes un switch que selecciona entre implementaciones distintas

No lo uses cuando:
  ❌ Solo hay una variante y nunca cambiará
  ❌ Las variantes son trivialmente diferentes (una línea de código)

Señal de que lo necesitas:
  "Proceso pagos con tarjeta, PayPal, crypto y transferencia —
   cada uno tiene validación, límites y lógica completamente
   distinta pero la interfaz del resultado es la misma"
```

---

### 📐 Template Method
**Define el esqueleto de un algoritmo, dejando los detalles a las subclases.**

```
Úsalo cuando:
  ✅ Múltiples clases comparten la misma ESTRUCTURA de algoritmo
  ✅ Quieres evitar código duplicado entre subclases
  ✅ El orden de los pasos es fijo pero los detalles varían
  ✅ Necesitas pasos opcionales (hooks) en el algoritmo

No lo uses cuando:
  ❌ Las variantes no tienen relación jerárquica (usa Strategy)
  ❌ El orden de los pasos cambia entre variantes

Señal de que lo necesitas:
  "PDFReportGenerator y ExcelReportGenerator hacen exactamente
   lo mismo excepto cómo formatean los datos — fetchData(),
   validateData(), save() y notify() están duplicados"

Diferencia clave con Strategy:
  Template Method: herencia — la subclase implementa pasos del algoritmo.
  Strategy: composición — el cliente inyecta el algoritmo completo.
  Template Method: el algoritmo tiene una estructura fija.
  Strategy: el algoritmo completo es intercambiable.
```

---

### 🧳 Visitor
**Agrega operaciones a una jerarquía de clases sin modificarlas.**

```
Úsalo cuando:
  ✅ Tienes una jerarquía ESTABLE de clases y necesitas MUCHAS operaciones
  ✅ Las operaciones no pertenecen a los elementos (son algoritmos externos)
  ✅ Necesitas acumular estado mientras recorres la estructura

No lo uses cuando:
  ❌ La jerarquía cambia frecuentemente (cada tipo nuevo rompe todos los visitors)
  ❌ Solo necesitas una operación sobre la jerarquía

Señal de que lo necesitas:
  "Tengo Paragraph, Image, Table y List (jerarquía estable).
   Necesito exportar a HTML, PDF, Markdown, XML y contar palabras.
   Sin Visitor modifico 4 clases por cada nueva operación"

Concepto clave — Double Dispatch:
  element.accept(visitor)  → 1er dispatch (tipo del elemento)
  visitor.visitParagraph() → 2do dispatch (tipo del visitor)
```

---

## 🌳 Árbol de decisión

```
¿Cuál es tu problema principal?
│
├── CREAR objetos ──────────────────────────────────────────────────────┐
│   │                                                                    │
│   ├── ¿Solo necesitas UNA instancia global?
│   │       └── SINGLETON
│   │
│   ├── ¿El objeto tiene muchos parámetros opcionales?
│   │       └── BUILDER
│   │
│   ├── ¿Clona un objeto ya configurado con pequeñas variaciones?
│   │       └── PROTOTYPE
│   │
│   ├── ¿Creas familias de objetos relacionados que deben ser coherentes?
│   │       └── ABSTRACT FACTORY
│   │
│   └── ¿Delegas la creación a una subclase o según el entorno?
│           └── FACTORY METHOD
│
├── COMPONER clases ────────────────────────────────────────────────────┐
│   │
│   ├── ¿Interfaz incompatible con una librería externa?
│   │       └── ADAPTER
│   │
│   ├── ¿Dos dimensiones que crecen independientemente?
│   │       └── BRIDGE
│   │
│   ├── ¿Jerarquía parte-todo donde hojas y compuestos se tratan igual?
│   │       └── COMPOSITE
│   │
│   ├── ¿Agregar comportamiento opcional en capas (auth, log, cache)?
│   │       └── DECORATOR
│   │
│   ├── ¿Simplificar acceso a múltiples subsistemas complejos?
│   │       └── FACADE
│   │
│   ├── ¿Millones de objetos similares consumen demasiada memoria?
│   │       └── FLYWEIGHT
│   │
│   └── ¿Controlar acceso, agregar cache o lazy loading?
│           └── PROXY
│
└── COMPORTAMIENTO entre objetos ───────────────────────────────────────┐
    │
    ├── ¿Validaciones en pipeline donde cada paso puede cortar la cadena?
    │       └── CHAIN OF RESPONSIBILITY
    │
    ├── ¿Encapsular acciones para undo/redo o colas de trabajo?
    │       └── COMMAND
    │
    ├── ¿Recorrer una colección personalizada sin exponer su estructura?
    │       └── ITERATOR
    │
    ├── ¿Centralizar comunicación entre muchos objetos acoplados?
    │       └── MEDIATOR
    │
    ├── ¿Guardar y restaurar el estado completo de un objeto?
    │       └── MEMENTO
    │
    ├── ¿Notificar automáticamente a múltiples suscriptores de un cambio?
    │       └── OBSERVER
    │
    ├── ¿El comportamiento del objeto cambia según su estado interno?
    │       └── STATE
    │
    ├── ¿Seleccionar un algoritmo entre varios en runtime?
    │       └── STRATEGY
    │
    ├── ¿Múltiples clases comparten la estructura del algoritmo pero no los detalles?
    │       └── TEMPLATE METHOD
    │
    └── ¿Agregar operaciones a una jerarquía estable sin modificarla?
            └── VISITOR
```

---

## 📋 Tabla maestra de referencia rápida

### Patrones Creacionales

| Patrón | Problema | Solución | Señal clave |
|---|---|---|---|
| **Singleton** | Una sola instancia global | Instancia estática privada + `getInstance()` | `new X()` en múltiples módulos = estado inconsistente |
| **Factory Method** | Delegar qué clase concreta crear | Método `create()` que subclases sobreescriben | El tipo a crear depende del entorno o config |
| **Abstract Factory** | Familias coherentes de objetos | Interfaz con un `create` por cada producto | Mezclar productos de familias distintas es un bug |
| **Builder** | Objetos con muchos parámetros opcionales | Métodos encadenables + `build()` con validaciones | Constructor con más de 4 parámetros o muchos `null` |
| **Prototype** | Variaciones de un objeto costoso de crear | Método `clone()` en el objeto | Mismo objeto, distinto título/nombre/ID |

### Patrones Estructurales

| Patrón | Problema | Solución | Señal clave |
|---|---|---|---|
| **Adapter** | Interfaz incompatible con librería externa | Clase que implementa tu interfaz y delega al externo | SDK externo con API completamente diferente a la tuya |
| **Bridge** | Explosión de subclases por dos dimensiones | Dos jerarquías conectadas por referencia | N tipos × M canales = N×M clases |
| **Composite** | Tratar archivos y carpetas de la misma forma | Interfaz común para hoja y compuesto | `getSize()` en un archivo = X bytes, en carpeta = suma recursiva |
| **Decorator** | Agregar comportamiento opcional en runtime | Wrappers que implementan la misma interfaz | Auth + Cache + Log = 7 subclases vs 3 decoradores |
| **Facade** | Orquestar múltiples subsistemas complejos | Una clase que coordina y oculta los internos | El cliente llama 6 servicios para hacer "una cosa" |
| **Flyweight** | Miles de objetos con estado compartido duplicado | Separar estado intrínseco (compartido) del extrínseco | 50,000 partículas con la misma textura de 500KB |
| **Proxy** | Controlar acceso a un objeto | Clase con misma interfaz que intercepta llamadas | Cache, auth, logging o lazy load transparentes al cliente |

### Patrones de Comportamiento

| Patrón | Problema | Solución | Señal clave |
|---|---|---|---|
| **Chain of Resp.** | Pipeline de validaciones independientes | Cadena de handlers que pasan o bloquean | Validaciones que pueden añadirse/quitarse/reordenarse |
| **Command** | Undo/redo, colas de trabajo, auditoría | Objeto que encapsula acción + su inversa | "Necesito Ctrl+Z" o "necesito reintentar esta tarea" |
| **Iterator** | Recorrer colecciones personalizadas | Objeto con `hasNext()` / `next()` | Árbol, grafo o lista enlazada que el cliente recorre |
| **Mediator** | N objetos que se conocen entre sí = N² dependencias | Hub central de comunicación | Formulario con 8 campos que se afectan entre sí |
| **Memento** | Guardar/restaurar estado complejo sin exponer internos | Objeto opaco (snapshot) gestionado por Caretaker | Checkpoints en juegos, historial de versiones |
| **Observer** | Notificar múltiples consumidores de un cambio | Lista de suscriptores + `notify()` | Precio cambia → actualiza dashboard + email + SMS + log |
| **State** | `switch(state)` en cada método crece infinitamente | Una clase por estado que implementa todas las acciones | Máquina de estados con transiciones complejas |
| **Strategy** | Múltiples algoritmos intercambiables | Interfaz común + una clase por algoritmo | Pagar con tarjeta, PayPal o crypto — misma interfaz |
| **Template Method** | Estructura del algoritmo duplicada entre clases | Clase abstracta con pasos concretos y abstractos | `fetchData()` y `save()` iguales en 5 clases hermanas |
| **Visitor** | Nueva operación en jerarquía = modificar todas las clases | Objeto externo con un método `visit` por tipo | Exportar a 5 formatos sin tocar los nodos del árbol |

---

## 🔗 Combinaciones frecuentes

Algunos patrones funcionan excepcionalmente bien juntos:

| Combinación | Para qué sirve |
|---|---|
| **Builder + Factory Method** | La fábrica decide qué Builder usar según el contexto |
| **Singleton + Factory** | La Factory usa Singleton para cachear las instancias creadas (Flyweight Factory) |
| **Composite + Iterator** | Recorrer un árbol Composite sin exponer su estructura |
| **Composite + Visitor** | Aplicar operaciones externas sobre todos los nodos del árbol |
| **Command + Memento** | Command para undo de operaciones simples + Memento para restaurar estados complejos |
| **Command + Chain of Responsibility** | La cadena construye el comando apropiado según el contexto |
| **Observer + Mediator** | El Mediator usa Observer internamente para notificar a los componentes |
| **Strategy + Factory Method** | La fábrica crea la estrategia correcta según el entorno |
| **Decorator + Composite** | Los Decorators envuelven nodos del árbol Composite |
| **Proxy + Decorator** | Mismo mecanismo, distintos propósitos — control de acceso vs enriquecimiento |
| **State + Strategy** | El State contiene estrategias distintas para cada estado |
| **Template Method + Factory Method** | El Template define los pasos; el Factory Method crea los objetos en esos pasos |
| **Adapter + Facade** | Adapter traduce interfaces; Facade simplifica el acceso al sistema adaptado |

---

## 🚨 Señales de que necesitas un patrón

```
CREACIONALES:
  → "new X()" repetido en muchos módulos con el mismo resultado
  → Constructor con más de 4-5 parámetros, muchos de ellos null
  → El tipo a crear depende de una condición (entorno, configuración)
  → Necesitas objetos similares que compartan la mayor parte del estado

ESTRUCTURALES:
  → Importas directamente SDKs externos en tu lógica de negocio
  → El número de subclases crece multiplicativamente (N×M)
  → Llamas a 5+ servicios para completar "una sola operación"
  → Cada vez que agregas una feature, modificas 6 clases distintas
  → Tienes miles de objetos y el profiler dice que la memoria es un problema

COMPORTAMIENTO:
  → Un método tiene un switch/if con 5+ casos según el estado o tipo
  → Agregar un nuevo caso requiere modificar múltiples archivos
  → Necesitas deshacer o rehacer acciones del usuario
  → Múltiples módulos necesitan reaccionar al mismo evento
  → Quieres validar una solicitud en pasos independientes y reutilizables
```

---

## ✋ Señales de que estás sobrediseñando

```
→ Creas una clase "Factory" para un objeto que solo tiene una implementación
→ Usas Singleton para un objeto que podría ser stateless
→ Implementas Visitor para una jerarquía de 2 clases con 1 operación
→ Usas Builder para un objeto con 2 parámetros obligatorios
→ Creas un Mediator entre 2 objetos que solo interactúan entre sí
→ Aplicas Flyweight cuando tienes 100 objetos, no 100,000
→ Tu "patrón" tiene más código de estructura que lógica de negocio
→ Necesitas un diagrama de 3 páginas para explicar algo que antes era un método

Regla práctica:
  Un patrón debe REDUCIR la complejidad total del sistema,
  no aumentarla. Si el patrón agrega más código del que ahorra,
  es la señal de que es la herramienta incorrecta para el problema.
```

---

## 📚 Resumen por contexto de aplicación

| Si estás construyendo... | Patrones más relevantes |
|---|---|
| **API REST / Backend** | Factory Method, Builder, Proxy (cache/auth), Chain of Responsibility, Strategy |
| **Sistema de pagos** | Strategy, Adapter, Factory Method, Builder |
| **Editor o herramienta** | Command (undo/redo), Memento, Composite, Observer |
| **UI / Frontend reactivo** | Observer, Mediator, State, Command |
| **Sistema de notificaciones** | Observer, Strategy (canales), Bridge, Factory Method |
| **Videojuego** | Flyweight, State, Observer, Command, Prototype |
| **Pipeline de datos** | Chain of Responsibility, Template Method, Strategy, Iterator |
| **Procesador de documentos** | Composite, Visitor, Template Method, Iterator |
| **Sistema de reportes** | Template Method, Strategy, Builder, Visitor |
| **Microservicios** | Adapter, Facade, Proxy, Factory Method, Observer |

---

*Referencia: Design Patterns: Elements of Reusable Object-Oriented Software — Gang of Four (GoF)*
*Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides — 1994*
