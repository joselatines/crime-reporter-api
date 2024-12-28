import { NewsData } from "../interfaces/Database";
import nodemailer from "nodemailer";

export class Notifier {
	transporter: nodemailer.Transporter | null = null;
	fromEmail = process.env.MAIL_USERNAME;

	constructor() {
		this.init();
	}

	public init() {
		this.transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.MAIL_USERNAME ,
				pass: process.env.MAIL_PASSWORD,
			},
		});
	}

	private buildMessage(news: NewsData, to: string) {
		return {
			from: this.fromEmail,
			to: to,
			subject: `New news: ${news.title}`,
			html: `
        <h1>${news.title}</h1>
        <p>${news.description}</p>
        <img src="${news.imgUrl}" />
        <a href="${news.url}">Read more</a>
      `,
		};
	}

	private async sendNotification(message: any) {
		try {
			this.transporter?.sendMail(message, (error, info) => {
				if (error) {
					console.log(error);
				} else {
					console.log("Email sent: " + info.response);
				}
			});
		} catch (error) {
			console.error(error);
		}
	}

	public async notifyNews(news: NewsData, to: string) {
		console.log(`Notifying news: ${news.title}`);
		const message = this.buildMessage(news, to);
		await this.sendNotification(message);
		console.log(`News notified: ${news.title}`);
	}
}
