import mongoose from "mongoose";

const podridaPlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, lowercase: true },
  },
  { timestamps: true }
);

const PodridaPlayer = mongoose.model("PodridaPlayer", podridaPlayerSchema);
export default PodridaPlayer;
