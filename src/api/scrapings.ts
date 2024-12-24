import express from "express";
import Scrapper from "../lib/Scrapper";

const router = express.Router();



router.get<{}, any>("/", (req, res) => {
	const scraper = new Scrapper();
	scraper.scrapeUltimasNoticias();
	scraper.scrapeNTN24();
	res.json({message: "Scrapping starting"});
});

export default router;
