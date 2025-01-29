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
  'https://crime-reporter-lime.vercel.app', // Agregar dominio exacto del frontend en producción
];

app.use(morgan('dev'));
app.use(helmet());
app.use(cors({
  /* origin: function (origin, callback) {
    // bypass the requests with no origin (like curl requests, mobile apps, etc )
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }, */
  origin: 'https://crime-reporter-lime.vercel.app', 
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
