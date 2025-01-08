import { NextFunction, Request, Response } from "express";
import User from "../lib/db/models/user.model";
import { customError } from "../utils/customError";

export const getNotifications = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { userId } = req.params;

		if (!userId) {
			return next(customError(400, "User ID is required."));
		}

		const user = await User.findById(userId);

		if (!user) {
			return next(customError(404, "User not found."));
		}

		res.status(200).json({
			data: user.notifications,
			message: "Notifications fetched successfully",
			success: true,
		});
	} catch (error) {
		if (error instanceof Error) {
			console.log("Error in getNotifications controller", error.message);
			res
				.status(500)
				.json({
					error: error.message,
					success: false,
					message: "Internal Server Error",
				});
		}
	}
};