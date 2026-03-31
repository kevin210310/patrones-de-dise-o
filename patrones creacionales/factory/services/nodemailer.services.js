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
      from: email.from,
      to: email.to,
      cc: email.cc,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: email.attachments,
    });
  }
}