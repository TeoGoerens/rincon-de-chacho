// ---------- GENERAL IMPORTS & CONFIGURATIONS ----------
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { initMongoDB } from "./dao/connection.js";
import errorHandler from "./middlewares/error/errorHandler.js";
import routingErrorHandler from "./middlewares/error/errorRouting.js";

dotenv.config();
const app = express();

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

// ---------- FUNCION DE INICIO DEL SERVIDOR ----------
const startServer = async () => {
  try {
    // Inicializar conexión a MongoDB
    await initMongoDB();
    console.log("✅ MongoDB connected successfully");

    // ---------- CONFIGURAR RUTAS ----------
    app.use("/api/users", userRouter);
    app.use("/api/chachos/player", playerRouter);
    app.use("/api/chachos/tournament", tournamentRouter);
    app.use("/api/chachos/football-category", footballCategoryRouter);
    app.use("/api/chachos/rival-team", rivalTeamRouter);
    app.use("/api/chachos/tournament-round", tournamentRoundRouter);
    app.use("/api/chachos/vote", voteRouter);
    app.use("/api/chachos/match-stat", matchStatRouter);
    app.use("/api/cronica", cronicaRouter);
    app.use("/api/cronica/comment", cronicaCommentRouter);

    // Configuración de archivos estáticos
    if (process.env.npm_lifecycle_event === "start") {
      app.use(express.static(join(__dirname, "../../frontend/build")));
    }

    // Ruta principal para servir el frontend en producción
    app.get("*", (req, res) => {
      const indexPath = join(__dirname, "../../frontend/build/index.html");
      res.sendFile(indexPath);
    });

    // ---------- ERROR MIDDLEWARE CONFIGURATIONS ----------
    app.use(routingErrorHandler);
    app.use(errorHandler);

    // ---------- PUERTO Y LEVANTAR SERVIDOR ----------
    const PORT = parseInt(process.env.PORT, 10) || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error starting the server:", error.message);
    process.exit(1); // Detener el proceso si hay un error crítico
  }
};

// Llamar a la función para iniciar el servidor
startServer();
