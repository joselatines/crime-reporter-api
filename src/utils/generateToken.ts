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
    /* sameSite: process.env.NODE_ENV === 'development' ? 'none' : 'strict', */ // Permite cross-site cookies
    sameSite: 'lax',
    /* sameSite: 'strict', */
    secure: false, // Solo HTTPS en producción,
    /* secure: process.env.NODE_ENV !== 'development', */
  });
};

export default generateTokenAndSetCookie;