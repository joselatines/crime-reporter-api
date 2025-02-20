import express from 'express';
import { getInterviews, createInterview, updateInterviews, deleteInterviews } from '../controllers/interviews.controller';
/* import { protectRoute } from '../middlewares'; */

const router = express.Router();

// Colocar protectRoute al terminar el desarrollo

router.get('/', getInterviews);

router.post('/', createInterview);

router.put('/:id', updateInterviews);

router.delete('/:id', deleteInterviews);


export default router;