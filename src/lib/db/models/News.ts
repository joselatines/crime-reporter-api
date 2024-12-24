import mongoose from "mongoose";

// Define a schema
const newsSchema = new mongoose.Schema({
	id: String,
	title: String,
	description: String,
	url: String,
	imgUrl: String,
	publishedAt: String,
	content: String,
	author: String,
	authorUrl: String,
});

export const News = mongoose.model("News", newsSchema);
