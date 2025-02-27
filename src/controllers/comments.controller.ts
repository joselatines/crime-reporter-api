import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Comment } from '../lib/db/models/Comment';
import { News } from '../lib/db/models/News';

// Get all comments
export const getAllComments = async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Comments retrieved successfully',
      data: comments
    });
  } catch (error) {
    console.error('Error retrieving comments:', error);
    res.status(500).json({ message: 'Error retrieving comments', error });
  }
};

// Get a specific comment by ID
export const getCommentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({
      message: 'Comment retrieved successfully',
      data: comment
    });
  } catch (error) {
    console.error('Error retrieving comment:', error);
    res.status(500).json({ message: 'Error retrieving comment', error });
  }
};

// Get all comments for a specific news item
export const getCommentsByNewsId = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(newsId)) {
      return res.status(400).json({ message: 'Invalid news ID' });
    }

    // Check if the news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    const comments = await Comment.find({ newsId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      message: 'Comments for news retrieved successfully',
      data: comments
    });
  } catch (error) {
    console.error('Error retrieving comments for news:', error);
    res.status(500).json({ message: 'Error retrieving comments for news', error });
  }
};

// Create a new comment
export const createComment = async (req: Request, res: Response) => {
  try {
    const { newsId, author, content } = req.body;

    if (!newsId || !author || !content) {
      return res.status(400).json({ message: 'NewsId, author, and content are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(newsId)) {
      return res.status(400).json({ message: 'Invalid news ID' });
    }

    // Check if the news exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    const newComment = new Comment({
      newsId,
      author,
      content
    });

    await newComment.save();
    
    res.status(201).json({
      message: 'Comment created successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment', error });
  }
};

// Update a comment
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { author, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    if (!author && !content) {
      return res.status(400).json({ message: 'At least one field (author or content) is required for update' });
    }

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Create update object with only the fields that are provided
    const updateData: { author?: string; content?: string } = {};
    if (author) updateData.author = author;
    if (content) updateData.content = content;

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Comment updated successfully',
      data: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Error updating comment', error });
  }
};

// Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const deletedComment = await Comment.findByIdAndDelete(id);
    
    if (!deletedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(200).json({
      message: 'Comment deleted successfully',
      data: deletedComment
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error });
  }
};
