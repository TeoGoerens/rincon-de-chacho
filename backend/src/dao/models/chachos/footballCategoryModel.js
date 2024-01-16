import mongoose from "mongoose";

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

const FootballCategory = mongoose.model(
  "Football Category",
  footballCategorySchema
);
export default FootballCategory;
