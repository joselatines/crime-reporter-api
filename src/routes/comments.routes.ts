import express from 'express';
import {
  getAllComments,
  getCommentById,
  getCommentsByNewsId,
  createComment,
  updateComment,
  deleteComment
} from '../controllers/comments.controller';

const router = express.Router();

// Get all comments
router.get('/', getAllComments);

// Get comments for a specific news item
router.get('/news/:newsId', getCommentsByNewsId);

// Get a specific comment by ID
router.get('/:id', getCommentById);

// Create a new comment
router.post('/', createComment);

// Update a comment
router.put('/:id', updateComment);

// Delete a comment
router.delete('/:id', deleteComment);

export default router;
