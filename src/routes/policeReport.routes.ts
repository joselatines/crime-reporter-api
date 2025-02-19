import express from 'express';
import { getPoliceReport, createPoliceReport, updatePoliceReport, deletePoliceReport } from '../controllers/policeReport.controller';
import { protectRoute } from '../middlewares';

const router = express.Router();

router.get('/', protectRoute, getPoliceReport);

router.post('/', protectRoute, createPoliceReport);

router.put('/:id', protectRoute, updatePoliceReport);

router.delete('/:id', protectRoute, deletePoliceReport);


export default router;