import { IUser } from '../models/User'; // Asegúrate de importar la interfaz correcta
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Añade la propiedad personalizada
    }
  }
}