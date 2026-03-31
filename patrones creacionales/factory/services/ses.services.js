class SESService {
    constructor() {
        this.client = new SESClient({ region: 'us-east-1' });
    }

  async send(email) {
    const command = new send({
      Destination: { ToAddresses: [email.to], CcAddresses: email.cc },
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