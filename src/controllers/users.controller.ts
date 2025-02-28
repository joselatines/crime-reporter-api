import { NextFunction, Request, Response } from 'express';
import User from '../lib/db/models/user.model';
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

export const getAuthenticatedUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('Usuario no autenticado.'));
    }

    // Consulta para obtener todos los usuarios
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    
    /* const user = await User.findById(userId).select('username email role newsWantedWords'); */

    if (!user) {
      return next(customError(404, 'Usuario no encontrado.'));
    }

    // Devuelve los usuarios en la respuesta
    res.status(200).json({
      message: 'Usuario obtenidos exitosamente',
      user: req.user,
    });

  } catch (error) {
    console.error('Error al obtener usuario autenticado:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};


export const getUserById = async (req: Request, res: Response) => {
  try {
    // Completar
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
   
    res.status(200).json({ message: 'Usuario obtenido exitosamente', user });
  } catch (error) {
    console.error('Error al obtener al usuario:', error);
    res.status(500).json({ error: 'Error al obtener al usuario' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    
    const user = await User.create(req.body);
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user,
    });

  } catch (error) {
    console.error('Error al crear al usuario:', error);
    res.status(500).json({ error: 'Error al crear al usuario' });
  }
};


export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id; 
    const updateData = req.body; 
    console.log({updateData})
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, 
      runValidators: true, 
    }).select('-password'); 
    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    });
   
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};



export const deleteUser = async (req: Request, res: Response) => {
  try {
    //indentificar el ID
    const userId = req.params.id;
    //buscar y eliminar id de usuario
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    //Respuesta correcta
    res.status(200).json({
      message: 'Usuario eliminado exitosamente',
      user: deletedUser,
    });

  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};
