import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const generateTokenAndSetCookie = (userId: Types.ObjectId, res: Response) => {

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '15d',
  });

  res.cookie('jwt', token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Permite cross-site cookies
    /* sameSite: 'strict', */
    secure: process.env.NODE_ENV !== 'development', // Solo HTTPS en producción,
  });
};

export default generateTokenAndSetCookie;