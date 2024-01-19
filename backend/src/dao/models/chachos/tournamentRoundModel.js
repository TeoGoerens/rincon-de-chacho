import mongoose from "mongoose";

const tournamentRoundSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
    rival: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rival Team",
    },
    match_date: {
      type: Date,
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
    white_pearl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    vanilla_pearl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    ocher_pearl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    black_pearl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    open_for_vote: {
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

const TournamentRound = mongoose.model(
  "Tournament Round",
  tournamentRoundSchema
);
export default TournamentRound;
