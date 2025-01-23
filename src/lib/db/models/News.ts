import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
	id: String,
	title: String,
	description: String,
	url: {
		type: String,
		unique: true, // Para evitar noticias duplicadas
	},
	imgUrl: String,
	publishedAt: String,
	content: String,
	author: String,
	authorUrl: String,

	crimeType: [String], // Array para múltiples tipos de crimen
	location: String, // Ubicación como texto simple
	sourceWebsite: String, // Fuente del scraping
	verificationStatus: {
		type: String,
		enum: ["pendiente", "verificada", "descartada"],
		default: "pendiente",
	},
	tags: [String], // Etiquetas para búsquedas
});

export const News = mongoose.model("News", newsSchema);
