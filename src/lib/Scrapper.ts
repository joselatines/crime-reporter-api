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
				.then(() => console.log(`Saved noticia: ${newNews.title}`))
				.catch(e => console.log(e));
		});

		await this.checkIfNewsHasKeywordsWantedForUsers(allNews);

		console.log(
			`Saved from ultimas noticias: ${ultimasNoticias.length}, from El Nacional: ${elNacional.length}, from NTN24: 0`
		);
		console.log(
			`Finished saving news to database, total of ${filteredNews.length} news saved`
		);

		return filteredNews;
	}

	public async updateNTN24Images(): Promise<{ updated: number, notFound: number, errorCount: number }> {
		console.log("Starting image update for existing NTN24 news...");
		const ntn24NewsFromWebsite = await this.getNewsNTN24();
		let updatedCount = 0;
		let notFoundCount = 0;
		let errorCount = 0;
	
		for (const fetchedNews of ntn24NewsFromWebsite) {
			try {
				const existingNews = await News.findOne({
					title: fetchedNews.title,
					sourceWebsite: "ntn24.com",
				});
	
				if (existingNews && fetchedNews.imgUrl && existingNews.imgUrl !== fetchedNews.imgUrl) {
					existingNews.imgUrl = fetchedNews.imgUrl;
					await existingNews.save();
					updatedCount++;
					console.log(`Updated image URL for NTN24 noticia: ${fetchedNews.title}`);
				} else if (!existingNews) {
					notFoundCount++;
					console.log(`NTN24 noticia not found for image update: ${fetchedNews.title}`);
				}
			} catch (error) {
				errorCount++;
				console.error(`Error updating image for ${fetchedNews.title}:`, error);
			}
		}
	
		console.log(`Finished image update for NTN24 news.`);
		console.log(`Updated ${updatedCount} image URLs.`);
		console.log(`Not found ${notFoundCount} news items.`);
		console.log(`Encountered ${errorCount} errors.`);
	
		return { updated: updatedCount, notFound: notFoundCount, errorCount: errorCount };
	}

	public async deleteOldNTN24(): Promise<{ deletedCount: number, errorCount: number }> {
        console.log("Starting deletion of old NTN24 news with default SVG image URL...");
        const svgDefaultURL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3C/svg%3E";
        let deletedCount = 0;
        let errorCount = 0;

        try {
            const result = await News.deleteMany({
                sourceWebsite: "ntn24.com",
                imgUrl: svgDefaultURL,
            });
            deletedCount = result.deletedCount;
            console.log(`Successfully deleted ${deletedCount} old NTN24 news items.`);
        } catch (error) {
            errorCount++;
            console.error("Error deleting old NTN24 news:", error);
        }

        return { deletedCount, errorCount };
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

					console.log("🔍 Keywords to match:", userKeyWords);

					console.log("🔡 Title:", title);
					console.log("🔡 Description:", desc);

					
					const hasKeywordInTitle = userKeyWords.some(word => {
						const match = title.includes(word.toLocaleLowerCase());
						console.log(`🔎 Checking title for keyword "${word}": ${match ? "✅ Found" : "❌ Not found"}`);
						return match;
					});

					const hasKeywordInDesc = userKeyWords.some(word => {
						const match = desc.includes(word.toLocaleLowerCase());
						console.log(`🔎 Checking description for keyword "${word}": ${match ? "✅ Found" : "❌ Not found"}`);
						return match;
					});

					console.log("📌 Keyword found in title:", hasKeywordInTitle ? "✅ Yes" : "❌ No");
					console.log("📌 Keyword found in description:", hasKeywordInDesc ? "✅ Yes" : "❌ No");

					

					if (hasKeywordInTitle || hasKeywordInDesc) {
						console.log("✅ Sending notification...")
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
		const existingNews = await News.findOne({ title });
		return Boolean(existingNews);
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

			await page.goto(url);
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
						sourceWebsite: "ultimasnoticias.com.ve",
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
	/* public async getNewsNTN24(
		url = "https://www.ntn24.com/noticias-judicial"
	): Promise<Array<NewsData>> {
		const page = await this.browser.newPage();
		console.log(page);
		try {
			console.info("Scrapping NTN24");
			await page.goto(url, { timeout: 0 });

			// Capturar los console.log del navegador
			page.on('console', msg => {
				console.log(`[Browser Console]: ${msg.type()} ${msg.text()}`);
			});
			
			const container = await page.$(".container.category-fold-3");
			console.log(container);
			if (!container) throw new Error("Container not found");
			console.info("Starting getting news");
			const posts = await container.evaluate(container => {
				page.on('console', msg => {
					console.log(`[Browser Console]: ${msg.type()} ${msg.text()}`);
				});
				const posts = [];
				console.log(posts);
				const postElements = container.querySelectorAll(".post-v");
				console.log(postElements);
				for (const postElement of postElements) {
					let titleElement = postElement.querySelector(".title");
					let title = titleElement?.textContent;
					const description = "text";
					const link = postElement
					.querySelector(".title a")
					?.getAttribute("href");
					const imgUrl = postElement
					.querySelector(".img-a img")
					?.getAttribute("src");
					console.log(link);

					// Verificar si el src original es la URL de reemplazo
					const onerrorSrc = postElement.querySelector(".img-a img")?.getAttribute("onerror")?.match(/this\.src='([^']+)'/)?.[1];
					if (imgUrl === 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1920 1080\'%3E%3C/svg%3E' && onerrorSrc) {
						// En este caso, podríamos intentar usar la URL dentro del onerror (si es una URL válida)
						// Sin embargo, lo más probable es que no quieras esta URL de reemplazo.
						imgUrl = null; // O podrías dejarlo como está para indicar que no se encontró la imagen original.
					}

					const publishedAt = postElement.querySelector(".date")?.textContent;
					posts.push({ title, description, url: link, imgUrl, publishedAt, sourceWebsite: "ntn24.com" });
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
	} */

		public async getNewsNTN24(
			url = "https://www.ntn24.com/noticias-judicial"
		): Promise<Array<NewsData>> {
			const page = await this.browser.newPage();
			try {
				console.info("Scrapping NTN24 - Navegador abierto");
				await page.goto(url, { timeout: 0 });
				console.info(`Scrapping NTN24 - Navegado a ${url}`);
		
				// Capturar los console.log del navegador
				page.on('console', msg => {
					console.log(`[Browser Console]: ${msg.type()} ${msg.text()}`);
				});
		
				const container = await page.$(".container.category-fold-3");
				console.log("¿Se encontró el contenedor?", !!container);
		
				if (!container) {
					console.error("Scrapping NTN24 - ¡Contenedor principal no encontrado!");
					throw new Error("Container not found");
				}
		
				console.info("Scrapping NTN24 - Contenedor principal encontrado. Iniciando extracción de noticias.");
				const posts = await container.evaluate(container => {
					console.log("[Browser Console]: Dentro de evaluate - Iniciando");
					const posts = [];
					const postElements = container.querySelectorAll(".post-v");
					console.log(`[Browser Console]: Dentro de evaluate - Encontrados ${postElements.length} elementos .post-v`);
		
					for (let i = 0; i < postElements.length; i++) {
						const postElement = postElements[i];
						console.log(`[Browser Console]: Dentro de evaluate - Procesando elemento .post-v en índice ${i}`);
		
						try {
							const titleElement = postElement.querySelector(".title");
							const title = titleElement?.textContent?.trim() || null;
							console.log(`[Browser Console]: Dentro de evaluate - Título encontrado: ${title}`);
		
							const description = title; // La descripción suele ser similar al título
							console.log(`[Browser Console]: Dentro de evaluate - Descripción: ${description}`);
		
							const linkElement = postElement.querySelector(".title a");
							const link = linkElement?.getAttribute("href");
							console.log(`[Browser Console]: Dentro de evaluate - Enlace encontrado: ${link}`);
		
							const imgElement = postElement.querySelector(".img-a img");
							let imgUrl = imgElement?.getAttribute("src");
							
							// Intentar obtener la URL de data-src si el src inicial es la imagen de reemplazo
							const onerrorSrcMatch = imgElement?.getAttribute("onerror")?.match(/this\.src='([^']+)'/);
							if (imgUrl?.startsWith('data:image/svg+xml')) {
								const dataSrc = imgElement?.getAttribute('data-src');
								if (dataSrc) {
									imgUrl = dataSrc;
									console.log("[Browser Console]: Dentro de evaluate - URL de imagen obtenida de data-src:", imgUrl);
								} else if (onerrorSrcMatch) {
									imgUrl = null;
									console.log("[Browser Console]: Dentro de evaluate - URL de imagen descartada (era onerror y no data-src)");
								} else {
									imgUrl = null; // No se encontró data-src, descartar la imagen de reemplazo
									console.log("[Browser Console]: Dentro de evaluate - URL de imagen descartada (era onerror y no data-src)");
								}
							} else if (imgUrl?.startsWith('data:image/svg+xml')) {
								imgUrl = null; // Descartar la imagen de reemplazo si no hay onerror con una posible URL
								console.log("[Browser Console]: Dentro de evaluate - URL de imagen descartada (era svg de inicio)");
							}
		
							const publishedAt = postElement.querySelector(".date")?.textContent?.trim() || null;
							console.log(`[Browser Console]: Dentro de evaluate - Fecha de publicación: ${publishedAt}`);
		
							posts.push({ title, description, url: link, imgUrl, publishedAt, sourceWebsite: "ntn24.com" });
							console.log("[Browser Console]: Dentro de evaluate - Noticia agregada al array posts");
		
						} catch (error) {
							console.error(`[Browser Console]: Dentro de evaluate - Error al procesar elemento .post-v en índice ${i}: ${error}`);
						}
					}
					console.log("[Browser Console]: Dentro de evaluate - Finalizando. Posts encontrados:", posts);
					return posts;
				});
		
				console.log("Scrapping NTN24 - Noticias extraídas:", posts.length);
				return posts;
		
			} catch (error) {
				console.error(`Error scraping NTN24 (fuera de evaluate): ${error}`);
				return [];
		
			} finally {
				await page.close();
				console.info("Scrapping NTN24 - Navegador cerrado");
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
					posts.push({ title, description, url: link, imgUrl, publishedAt, sourceWebsite: "elnacional.com" });
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
