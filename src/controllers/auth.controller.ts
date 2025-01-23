import { NextFunction, Request, Response } from 'express';
import User from '../lib/db/models/user.model';
import generateTokenAndSetCookie from '../utils/generateToken';
import { customError } from '../utils/customError';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  console.log(req.body);
  try {
    const { username, email, password, role, isActive } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('El usuario ya existe:', email);
      return next(customError(400, 'El correo electrónico ya está registrado.'));
    }

    const newUser = new User({
      username,
      email,
      password,
      role,
      isActive,
    });
    console.log('Usuario a guardar:', newUser);

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      });
    }

  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in register controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const validUser = await User.findOne({ email });
    if (!validUser) {
      return next(customError(400, 'Correo inválido.'));
    }

    const validPassword = await validUser.comparePassword(password);
    if (!validPassword) {
      return next(customError(400, 'Contraseña inválida.'));
    }

    generateTokenAndSetCookie(validUser._id, res);

    res.status(201).json({
      _id: validUser.id,
      email: validUser.email,
      role: validUser.role,
      isActive: validUser.isActive,
    });

  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in login controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const logout = (req: Request, res: Response) => {
  try {
    res.cookie('jwt', '', {
      maxAge: 0,
    });
    res.status(201).json({ message: 'Logged out sucessfully' });

  } catch (error) {
    if (error instanceof Error) {
      console.log('Error in logout controller', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};