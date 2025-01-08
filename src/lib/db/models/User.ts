import mongoose from "mongoose";

// Define a schema
const userSchema = new mongoose.Schema({
  id: String,
  email: String,
  username: String,
  password: String,
  settings: Object,
  newsWantedWords: Array,
  notificationEmail: String,
  notifications: [
    {
      id: String,
      title: String,
      description: String,
      url: String,
      news_id: mongoose.Schema.Types.ObjectId,
      notification_to: String,
      notification_type: String,
      sended_at: Date,
      viewed: Boolean,
      words_detected: Array,
    },
  ],
});

// export const User = mongoose.model("User", userSchema);
