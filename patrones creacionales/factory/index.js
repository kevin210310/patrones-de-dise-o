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