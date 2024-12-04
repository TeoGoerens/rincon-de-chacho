import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const initMongoDB = () => {
  try {
    const isDev = process.env.npm_lifecycle_event === "dev";
    const MONGO_ATLAS_URL = isDev
      ? process.env.MONGO_ATLAS_URL_DEV
      : process.env.MONGO_ATLAS_URL_PROD;

    const dbMongo = mongoose.createConnection(`${MONGO_ATLAS_URL}/app?`);
    /* const dbChachos = mongoose.createConnection(`${MONGO_ATLAS_URL}/chachos?`);
    const dbPodrida = mongoose.createConnection(`${MONGO_ATLAS_URL}/podrida?`);
    const dbCronicas = mongoose.createConnection(
      `${MONGO_ATLAS_URL}/cronicas?`
    ); */
    console.log("Connected to Mongo DBs");

    return dbMongo;
  } catch (error) {
    console.log(`An error occured => ${error}`);
  }
};

export const mongoConnection = await initMongoDB();
