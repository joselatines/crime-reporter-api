import express from "express";
import Scrapper from "../lib/Scrapper";
import { News } from "../lib/db/models/News";

const router = express.Router();

router.get<{}, any>("/", async (req, res) => {
	const allNews = await News.find();
	res.json({ message: "All news", data: allNews });
});

export default router;
