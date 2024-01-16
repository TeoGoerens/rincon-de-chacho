// ---------- GENERAL IMPORTS & CONFIGURATIONS ----------
import express from "express";
const app = express();

import cors from "cors";
app.use(cors());

import dotenv from "dotenv";
dotenv.config();

// ---------- MONGO DB SET UP & CONNECTION ----------
import initMongoDB from "./dao/connection.js";
initMongoDB();

// ---------- ROUTER CONFIGURATION ----------
import userRouter from "./routes/userRouter.js";
import playerRouter from "./routes/chachos/playerRouter.js";
app.use("/api/users", userRouter);
app.use("/api/chachos/player", playerRouter);

// ---------- MIDDLEWARE CONFIGURATIONS ----------
import errorHandler from "./middlewares/errorHandler.js";
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorHandler);

// ---------- PORT CONFIGURATION & SET UP ----------
const PORT = parseInt(process.env.PORT, 10) || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
