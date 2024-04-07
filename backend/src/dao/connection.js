import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const initMongoDB = () => {
  try {
    const isDev = process.env.npm_lifecycle_event === "dev";
    const MONGO_ATLAS_URL = isDev
      ? process.env.MONGO_ATLAS_URL_DEV
      : process.env.MONGO_ATLAS_URL_PROD;

    const dbUsers = mongoose.createConnection(`${MONGO_ATLAS_URL}/users?`);
    const dbChachos = mongoose.createConnection(`${MONGO_ATLAS_URL}/chachos?`);
    const dbPodrida = mongoose.createConnection(`${MONGO_ATLAS_URL}/podrida?`);
    console.log("Connected to Mongo DBs");

    return { dbUsers, dbChachos, dbPodrida };
  } catch (error) {
    console.log(`An error occured => ${error}`);
  }
};

export const mongoConnections = await initMongoDB();
