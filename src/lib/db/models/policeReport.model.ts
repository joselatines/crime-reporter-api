import mongoose from 'mongoose';

const policeReportSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  securityMeasures: {
    type: String,
    required: true,
  },
  observations: {
    type: String,
    required: true,
  },
  involvedPeople: [{
    type: mongoose.Schema.Types.ObjectId, // Referencia a InvolvedPerson
    ref: 'InvolvedPerson', // Nombre del modelo referenciado
  }],
  evidenceItems: [{
    type: String,
  }],
  attachments: [{
    type: String,
  }],
});

const PoliceReport = mongoose.model('PoliceReport', policeReportSchema);

export default PoliceReport;