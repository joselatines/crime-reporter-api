// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import puppeteer from "puppeteer";

export default class Scrapper {


	constructor() {
	
	}

	public async scrapeUltimasNoticias(url = 'https://ultimasnoticias.com.ve/seccion/sucesos/') {
		console.log("probando");

		const browser = await puppeteer.launch({ headless: true });
		const page = await browser.newPage();
		// Interceptar mensajes de consola dentro del navegador
		page.on("console", (msg: any) => console.log("PAGE LOG:", msg.text()));

		await page.goto(url, { timeout: 0 });
		console.log("Conectado a ultima noticias");

		// Targeting the DOM Nodes that contain the Digimon names
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

				return {
					title,
					description,
					link,
				};
			});
			return data;
		});
		console.log(newsData);

		await browser.close();

		// Return the scraped data
		return newsData;
	}
  public scrapeNTN24(url="https://www.ntn24.com/") {
    
  }
}