class Email {
	public to: string | null = null;
	public subject: string | null = null;
    public html: string | null = null;
    public text: string | null = null;
    public from: string = "no-reply@miapp.com";
    public attachments: string[] =  [];
    public cc: string[] = [];
}


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
        if (!this.email.to)      throw new Error("El destinatario es requerido");
        if (!this.email.subject) throw new Error("El asunto es requerido");
        if (!this.email.html && !this.email.text) throw new Error("El cuerpo es requerido");

        return this.email;
    }
}


(() => {
    const email = new EmailBuilder();

    console.log(email
    .to('kevin')
    .subject('nose')
    .text('hola mundo')
    .build());


    const email2 = new EmailBuilder();

    console.log(email2
    .to('kevin2')
    .subject('nose2')
    .html('<p>hola mundo</p>')
    .build());
})();