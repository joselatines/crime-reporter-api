import { NextFunction, Request, Response } from "express";
import { customError } from "./utils/customError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { MulterError } from "multer";

import ErrorResponse from "./interfaces/ErrorResponse";
import User from "./lib/db/models/user.model";
import { Types } from "mongoose";

interface JwtPayloadWithUserId extends JwtPayload {
	userId: Types.ObjectId;
}

export function notFound(req: Request, res: Response, next: NextFunction) {
	res.status(404);
	const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
	next(error);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
	err: Error,
	req: Request,
	res: Response<ErrorResponse>,
	next: NextFunction
) {
	console.error(`⚠️ ${err}`);
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo es demasiado grande. El límite es de 5MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: `Campo inesperado. Asegúrese de que el campo del archivo se llame 'image'.` });
    }
    return res.status(400).json({ message: err.message });
  }
	const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
	res.status(statusCode);
	res.json({
		message: err.message,
		stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
	});
}

export const protectRoute = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Obtener el token desde las cookies

		/* const token = req.cookies.jwt; */
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			return next(customError(401, "Unauthorized - No Token Provided."));
		}

		if (!process.env.JWT_SECRET) {
			throw new Error("JWT_SECRET is not defined in the environment variables");
		}

		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET
		) as JwtPayloadWithUserId;

		if (!decoded) {
			return next(customError(401, "Unauthorized - Invalid Provided."));
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return next(customError(401, "Usuario no encontrado."));
		}

		console.log("Token recibido:", token);
		console.log("Decoded UserId:", decoded.userId);

		req.user = user;

		next();
	} catch (error) {
		if (error instanceof Error) {
			console.log("Error in protectRoute controller", error.message);
			res.status(500).json({ error: "Internal Server Error" });
		}
	}
};
