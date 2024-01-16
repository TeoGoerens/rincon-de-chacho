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
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],
    open_for_vote: {
      type: Boolean,
      default: true,
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
