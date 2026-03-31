const SESService = require("./services/ses.service");
const NodemailerService = require("./services/nodemailer.service");

class EmailServiceFactory {
  static create() {
    if (process.env.NODE_ENV === "production") {
      return new SESService();
    }
    return new NodemailerService();
  }
}