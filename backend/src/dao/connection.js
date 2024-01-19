import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const initMongoDB = async () => {
  try {
    const isDev = process.env.npm_lifecycle_event === "dev";
    const MONGO_ATLAS_URL = isDev
      ? process.env.MONGO_ATLAS_URL_DEV
      : process.env.MONGO_ATLAS_URL_PROD;

    await mongoose.connect(MONGO_ATLAS_URL);
    console.log("Connected to Mongo DB");
  } catch (error) {
    console.log(`An error occured => ${error}`);
  }
};

export default initMongoDB;
