import { Router } from 'express';
import {
  createOcr,
  getAllOcrs,
  getOcrById,
  updateOcr,
  deleteOcr,
} from '../controllers/ocr.controller';
import upload from '../lib/multer';

const router = Router();

router.post('/', upload.single('image'), createOcr);
router.get('/', getAllOcrs);
router.get('/:id', getOcrById);
router.put('/:id', upload.single('image'), updateOcr);
router.delete('/:id', deleteOcr);

export default router;
