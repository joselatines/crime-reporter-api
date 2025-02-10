import express from 'express';
import { getPoliceReport, postPoliceReport } from '../controllers/policeReport.controller';

const router = express.Router();

router.get('/', getPoliceReport);

router.post('/', postPoliceReport);


export default router;