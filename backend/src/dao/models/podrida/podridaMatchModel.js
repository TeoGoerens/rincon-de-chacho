import mongoose from "mongoose";

const playerResultSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PodridaPlayer",
      required: true,
    },
    score: { type: Number, required: true },
    position: { type: Number, required: true },
  },
  { _id: false }
);

const podridaMatchSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    players: { type: [playerResultSchema], required: true },
    highlight: {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PodridaPlayer",
        required: true,
      },
      score: { type: Number, required: true },
    },
    longestStreakOnTime: {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PodridaPlayer",
        required: true,
      },
      count: { type: Number, required: true },
    },
    longestStreakFailing: {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PodridaPlayer",
        required: true,
      },
      count: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

const PodridaMatch = mongoose.model("PodridaMatch", podridaMatchSchema);
export default PodridaMatch;
