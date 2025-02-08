import express from 'express';
import { getInterviews, postInterviews } from '../controllers/interviews.controller';

const router = express.Router();

router.get('/', getInterviews);

router.post('/', postInterviews);


export default router;