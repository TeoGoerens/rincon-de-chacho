import { Router } from "express";
import PodridaController from "../../controllers/podrida/podridaController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new PodridaController();

// ---------- PLAYERS ----------
router.post(
  "/player",
  authMiddleware,
  adminAuthMiddleware,
  controller.createPodridaPlayer
);
router.get("/player", authMiddleware, controller.getAllPodridaPlayers);

// ---------- MATCHES ----------
router.post(
  "/match",
  authMiddleware,
  adminAuthMiddleware,
  controller.createPodridaMatch
);
router.get("/match/all", authMiddleware, controller.getAllPodridaMatches);
router.get("/match/last", authMiddleware, controller.getLastPodridaMatch);
router.get("/match/year/:year", authMiddleware, controller.getMatchesByYear);

// ---------- RECORDS ----------
router.get("/records", authMiddleware, controller.getPodridaRecords);

// ---------- RANKING ----------
router.get("/ranking", authMiddleware, controller.getRanking);

export default router;
