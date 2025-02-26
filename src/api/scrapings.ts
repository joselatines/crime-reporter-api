import express from "express";
import Scrapper from "../lib/Scrapper";

const router = express.Router();

router.get<{}, any>("/", async (req, res) => {
	try {
		console.log("Starting scraping process...");
		const scraper = new Scrapper();
		
		console.log("Initializing scraper...");
		await scraper.init();
		
		console.log("Saving news to database...");
		const news = await scraper.saveNewsIntoDatabase();
		
		console.log(`Scraping completed successfully. Found ${news.length} new articles.`);
		res.json({ 
			message: "Scrapping completed", 
			success: true,
			newsCount: news.length
		});
	} catch (error) {
		console.error("Scraping error:", error);
		
		// Provide more detailed error information
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const errorStack = error instanceof Error ? error.stack : '';
		
		res.status(500).json({ 
			message: "Scrapping failed", 
			error: errorMessage,
			stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
			timestamp: new Date().toISOString()
		});
	}
});

export default router;
