import express from 'express';
import { getInterviews, createInterview } from '../controllers/interviews.controller';

const router = express.Router();

router.get('/', getInterviews);

router.post('/', createInterview);


export default router;