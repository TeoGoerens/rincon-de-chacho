import { Router } from "express";
import ProdePlayerController from "../../controllers/prode/prodePlayerController.js";
import ProdeTournamentController from "../../controllers/prode/prodeTournamentController.js";
import ProdeMatchdayController from "../../controllers/prode/prodeMatchdayController.js";
import ProdePredictionController from "../../controllers/prode/prodePredictionController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";
import prodeParticipantMiddleware from "../../middlewares/auth/prodeParticipantMiddleware.js";

const router = Router();
const playerController = new ProdePlayerController();
const tournamentController = new ProdeTournamentController();
const matchdayController = new ProdeMatchdayController();
const predictionController = new ProdePredictionController();

/* ---------- PLAYERS ---------- */
router.get(
  "/my-player",
  authMiddleware,
  playerController.getMyProdePlayer,
);
router.post(
  "/player",
  authMiddleware,
  adminAuthMiddleware,
  playerController.createProdePlayer,
);
router.get("/player", authMiddleware, playerController.getAllProdePlayers);
router.get(
  "/player/:id",
  authMiddleware,
  playerController.getProdePlayerById,
);
router.put(
  "/player/:id",
  authMiddleware,
  adminAuthMiddleware,
  playerController.updateProdePlayer,
);
router.delete(
  "/player/:id",
  authMiddleware,
  adminAuthMiddleware,
  playerController.deleteProdePlayer,
);

/* ---------- TOURNAMENTS ---------- */
router.post(
  "/tournament",
  authMiddleware,
  adminAuthMiddleware,
  tournamentController.createProdeTournament,
);
router.get(
  "/tournament",
  authMiddleware,
  tournamentController.getAllProdeTournaments,
);
router.get(
  "/tournament/:id",
  authMiddleware,
  tournamentController.getProdeTournamentById,
);
router.put(
  "/tournament/:id",
  authMiddleware,
  adminAuthMiddleware,
  tournamentController.updateProdeTournament,
);
router.delete(
  "/tournament/:id",
  authMiddleware,
  adminAuthMiddleware,
  tournamentController.deleteProdeTournament,
);

/* ---------- MATCHDAYS ---------- */
router.post(
  "/matchday",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.createProdeMatchday,
);
router.get(
  "/matchday/tournament/:tournamentId",
  authMiddleware,
  matchdayController.getMatchdaysByTournament,
);
router.get(
  "/matchday/:id",
  authMiddleware,
  matchdayController.getProdeMatchdayById,
);
router.put(
  "/matchday/:id",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.updateProdeMatchdayMeta,
);
router.put(
  "/matchday/:id/duels",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.setProdeMatchdayDuels,
);
router.put(
  "/matchday/:id/open",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.openProdeMatchday,
);
router.post(
  "/matchday/:id/items",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.addProdeMatchdayItem,
);
router.put(
  "/matchday/:id/items/:itemId",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.updateProdeMatchdayItem,
);
router.delete(
  "/matchday/:id/items/:itemId",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.deleteProdeMatchdayItem,
);
router.delete(
  "/matchday/:id",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.deleteProdeMatchday,
);
router.post(
  "/matchday/:id/notify-changes",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.notifyProdeMatchdayChanges,
);

router.put(
  "/matchday/:id/reopen",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.reopenProdeMatchday,
);
router.put(
  "/matchday/:id/items/:itemId/result",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.setProdeMatchdayItemResult,
);
router.put(
  "/matchday/:id/items/:itemId/annul",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.annulProdeMatchdayItem,
);
router.put(
  "/matchday/:id/items/:itemId/judge",
  authMiddleware,
  adminAuthMiddleware,
  predictionController.judgeProdeQuestion,
);
router.get(
  "/matchday/:id/predictions/all",
  authMiddleware,
  adminAuthMiddleware,
  predictionController.getMatchdayPredictionsAdmin,
);
router.get(
  "/matchday/:id/partials/all",
  authMiddleware,
  adminAuthMiddleware,
  predictionController.getMatchdayPartialsAdmin,
);
router.put(
  "/matchday/:id/consolidate",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.consolidateProdeMatchday,
);

/* ---------- PREDICTIONS (solo participantes) ---------- */
router.get(
  "/matchday/:id/my-prediction",
  authMiddleware,
  prodeParticipantMiddleware,
  predictionController.getMyPrediction,
);
router.put(
  "/matchday/:id/my-prediction",
  authMiddleware,
  prodeParticipantMiddleware,
  predictionController.upsertMyPrediction,
);
router.get(
  "/matchday/:id/predictions",
  authMiddleware,
  prodeParticipantMiddleware,
  predictionController.getMatchdayPredictions,
);
router.get(
  "/matchday/:id/partials",
  authMiddleware,
  prodeParticipantMiddleware,
  predictionController.getMatchdayPartials,
);

export default router;
