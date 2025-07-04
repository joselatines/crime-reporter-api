import mongoose from "mongoose";

const ocrSchema = new mongoose.Schema({
	img: {
		type: String,
		required: true,
	},
	text: {
		type: String,
		required: true,
	},
	user_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
}, { timestamps: true });

const Ocr = mongoose.model("Ocr", ocrSchema);

export default Ocr;
