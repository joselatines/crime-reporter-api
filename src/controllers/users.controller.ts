import { NextFunction, Request, Response } from 'express';
import User from '../lib/db/models/user.model';
import generateTokenAndSetCookie from '../utils/generateToken';
import { customError } from '../utils/customError';

export const getUsers = async (req: Request, res: Response) => {
  try {
    // Consulta para obtener todos los usuarios
    const users = await User.find().select('-password');

    // Devuelve los usuarios en la respuesta
    res.status(200).json({
      message: 'Usuarios obtenidos exitosamente',
      users,
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};


export const getUserById = async (req: Request, res: Response) => {
  try {
    // Completar

  } catch (error) {
    console.error('Error al obtener al usuario:', error);
    res.status(500).json({ error: 'Error al obtener al usuario' });
  }
};


export const createUser = async (req: Request, res: Response) => {
  try {
    // Completar

  } catch (error) {
    console.error('Error al crear al usuario:', error);
    res.status(500).json({ error: 'Error al crear al usuario' });
  }
};


export const updateUser = async (req: Request, res: Response) => {
  try {
    // Completar

  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};


export const deleteUser = async (req: Request, res: Response) => {
  try {
    // Completar

  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};
