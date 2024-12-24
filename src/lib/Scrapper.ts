// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import puppeteer, { Browser } from "puppeteer";
import { News } from "./db/models/News";

export default class Scrapper {
	browser: Browser = null;

	constructor() {}

	public async scrapeUltimasNoticias(
		url = "https://ultimasnoticias.com.ve/seccion/sucesos/"
	) {
		console.log("Scrapping starting");
		const browser = await puppeteer.launch({ headless: true });
		console.log("Opening page");
		const page = await browser.newPage();
		// Interceptar mensajes de consola dentro del navegador
		page.on("console", (msg: any) => console.log("PAGE LOG:", msg.text()));

		await page.goto(url, { timeout: 0 });
		console.log("Conectado a ultima noticias");

		// Targeting the DOM Nodes that contain the Digimon names
		console.log("Scraping news");
		const newsData = await page.evaluate(() => {
			const articleElements = document.querySelectorAll(".td-module-container");
			if (!articleElements) return [];
			console.log(articleElements);
			const data = [...articleElements].map(article => {
				const title = article
					.querySelector("h3.entry-title")
					?.textContent.trim();
				const description = article
					.querySelector(".td-excerpt")
					?.textContent.trim();
				const link = article.querySelector(".entry-title a")?.href;
				const imgUrl = article
					.querySelector(".entry-thumb.td-thumb-css")
					?.getAttribute("data-img-url");
				const publishedAt = article
					.querySelector(".entry-date.updated.td-module-date")
					?.getAttribute("datetime");
				const author = article
					.querySelector(".td-post-author-name a")
					?.textContent.trim();
				const authorUrl = article.querySelector(".td-post-author-name a")?.href;
				return {
					title,
					description,
					url: link,
					imgUrl,
					authorUrl,
					author,
					publishedAt,
				};
			});
			return data;
		});

		await browser.close();

		newsData.forEach((news: any) => {
			const newNews = new News(news);
			newNews
				.save()
				.then(() => console.log(`New news saved: ${newNews}`))
				.catch(e => console.log(e));
		});

		// Return the scraped data
		return newsData;
	}
	public async scrapeNTN24(url = "https://www.ntn24.com/noticias-judicial") {
		try {
			const page = await this.browser.newPage();

			// class container: container category-fold-3
			await page.goto(url);
			console.log("Conectado a NTN24");
			const container = await page.$(".container.category-fold-3");

			if (!container) throw new Error("Container not found");
			const posts = container.$$(".post-v");

			console.log({ posts });
		} catch (error) {}
	}
}
