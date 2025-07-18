import express from "express";
import Scrapper from "../lib/Scrapper";
import mongoose from "mongoose";
import { News } from "../lib/db/models/News";
import { Comment } from "../lib/db/models/Comment";

const router = express.Router();

interface CommentParams {
    newsId: string; 
}

interface CommentBody {
    author: string;
    content: string;
}


router.get<{}, any>("/", async (req, res) => {
    try {
        const { sources } = req.query;
        let query = {};


        if (sources) {
            const sourceArray = (sources as string).split(',');
            query = { source: { $in: sourceArray } };
        }

        const allNews = await News.find(query).sort({ createdAt: -1 });
        res.json({ message: "All news", data: allNews });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener noticias.' });
    }
});

// Agregar un comentario a una noticia
router.post<CommentParams, any, CommentBody>("/:newsId/comments", async (req, res) => {
    const { newsId } = req.params; 
    const { author, content } = req.body; 

    if (!mongoose.Types.ObjectId.isValid(newsId)) {
        return res.status(400).json({ message: "Invalid newsId" });
    }

    if (!author || !content) {
        return res.status(400).json({ message: "Author and content are required" });
    }

    try {
        const news = await News.findById(newsId);
        if (!news) {
            return res.status(404).json({ message: "News not found" });
        }

        const newComment = new Comment({
            newsId,
            author,
            content
        });

        await newComment.save();
        res.status(201).json({ message: "Comment added successfully", data: newComment });
    } catch (error) {
        res.status(500).json({ message: "Error adding comment", error });
    }
});

// Obtener comentarios de una noticia
router.get<CommentParams, any>("/:newsId/comments", async (req, res) => {
    const { newsId } = req.params; 

    if (!mongoose.Types.ObjectId.isValid(newsId)) {
        return res.status(400).json({ message: "Invalid newsId" });
    }

    try {
        const comments = await Comment.find({ newsId }).sort({ createdAt: -1 });
        res.json({ message: "Comments for news", data: comments });
    } catch (error) {
        res.status(500).json({ message: "Error fetching comments", error });
    }
});

// Obtener noticias filtradas por palabras clave
router.get("/filtered-news", async (req, res) => {
    try {
        // Obtener las palabras clave del query parameter
        const keywords = req.query.keywords as string;

        if (!keywords) {
            return res.status(400).json({ message: "Se requieren palabras clave para filtrar." });
        }

        // Normalizar las palabras clave
        const normalizedKeywords = keywords
            .toLowerCase()
            .split(',')
            .map((keyword) => keyword.trim());

        // Filtrar noticias basadas en las palabras clave
        const filteredNews = await News.find({
            $or: [
                { title: { $in: normalizedKeywords.map((keyword) => new RegExp(keyword, 'i')) } },
                { description: { $in: normalizedKeywords.map((keyword) => new RegExp(keyword, 'i')) } },
                { content: { $in: normalizedKeywords.map((keyword) => new RegExp(keyword, 'i')) } },
                { tags: { $in: normalizedKeywords } },
            ],
        });

        // Devolver las noticias filtradas
        res.status(200).json({ message: "Noticias filtradas", data: filteredNews });
    } catch (error) {
        console.error('Error al filtrar noticias:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

export default router;
