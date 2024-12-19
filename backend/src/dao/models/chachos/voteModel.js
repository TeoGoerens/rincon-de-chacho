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
    evaluation: [
      {
        player: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
        points: { type: Number, required: true },
      },
    ],
    white_pearl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    vanilla_pearl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    ocher_pearl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    black_pearl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
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
