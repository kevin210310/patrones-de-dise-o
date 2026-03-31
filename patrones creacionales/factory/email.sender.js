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