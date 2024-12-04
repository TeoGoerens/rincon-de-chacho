import mongoose from "mongoose";
import { mongoConnection } from "../../connection.js";

const rivalTeamSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png",
    },
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

const RivalTeam = mongoConnection.model("Rival Team", rivalTeamSchema);
export default RivalTeam;
