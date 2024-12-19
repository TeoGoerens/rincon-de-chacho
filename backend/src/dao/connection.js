import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const initMongoDB = async () => {
  const isDev = process.env.npm_lifecycle_event === "dev";
  const MONGO_ATLAS_URL = isDev
    ? process.env.MONGO_ATLAS_URL_DEV
    : process.env.MONGO_ATLAS_URL_PROD;

  try {
    // Configuración avanzada de conexión con timeouts incrementados
    await mongoose.connect(`${MONGO_ATLAS_URL}/app`, {
      serverSelectionTimeoutMS: 30000, // Tiempo máximo para seleccionar un servidor
      connectTimeoutMS: 30000, // Tiempo máximo para conectar
      socketTimeoutMS: 30000, // Tiempo máximo de inactividad del socket
    });

    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error; // Permite manejar este error donde sea llamado
  }
};
