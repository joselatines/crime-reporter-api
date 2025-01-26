import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
    newsId: mongoose.Schema.Types.ObjectId;
    author: string;
    content: string;
    createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
    newsId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "News" },
    author: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);