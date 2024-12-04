import mongoose from "mongoose";
import { mongoConnection } from "../../connection.js";

const podridaPlayerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
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

const PodridaPlayer = mongoConnection.model(
  "Podrida Player",
  podridaPlayerSchema
);
export default PodridaPlayer;
