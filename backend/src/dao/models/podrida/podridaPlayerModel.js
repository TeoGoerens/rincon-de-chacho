import mongoose from "mongoose";
import { mongoConnections } from "../../connection.js";
const { dbPodrida } = mongoConnections;

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

const PodridaPlayer = dbPodrida.model("Podrida Player", podridaPlayerSchema);
export default PodridaPlayer;
