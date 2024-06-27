import mongoose from "mongoose";
import { mongoConnections } from "../../connection.js";
const { dbChachos } = mongoConnections;

const tournamentRoundSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Tournament",
    },
    rival: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Rival Team",
    },
    match_date: {
      type: Date,
      required: true,
      default: Date.now(),
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    score_chachos: {
      type: Number,
      required: true,
    },
    score_rival: {
      type: Number,
      required: true,
    },
    win: {
      type: Boolean,
      default: false,
    },
    draw: {
      type: Boolean,
      default: false,
    },
    defeat: {
      type: Boolean,
      default: false,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
    white_pearl: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        default: null,
      },
    ],
    vanilla_pearl: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        default: null,
      },
    ],
    ocher_pearl: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        default: null,
      },
    ],
    black_pearl: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        default: null,
      },
    ],
    open_for_vote: {
      type: Boolean,
      default: false,
    },
    complete_stats: {
      type: Boolean,
      default: false,
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

const TournamentRound = dbChachos.model(
  "Tournament Round",
  tournamentRoundSchema
);
export default TournamentRound;
