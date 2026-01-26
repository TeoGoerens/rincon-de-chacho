import mongoose from "mongoose";

const monthlyWinnersSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
    },
    winnerPlayerIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "ProdePlayer",
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: "winnerPlayerIds must have exactly 4 players",
      },
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const prodeTournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    months: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "finished"],
      default: "draft",
    },
    champion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
    },
    lastPlace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
    },
    monthlyWinners: {
      type: [monthlyWinnersSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const ProdeTournament = mongoose.model(
  "ProdeTournament",
  prodeTournamentSchema,
);

export default ProdeTournament;
