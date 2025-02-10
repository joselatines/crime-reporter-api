import { NextFunction, Request, Response } from 'express';
import { customError } from '../utils/customError';
import InvolvedPerson from '../lib/db/models/involvedPerson.model';
import PoliceReport from '../lib/db/models/policeReport.model';

export const getPoliceReport = async (req: Request, res: Response) => {
  try {
    // Obtener todas los reportes y poblar los datos del entrevistado
    const policeReports = await PoliceReport.find().populate('involvedPeople');

    // Enviar la respuesta con los reportes
    res.status(200).json(policeReports);
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in getPoliceReport controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const postPoliceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, description, time, securityMeasures, observations, involvedPeople, evidenceItems } = req.body;

    // Validar que se proporcionen los datos necesarios
    if (!location || !description || !time || !securityMeasures || !observations || !involvedPeople || !evidenceItems) {
      return next(customError(400, 'Faltan campos obligatorios.'));
    }

    // Verificar que las personas involucradas existan
    const peopleExist = await InvolvedPerson.find({ _id: { $in: involvedPeople } });
    if (!peopleExist.length !== involvedPeople.length) {
      return next(customError(400, 'Una o más personas involucradas no existen.'));
    }

    // Crear y guardar el nuevo reporte policial
    const newPoliceReports = new PoliceReport({
      location,
      description,
      time,
      securityMeasures,
      observations,
      involvedPeople,
      evidenceItems,
    });

    await newPoliceReports.save();

    // Enviar la respuesta con la entrevista creada
    res.status(201).json(newPoliceReports);
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in postPoliceReport controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};