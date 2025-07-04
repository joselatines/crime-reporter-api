import { Request, Response, NextFunction } from 'express';
import Ocr from '../lib/db/models/ocr.model';
import User from '../lib/db/models/user.model';

export const createOcr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, user_id } = req.body;
    if (!req.file || !text || !user_id) {
      return res.status(400).json({ message: 'Los campos image, text y user_id son obligatorios.' });
    }

    const existingUser = await User.findById(user_id);
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const newOcr = new Ocr({ img, text, user_id });
    await newOcr.save();
    res.status(201).json(newOcr);
  } catch (error) {
    next(error);
  }
};

export const getAllOcrs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ocrs = await Ocr.find().populate('user_id', 'user_id');
    res.status(200).json(ocrs);
  } catch (error) {
    next(error);
  }
};

export const getOcrById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ocr = await Ocr.findById(req.params.id).populate('user_id', 'user_id');
    if (!ocr) {
      return res.status(404).json({ message: 'Ocr not found' });
    }
    res.status(200).json(ocr);
  } catch (error) {
    next(error);
  }
};

export const updateOcr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, user_id } = req.body;
    let img;
    if (req.file) {
      img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const existingUser = await User.findById(user_id);
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const updateData: { text: string, user_id: string, img?: string } = { text, user_id };
    if (img) {
      updateData.img = img;
    }

    if (!text || !user_id) {
      return res.status(400).json({ message: 'Los campos text y user_id son obligatorios.' });
    }

    const updatedOcr = await Ocr.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedOcr) {
      return res.status(404).json({ message: 'Ocr not found' });
    }
    res.status(200).json(updatedOcr);
  } catch (error) {
    next(error);
  }
};

export const deleteOcr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deletedOcr = await Ocr.findByIdAndDelete(req.params.id);
    if (!deletedOcr) {
      return res.status(404).json({ message: 'Ocr not found' });
    }
    res.status(200).json({ message: 'Ocr deleted successfully' });
  } catch (error) {
    next(error);
  }
};
