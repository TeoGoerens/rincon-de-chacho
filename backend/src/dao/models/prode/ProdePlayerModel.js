import mongoose from "mongoose";

const prodePlayerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const ProdePlayer = mongoose.model("ProdePlayer", prodePlayerSchema);
export default ProdePlayer;
