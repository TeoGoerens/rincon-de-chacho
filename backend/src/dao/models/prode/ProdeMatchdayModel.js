import mongoose from "mongoose";

/* -------- Challenge -------- */
const challengeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["GDT", "ARG", "MISC"],
      required: true,
    },
    scoreA: { type: Number, required: true },
    scoreB: { type: Number, required: true },
    result: {
      type: String,
      enum: ["A", "B", "draw"],
      required: true,
    },
  },
  { _id: false },
);

/* -------- Duel -------- */
const duelSchema = new mongoose.Schema(
  {
    playerA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      required: true,
    },
    playerB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      required: true,
    },
    challenges: {
      type: [challengeSchema],
      required: true,
    },
    duelResult: {
      type: String,
      enum: ["A", "B", "draw"],
      required: true,
    },
    points: {
      playerA: { type: Number, required: true },
      playerB: { type: Number, required: true },
      bonusA: { type: Number, default: 0 },
      bonusB: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

/* -------- Matchday -------- */
const prodeMatchdaySchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdeTournament",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    roundNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "played"],
      default: "scheduled",
    },
    duels: {
      type: [duelSchema],
      required: true,
    },
  },
  { timestamps: true },
);

const ProdeMatchday = mongoose.model("ProdeMatchday", prodeMatchdaySchema);
export default ProdeMatchday;
