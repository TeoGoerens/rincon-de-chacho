import mongoose from "mongoose";

const matchStatSchema = new mongoose.Schema(
  {
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament Round",
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    played: {
      type: Boolean,
      required: true,
      default: false,
    },
    points: {
      type: Number,
      default: null,
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
      type: Boolean,
      default: false,
    },
    vanilla_pearl: {
      type: Boolean,
      default: false,
    },
    ocher_pearl: {
      type: Boolean,
      default: false,
    },
    black_pearl: {
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

const MatchStat = mongoose.model("Match Stat", matchStatSchema);
export default MatchStat;
