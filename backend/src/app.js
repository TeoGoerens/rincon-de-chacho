// ---------- GENERAL IMPORTS & CONFIGURATIONS ----------
import express from "express";
const app = express();

import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
app.use(cors());

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));

import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------- ROUTER CONFIGURATION ----------
import userRouter from "./routes/userRouter.js";
import playerRouter from "./routes/chachos/playerRouter.js";
import tournamentRouter from "./routes/chachos/tournamentRouter.js";
import footballCategoryRouter from "./routes/chachos/footballCategoryRouter.js";
import rivalTeamRouter from "./routes/chachos/rivalTeamRouter.js";
import tournamentRoundRouter from "./routes/chachos/tournamentRoundRouter.js";
import voteRouter from "./routes/chachos/voteRouter.js";
import matchStatRouter from "./routes/chachos/matchStatRouter.js";
import cronicaRouter from "./routes/cronica/cronicaRouter.js";
import cronicaCommentRouter from "./routes/cronica/cronicaCommentRouter.js";

//Ruta users
app.use("/api/users", userRouter);

//Ruta chachos
app.use("/api/chachos/player", playerRouter);
app.use("/api/chachos/tournament", tournamentRouter);
app.use("/api/chachos/football-category", footballCategoryRouter);
app.use("/api/chachos/rival-team", rivalTeamRouter);
app.use("/api/chachos/tournament-round", tournamentRoundRouter);
app.use("/api/chachos/vote", voteRouter);
app.use("/api/chachos/match-stat", matchStatRouter);

//Ruta cronica
app.use("/api/cronica", cronicaRouter);
app.use("/api/cronica/comment", cronicaCommentRouter);

// Configuracion archivos estaticos
if (process.env.npm_lifecycle_event === "start") {
  app.use(express.static(join(__dirname, "../../frontend/build")));
}

// Ruta principal
app.get("*", (req, res) => {
  const indexPath = join(__dirname, "../../frontend/build/index.html");
  res.sendFile(indexPath);
});

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
