// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import puppeteer, { Browser } from "puppeteer";
import { NewsData } from "../interfaces/Database";
import { News } from "./db/models/News";
import { Notifier } from "./Notifiers";
import User from "../lib/db/models/user.model";
import { randomUUID } from "crypto";

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
		const elNacional = await this.getNewsElNacional();
		const ntn24 = await this.getNewsNTN24();
		const allNews = [...ultimasNoticias, ...elNacional, ...ntn24];

		const filteredNews = (
			await Promise.all(
				allNews.map(async news => ({
					news,
					exists: await this.isNewsInDb(news.title),
				}))
			)
		)
			.filter(({ exists }) => !exists)
			.map(({ news }) => news);

		filteredNews.forEach((news: NewsData) => {
			const newNews = new News(news);
			newNews
				.save()
				.then(() => console.log(`New news saved: ${newNews.title}`))
				.catch(e => console.log(e));
		});

		await this.checkIfNewsHasKeywordsWantedForUsers(filteredNews);

		console.log(
			`Saved from ultimas noticias: ${ultimasNoticias.length}, from El Nacional: ${elNacional.length}, from NTN24: ${ntn24.length}`
		);
		console.log(
			`Finished saving news to database, total of ${filteredNews.length} news saved`
		);

		return filteredNews;
	}

	private async checkIfNewsHasKeywordsWantedForUsers(
		newsList: Array<NewsData>
	) {
		try {
			console.debug(
				`Checking if news has keywords wanted for users. News to analyze ${newsList.length}`
			);
			const users = await User.find();

			if (users.length === 0) {
				return;
			}

			users.forEach(user => {
				const userKeyWords = user.newsWantedWords;

				// check if the news has a keywords for any user
				newsList.forEach(async (news: NewsData) => {
					// check if news have user saved tags
					const title = news.title.toLocaleLowerCase();
					const desc = news.description.toLocaleLowerCase();

					const hasKeywordInTitle = userKeyWords.some(word =>
						title.includes(word.toLocaleLowerCase())
					);
					const hasKeywordInDesc = userKeyWords.some(word =>
						desc.includes(word.toLocaleLowerCase())
					);

					if (hasKeywordInTitle || hasKeywordInDesc) {
						// send notification to user
						await this.notifier.notifyNews(news, user.notificationEmail);
						// save in db that a notification has sent via email
						const updated_user = await User.findOneAndUpdate(
							{ _id: user._id },
							{
								notifications: [
									...user.notifications,
									{
										id: randomUUID(),
										title: news.title,
										description: news.description,
										url: news.url,
										news_id: news._id,
										notification_to: user.notificationEmail,
										notification_type: "email",
										sended_at: new Date(),
										viewed: false,
										words_detected: [...userKeyWords],
									},
								],
							},
							{ new: true } // Return the updated document
						);
					}
				});
			});
		} catch (error) {
			console.error(error);
		}
	}

	private async isNewsInDb(title: string) {
		const existingNews = await News.find({ title });
		return Boolean(existingNews.length > 0);
	}

	private async openBrowser() {
		console.log("Opening browser...");
		try {
			// Log environment information for debugging
			console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
			console.log(`PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
			
			// Check if Chrome exists at the specified path
			const fs = require('fs');
			const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();
			
			try {
				if (fs.existsSync(execPath)) {
					console.log(`Chrome exists at path: ${execPath}`);
				} else {
					console.warn(`Warning: Chrome not found at path: ${execPath}`);
				}
			} catch (err) {
				console.warn(`Error checking Chrome path: ${err.message}`);
			}
			
			console.log(`Launching browser with Chrome at path: ${execPath}`);
			
			// Launch with more robust options
			const browser = await puppeteer.launch({
				headless: true,
				args: [
					"--disable-setuid-sandbox",
					"--no-sandbox",
					"--single-process",
					"--no-zygote",
					"--disable-dev-shm-usage",
					"--disable-gpu",
					"--no-first-run",
					"--no-default-browser-check",
				],
				executablePath: execPath,
				ignoreHTTPSErrors: true,
				timeout: 30000, // 30 seconds timeout
			});
			
			console.log("Browser opened successfully");
			return browser;
		} catch (error) {
			console.error("Failed to launch browser:", error);
			
			// Try to launch without specifying executablePath as a fallback
			if (process.env.PUPPETEER_EXECUTABLE_PATH) {
				console.log("Attempting to launch browser without specifying executablePath...");
				try {
					const browser = await puppeteer.launch({
						headless: true,
						args: [
							"--disable-setuid-sandbox",
							"--no-sandbox",
							"--single-process",
							"--no-zygote",
							"--disable-dev-shm-usage",
						],
						ignoreHTTPSErrors: true,
					});
					console.log("Browser opened successfully with fallback method");
					return browser;
				} catch (fallbackError) {
					console.error("Fallback browser launch also failed:", fallbackError);
				}
			}
			
			throw new Error(`Browser launch failed: ${error.message}`);
		}
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
