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

export const createPoliceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, description, time, securityMeasures, observations, involvedPeople = [], evidenceItems = [], entrevistadoId, entrevistadoData } = req.body;

    // Validar que se proporcionen los datos necesarios
    if (!location || !description || !time || !securityMeasures || !observations) {
      return next(customError(400, 'Faltan campos obligatorios.'));
    }

    if (!entrevistadoId && !entrevistadoData) {
      return next(customError(400, 'Se requiere un ID de entrevistado o datos para crear uno nuevo.'));
    }


    let entrevistado;

    // Caso 1: Crear nuevo entrevistado
    if (entrevistadoData) {
      const { name, cedula, role, edad } = entrevistadoData;
      if (!name || !cedula || !role || !edad) {
        return next(customError(400, 'Datos incompletos para el entrevistado.'));
      }

      // Validar formato de cédula
      const cedulaRegex = /^[VvEe]-?\d{6,8}$/;
      if (!cedulaRegex.test(cedula)) {
        return next(customError(400, 'Formato de cédula inválido. Debe ser V-1234567 o E12345678.'));
      }

      entrevistado = new InvolvedPerson(entrevistadoData);
      await entrevistado.save();
    } else { // Caso 2: Usar entrevistado existente
      entrevistado = await InvolvedPerson.findById(entrevistadoId);
      if (!entrevistado) {
        return next(customError(400, 'Entrevistado no encontrado.'));
      }
    }

    // Crear y guardar el nuevo reporte policial
    const newPoliceReport = new PoliceReport({
      location,
      description,
      time,
      securityMeasures,
      observations,
      involvedPeople: [...(involvedPeople || []), entrevistado._id], // Agrega el entrevistado sin borrar otros IDs
      evidenceItems,
    });

    await newPoliceReport.save();

    res.status(201).json({
      report: newPoliceReport,
      entrevistado,
      message: entrevistadoData ? 'Entrevistado y reporte creados' : 'Reporte creado',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in createPoliceReport controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const updatePoliceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policeReportId = req.params.id;
    const { location, description, time, securityMeasures, observations, involvedPeople, evidenceItems } = req.body;

    const policeReport = await PoliceReport.findById(policeReportId);
    if (!policeReport) {
      return next(customError(400, 'Reporte no encontrado.'));
    }

    // Verificar si los IDs de involvedPeople existen en la base de datos
    if (involvedPeople && involvedPeople.length > 0) {
      const existingPeople = await InvolvedPerson.find({ _id: { $in: involvedPeople } });
      if (existingPeople.length !== involvedPeople.length) {
        return next(customError(400, 'Uno o más involucrados no existen en la base de datos.'));
      }
    }

    // Actualizar el reporte policial con la nueva información
    const updatedReport = await PoliceReport.findByIdAndUpdate(
      policeReportId,
      {
        location,
        description,
        time,
        securityMeasures,
        observations,
        involvedPeople, // Se actualiza con los nuevos IDs
        evidenceItems,
      },
      { new: true },
    ).populate('involvedPeople');

    res.status(200).json({
      message: 'Reporte policial actualizado correctamente',
      data: updatedReport,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in updatePoliceReport controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const deletePoliceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policeReportId = req.params.id;

    const deletedPoliceReport = await PoliceReport.findByIdAndDelete(policeReportId);
    if (!deletedPoliceReport) {
      return next(customError(400, 'Reporte no encontrado.'));
    }

    //Respuesta correcta
    res.status(200).json({
      message: 'Reporte eliminado exitosamente',
      interview: deletedPoliceReport,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in updatePoliceReport controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};