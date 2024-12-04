import mongoose from "mongoose";
import { mongoConnection } from "../../connection.js";

const playerSchema = new mongoose.Schema(
  {
    shirt: {
      type: Number,
      required: true,
    },
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    field_position: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["team", "extra", "supporter"],
      required: true,
    },
    bio: { type: String },
    interview: { type: String },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  }
);

const Player = mongoConnection.model("Player", playerSchema);
export default Player;
