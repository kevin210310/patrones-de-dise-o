class Document {
	public title: string;
	public content: string;
	public author: string;
	
	constructor(title: string, content: string, author: string) {
		this.title = title;
		this.content = content;
		this.author = author;
	}
	
	
	clone(): Document {
		return new Document(this.title, this.content, this.author);
	}
	
	displayInfo() {
	  console.log({ title: this.title, content: this.content, author: this.author })
	}
}