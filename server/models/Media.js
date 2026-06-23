import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: 300,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["movie", "anime", "game"],
      required: true,
    },
    status: {
      type: String,
      enum: ["planning", "in-progress", "completed", "dropped"],
      default: "planning",
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
    isFavourite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Media = mongoose.model("Media", mediaSchema);

export default Media;
