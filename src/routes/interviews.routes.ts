import express from 'express';
import { getInterviews, createInterview, updateInterviews, deleteInterviews } from '../controllers/interviews.controller';

const router = express.Router();

router.get('/', getInterviews);

router.post('/', createInterview);

router.put('/:id', updateInterviews);

router.delete('/:id', deleteInterviews);


export default router;