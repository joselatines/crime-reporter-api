import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import * as middlewares from './middlewares';
import api from './api';
import MessageResponse from './interfaces/MessageResponse';

const app = express();
dotenv.config();

/* const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://crime-reporter-lime.vercel.app'] // Producción
  : ['http://localhost:4200'];     // Desarrollo
 */
const allowedOrigins = [
  'http://localhost:4200',
  'https://crime-reporter-lime.vercel.ap', // Agregar dominio exacto del frontend en producción
];

app.use(morgan('dev'));
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost'))) {
      callback(null, true);
    } else {
      callback(new Error('Origen bloqueado'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control'],
  credentials: true,
  optionsSuccessStatus: 200, 
}));
/* app.use(cors({
  origin: 'https://crime-reporter-lime.vercel.app', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control'],
  credentials: true,
})); */
app.use(cookieParser());
app.use(express.json());

app.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});

app.use('/api/v1', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
