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

export const createInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { declaracion, entrevistadoId, entrevistadoData } = req.body;

    // Validación básica
    if (!declaracion) {
      return next(customError(400, 'La declaración es obligatoria.'));
    }

    let entrevistado;

    // Caso 1: Crear nuevo entrevistado
    if (entrevistadoData) {
      if (!entrevistadoData.name || !entrevistadoData.cedula) {
        return next(customError(400, 'Datos incompletos para el entrevistado.'));
      }

      entrevistado = new InvolvedPerson(entrevistadoData);
      await entrevistado.save();

      // Caso 2: Usar entrevistado existente
    } else if (entrevistadoId) {
      entrevistado = await InvolvedPerson.findById(entrevistadoId);
      if (!entrevistado) {
        return next(customError(400, 'Entrevistado no encontrado.'));
      }

      // Error si no hay datos válidos
    } else {
      return next(customError(400, 'Se requiere un ID de entrevistado o datos para crear uno nuevo.'));
    }

    // Crear la entrevista
    const newInterview = new Interview({
      declaracion,
      entrevistado: entrevistado._id,
    });

    await newInterview.save();

    // Respuesta exitosa
    res.status(201).json({
      interview: newInterview,
      interviewee: entrevistado,
      message: entrevistadoData ? 'Entrevistado y entrevista creados' : 'Entrevista creada',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in postInterviews controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const updateInterviews = async (req: Request, res: Response) => {
  try {
    const interviewId = req.params.id;
    const updateData = req.body;
    // Buscar y actualizar la entrevista
    const updatedInterview = await Interview.findByIdAndUpdate(
      interviewId,
      updateData,
      { new: true }, // Devuelve el documento actualizado
    ).populate('entrevistado');

    if (!updatedInterview) {
      return res.status(404).json({ error: 'Entrevista no encontrada' });
    }

    // Respuesta exitosa
    res.status(200).json(updatedInterview);
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in updateInterviews controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};


export const deleteInterviews = async (req: Request, res: Response) => {
  try {
    //indentificar el ID
    const interviewId  = req.params.id;
    //buscar y eliminar id de usuario
    const deletedInterview  = await Interview.findByIdAndDelete(interviewId);

    if (!deletedInterview) {
      return res.status(404).json({ error: 'Entrevista  no encontrada.' });
    }
    //Respuesta correcta
    res.status(200).json({
      message: 'Usuario eliminado exitosamente',
      interview: deletedInterview,
    });

  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};
