import mongoose from "mongoose";

const rivalTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

const RivalTeam = mongoose.model("Rival Team", rivalTeamSchema);
export default RivalTeam;
