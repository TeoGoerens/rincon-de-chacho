import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const initMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_ATLAS_URL);
    console.log("Connected to Mongo DB");
  } catch (error) {
    console.log(`An error occured => ${error}`);
  }
};

export default initMongoDB;
