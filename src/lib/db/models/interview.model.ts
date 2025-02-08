import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  declaracion: {
    type: String,
    required: true,
  },
  entrevistado: {
    type: mongoose.Schema.Types.ObjectId, // Referencia a InvolvedPerson
    ref: 'InvolvedPerson', // Nombre del modelo referenciado
    required: true, // El entrevistado es obligatorio
  },
});

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;