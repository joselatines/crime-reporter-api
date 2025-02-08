import { NextFunction, Request, Response } from 'express';
import { customError } from '../utils/customError';
import Interview from '../lib/db/models/interview.model';
import InvolvedPerson from '../lib/db/models/involvedPerson.model';

export const getInterviews = async (req: Request, res: Response) => {
  try {
    // Obtener todas las entrevistas y poblar los datos del entrevistado
    const interviews = await Interview.find().populate('entrevistado');

    // Enviar la respuesta con las entrevistas
    res.status(200).json(interviews);
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in getInterviews controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const postInterviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { declaracion, entrevistadoId } = req.body;

    // Validar que se proporcionen los datos necesarios
    if (!declaracion || !entrevistadoId) {
      return next(customError(400, 'Faltan campos obligatorios.'));
    }

    const entrevistado = await InvolvedPerson.findById(entrevistadoId);
    if (!entrevistado) {
      return next(customError(400, 'Entrevistado no encontrado.'));
    }

    const newInterview = new Interview({
      declaracion,
      entrevistado: entrevistadoId,
    });

    await newInterview.save();

    // Enviar la respuesta con la entrevista creada
    res.status(201).json(newInterview);
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in postInterviews controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};