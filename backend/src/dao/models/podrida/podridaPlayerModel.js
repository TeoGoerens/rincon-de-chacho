import mongoose from "mongoose";

const podridaPlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "El email no tiene un formato válido"],
    },
  },
  { timestamps: true }
);

const PodridaPlayer = mongoose.model("PodridaPlayer", podridaPlayerSchema);
export default PodridaPlayer;
