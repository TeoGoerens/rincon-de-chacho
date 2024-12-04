import mongoose from "mongoose";
import { mongoConnection } from "../../connection.js";

const footballCategorySchema = new mongoose.Schema(
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

const FootballCategory = mongoConnection.model(
  "Football Category",
  footballCategorySchema
);
export default FootballCategory;
