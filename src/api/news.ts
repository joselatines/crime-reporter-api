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
	const allNews = await News.find();
	res.json({ message: "All news", data: allNews });
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

export default router;
