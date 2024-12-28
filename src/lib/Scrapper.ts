// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import puppeteer, { Browser } from "puppeteer";
import { NewsData } from "../interfaces/Database";
import { News } from "./db/models/News";
import { Notifier } from "./Notifiers";

export default class Scrapper {
	browser: Browser = null;
	notifier: Notifier = new Notifier();

	constructor(notifier?: Notifier) {
		this.browser = null;
		this.notifier = notifier || new Notifier();
	}

	public async init() {
		if (!this.browser) {
			console.log("Initializing browser...");
			this.browser = await this.openBrowser();
			console.log("Browser initialized");
		}
	}

	public async saveNewsIntoDatabase() {
		console.log("Starting news scraping...");
		const ultimasNoticias = await this.getNewsUltimasNoticias();
		console.log("Finished scraping Ultimas Noticias");
		const elNacional = await this.getNewsElNacional();
		console.log("Finished scraping El Nacional");
		const ntn24 = await this.getNewsNTN24();
		console.log("Finished scraping NTN24");
		const allNews = [...ultimasNoticias, ...elNacional, ...ntn24];

		const filteredNews = allNews.filter(news => !this.isNewsInDb(news.title));
		
		filteredNews.forEach((news: NewsData) => {
			const newNews = new News(news);
			newNews
				.save()
				.then(() => console.log(`New news saved: ${newNews}`))
				.catch(e => console.log(e));
		});

		const userKeyWords = ["asesinato", "corrupcion", "violencia", "terroristas", "chacao"];

		filteredNews.forEach((news: NewsData) => {
			// check if news have user saved tags
			const title = news.title.toLocaleLowerCase();
			const desc = news.description.toLocaleLowerCase();

			const hasKeywordInTitle = userKeyWords.some(word => title.includes(word.toLocaleLowerCase()));
			const hasKeywordInDesc = userKeyWords.some(word => desc.includes(word.toLocaleLowerCase()));

			if (hasKeywordInTitle || hasKeywordInDesc) {
				// send notification to user
				this.notifier.notifyNews(news, "joselatines33@gmail.com");
			}
		});
		
		console.debug(`Saved from ultimas noticias: ${ultimasNoticias.length}, from El Nacional: ${elNacional.length}, from NTN24: ${ntn24.length}`);
		console.debug(`Finished saving news to database, total of ${filteredNews.length} news saved`);
	}

	private async isNewsInDb(title: string) {
		const existingNews = await News.find({ title });
		
		return existingNews.length > 0;
	}

	private async openBrowser() {
		console.log("Opening browser...");
		const browser = await puppeteer.launch({
			headless: true,
			args: [
				"--disable-setuid-sandbox",
				"--no-sandbox",
				"--single-process",
				"--no-zygote",
			],
			executablePath:
				process.env.NODE_ENV === "production"
					? process.env.PUPPETEER_EXECUTABLE_PATH
					: puppeteer.executablePath(),
		});
		console.log("Browser opened");
		return browser;
	}

	private async closeBrowser() {
		if (this.browser) {
			console.log("Closing browser...");
			await this.browser.close();
			console.log("Browser closed");
		}
	}

	public async getNewsUltimasNoticias(
		url = "https://ultimasnoticias.com.ve/seccion/sucesos/"
	): Promise<Array<NewsData>> {
		const browser = this.browser;
		const page = await browser.newPage();
		try {
			console.info("Scrapping ultimas noticias");

			await page.goto(url, { timeout: 0 });
			console.info("Starting getting news");
			const newsPosts = await page.evaluate(() => {
				const articleElements = document.querySelectorAll(
					".td-module-container"
				);
				if (!articleElements) return [];

				const posts = [...articleElements].map(article => {
					const title = article
						?.querySelector("h3.entry-title")
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
					const authorUrl = article.querySelector(
						".td-post-author-name a"
					)?.href;
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
				return posts;
			});

			return newsPosts;
		} catch (error) {
			console.error(`Error scraping Ultimas Noticias: ${error}`);
			return [];
		} finally {
			await page.close();
		}
	}
	public async getNewsNTN24(
		url = "https://www.ntn24.com/noticias-judicial"
	): Promise<Array<NewsData>> {
		const page = await this.browser.newPage();
		try {
			console.info("Scrapping NTN24");
			await page.goto(url, { timeout: 0 });
			const container = await page.$(".container.category-fold-3");

			if (!container) throw new Error("Container not found");
			console.info("Starting getting news");
			const posts = await container.evaluate(container => {
				const posts = [];
				const postElements = container.querySelectorAll(".post-v");
				for (const postElement of postElements) {
					const title = postElement.querySelector(".title")?.textContent;
					const description = title;
					const link = postElement
						.querySelector(".title a")
						?.getAttribute("href");
					const imgUrl = postElement
						.querySelector(".img-a img")
						?.getAttribute("src");
					const publishedAt = postElement.querySelector(".date")?.textContent;
					posts.push({ title, description, link, imgUrl, publishedAt });
				}
				return posts;
			});

			return posts;
		} catch (error) {
			console.error(`Error scraping NTN24: ${error}`);
			return [];
		} finally {
			await page.close();
		}
	}

	public async getNewsElNacional(
		url = "https://www.elnacional.com/sucesos/"
	): Promise<Array<NewsData>> {
		const page = await this.browser.newPage();
		try {
			console.info("Scrapping El Nacional");
			const response = await page.goto(url);
			const container = await page.$(".list-articles");

			if (!container) throw new Error("Container not found");
			console.info("Starting getting news");
			const posts = await container.evaluate(container => {
				const posts = [];
				const postElements = container.querySelectorAll(".article");
				for (const postElement of postElements) {
					const title = postElement.querySelector(".title a")?.textContent;
					const description =
						postElement.querySelector(".extract a")?.textContent;
					const link = postElement
						.querySelector(".title a")
						?.getAttribute("href");
					const imgUrl = postElement
						.querySelector(".image img")
						?.getAttribute("src");
					const publishedAt =
						postElement.querySelector(".meta time")?.textContent;
					posts.push({ title, description, link, imgUrl, publishedAt });
				}
				return posts;
			});

			return posts;
		} catch (error) {
			console.error(`Error scraping El Nacional: ${error}`);
			return [];
		} finally {
			await page.close();
		}
	}
}
