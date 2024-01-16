import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament Round",
    },
    match_date: {
      type: Date,
      required: true,
    },
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

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
