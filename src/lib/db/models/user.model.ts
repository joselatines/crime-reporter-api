import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'detective';
  isActive: boolean;
  settings: {
    language: string;
    timezone: string;
    preferredRegions: string[];
  };
  newsWantedWords: string[];
  notificationEmail: string;
  notifications: {
    id: string;
    title: string;
    description: string;
    url: string;
    news_id: mongoose.Schema.Types.ObjectId;
    notification_to: string;
    notification_type: string;
    sended_at: Date;
    viewed: boolean;
    words_detected: string[];
    crimeType: string[]
  }[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> { }

const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: {
    type: String,
    enum: ['admin', 'detective'],
    default: 'detective',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    language: {
      type: String,
      default: 'es'
    },
    timezone: {
      type: String,
      default: 'America/Caracas'
    },
    preferredRegions: {
      type: [String],
      default: []
    }
  },
  newsWantedWords: {
    type: [String],
    default: [], // Default to an empty array
  },
  notificationEmail: {
    type: String,
  },
  notifications: {
    type: [
      {
        id: String,
        title: String,
        description: String,
        url: String,
        news_id: mongoose.Schema.Types.ObjectId,
        notification_to: String,
        notification_type: String,
        crimeType: [String],
        sended_at: Date,
        viewed: Boolean,
        words_detected: [String], // Array of detected words
      },
    ],
    default: [], // Default to an empty array
  },
}, { timestamps: true });

// Middleware para hashear la contraseña antes de guardar el usuario
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next(); // Si la contraseña no ha cambiado, no la rehasheamos
  }

  try {
    const salt = await bcrypt.genSalt(10); // Genera el "salt"
    this.password = await bcrypt.hash(this.password, salt); // Hashea la contraseña
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      next(error); // Si el error es una instancia de Error, lo pasamos al siguiente middleware
    } else {
      // Si no es un Error, lanzamos un error genérico
      next(new Error('An unknown error occurred while hashing the password'));
    }
  }
});

// Método para comparar contraseñas durante el login
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password || '');
};

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;