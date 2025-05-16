import { required } from "joi";
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    //   senderId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     required: true,
    //     minLength: 24,
    //   },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      minLength: 24,
    },
    message: {
      type: mongoose.Schema.Types.String,
      required: true,
      minLength: 110,
      maxLength: 250,
      trim: true,
    },
    read: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
      required: true,
    },
    type: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Notification", NotificationSchema);
