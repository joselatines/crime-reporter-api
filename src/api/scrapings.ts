import express from "express";
import Scrapper from "../lib/Scrapper";

const router = express.Router();

router.get<{}, any>("/", async (req, res) => {
	const scraper = new Scrapper();
	await scraper.init();
	scraper.saveNewsIntoDatabase();

	res.json({ message: "Scrapping starting", success: true });
});

export default router;
