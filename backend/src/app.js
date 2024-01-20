// ---------- GENERAL IMPORTS & CONFIGURATIONS ----------
import express from "express";
const app = express();

import cors from "cors";
app.use(cors());

import dotenv from "dotenv";
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- MONGO DB SET UP & CONNECTION ----------
import initMongoDB from "./dao/connection.js";
initMongoDB();

// ---------- ROUTER CONFIGURATION ----------
import userRouter from "./routes/userRouter.js";
import playerRouter from "./routes/chachos/playerRouter.js";
import tournamentRouter from "./routes/chachos/tournamentRouter.js";
import footballCategoryRouter from "./routes/chachos/footballCategoryRouter.js";
import rivalTeamRouter from "./routes/chachos/rivalTeamRouter.js";
import tournamentRoundRouter from "./routes/chachos/tournamentRoundRouter.js";
import voteRouter from "./routes/chachos/voteRouter.js";
app.use("/api/users", userRouter);
app.use("/api/chachos/player", playerRouter);
app.use("/api/chachos/tournament", tournamentRouter);
app.use("/api/chachos/football-category", footballCategoryRouter);
app.use("/api/chachos/rival-team", rivalTeamRouter);
app.use("/api/chachos/tournament-round", tournamentRoundRouter);
app.use("/api/chachos/vote", voteRouter);

// ---------- ERROR MIDDLEWARE CONFIGURATIONS ----------
import errorHandler from "./middlewares/error/errorHandler.js";
import routingErrorHandler from "./middlewares/error/errorRouting.js";
app.use(routingErrorHandler);
app.use(errorHandler);

// ---------- PORT CONFIGURATION & SET UP ----------
const PORT = parseInt(process.env.PORT, 10) || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
