import mongoose from "mongoose";
import { mongoConnections } from "../../connection.js";
const { dbChachos } = mongoConnections;

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
    email: {
      type: String,
      required: true,
    },
    nickname: { type: String },
    field_position: {
      type: String,
      required: true,
    },
    is_permanent: {
      type: Boolean,
      default: true,
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

const Player = dbChachos.model("Player", playerSchema);
export default Player;
