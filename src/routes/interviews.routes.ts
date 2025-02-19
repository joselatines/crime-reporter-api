import express from 'express';
import { getInterviews, createInterview, updateInterviews, deleteInterviews } from '../controllers/interviews.controller';
import { protectRoute } from '../middlewares';

const router = express.Router();

router.get('/', protectRoute, getInterviews);

router.post('/', protectRoute, createInterview);

router.put('/:id', protectRoute, updateInterviews);

router.delete('/:id', protectRoute, deleteInterviews);


export default router;