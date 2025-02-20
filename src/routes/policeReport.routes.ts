import express from 'express';
import { getPoliceReport, createPoliceReport, updatePoliceReport, deletePoliceReport } from '../controllers/policeReport.controller';
/* import { protectRoute } from '../middlewares'; */

const router = express.Router();

// Colocar protectRoute al terminar el desarrollo

router.get('/', getPoliceReport);

router.post('/', createPoliceReport);

router.put('/:id', updatePoliceReport);

router.delete('/:id', deletePoliceReport);


export default router;