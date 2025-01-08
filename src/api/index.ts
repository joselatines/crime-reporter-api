import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import scrapings from './scrapings';
import news from './news';

import authRoutes from '../routes/auth.routes';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/emojis', emojis);
router.use('/scrapings', scrapings);
router.use('/news', news);
router.use('/auth', authRoutes);



export default router;
