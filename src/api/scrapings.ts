import express from "express";
import Scrapper from "../lib/Scrapper";

const router = express.Router();

router.get<{}, any>("/", async (req, res) => {
	try {
		const scraper = new Scrapper();
		await scraper.init();
		await scraper.saveNewsIntoDatabase(); // Agrega await aquí
		/* scraper.saveNewsIntoDatabase(); */ 
		res.json({ message: "Scrapping completed", success: true });
	} catch (error) {
		if (error instanceof Error) {
			console.error("Scraping error:", error);
			res.status(500).json({ message: "Scrapping failed", error: error.message });
		}

	}
});

export default router;
