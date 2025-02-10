import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import emojis from './emojis';
import scrapings from './scrapings';
import news from './news';
import settings from './settings';


import authRoutes from '../routes/auth.routes';
import usersRoutes from '../routes/users.routes';
import interviewsRoutes from '../routes/interviews.routes';
import policeReportRoutes from '../routes/policeReport.routes';

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
router.use('/settings', settings);
router.use('/users', usersRoutes);
router.use('/interviews', interviewsRoutes);
router.use('/report', policeReportRoutes);




export default router;
