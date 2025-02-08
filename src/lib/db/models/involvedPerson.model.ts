import mongoose from 'mongoose';

const involvedPersonSchema = new mongoose.Schema({
  declaracion: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  cedula: {
    type: String,
    required: true,
    unique: true,
    match: /^[VvEe]-?\d{6,8}$/, // Formato: V-1234567 o E-12345678
  },
  role: {
    type: String,
    required: true,
    enum: ['testigo', 'sospechoso', 'víctima'], // Valores permitidos
  },
  edad: {
    type: Number,
    required: true,
    min: 0,
  },
  profesion: {
    type: String,
  },
}, { timestamps: true });

const InvolvedPerson = mongoose.model('InvolvedPerson', involvedPersonSchema);

export default InvolvedPerson;