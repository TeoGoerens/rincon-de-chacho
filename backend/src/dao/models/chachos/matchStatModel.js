import mongoose from "mongoose";

const matchStatSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament Round",
    },
    goals: {
      type: Number,
      required: true,
      default: 0,
    },
    assists: {
      type: Number,
      required: true,
      default: 0,
    },
    yellow_cards: {
      type: Number,
      required: true,
      default: 0,
    },
    red_cards: {
      type: Number,
      required: true,
      default: 0,
    },
    penalty_saved: {
      type: Number,
      required: true,
      default: 0,
    },
    white_pearl: {
      type: Number,
      required: true,
      default: 0,
    },
    vanilla_pearl: {
      type: Number,
      required: true,
      default: 0,
    },
    ocher_pearl: {
      type: Number,
      required: true,
      default: 0,
    },
    black_pearl: {
      type: Number,
      required: true,
      default: 0,
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

const MatchStat = mongoose.model("Match Stat", matchStatSchema);
export default MatchStat;
