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
router.get("/player/:id", authMiddleware, controller.getPodridaPlayerById);
router.get("/player", authMiddleware, controller.getAllPodridaPlayers);
router.put(
  "/player/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.updatePodridaPlayer
);
router.delete(
  "/player/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.deletePodridaPlayer
);

// ---------- MATCHES ----------
router.post(
  "/match",
  authMiddleware,
  adminAuthMiddleware,
  controller.createPodridaMatch
);
router.get("/match/all", authMiddleware, controller.getAllPodridaMatches);
router.get("/match/last", authMiddleware, controller.getLastPodridaMatch);
router.get("/match/:id", authMiddleware, controller.getPodridaMatchById);
router.get("/match/year/:year", authMiddleware, controller.getMatchesByYear);
router.delete(
  "/match/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.deletePodridaMatch
);
router.put(
  "/match/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.updatePodridaMatch
);

// ---------- RECORDS ----------
router.get("/records", authMiddleware, controller.getPodridaRecords);

// ---------- RANKING ----------
router.get("/ranking", authMiddleware, controller.getRanking);

export default router;
