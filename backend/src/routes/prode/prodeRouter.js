import { Router } from "express";
import ProdePlayerController from "../../controllers/prode/prodePlayerController.js";
import ProdeTournamentController from "../../controllers/prode/prodeTournamentController.js";
import ProdeMatchdayController from "../../controllers/prode/prodeMatchdayController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const playerController = new ProdePlayerController();
const tournamentController = new ProdeTournamentController();
const matchdayController = new ProdeMatchdayController();

/* ---------- PLAYERS ---------- */
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
router.delete(
  "/matchday/:id",
  authMiddleware,
  adminAuthMiddleware,
  matchdayController.deleteProdeMatchday,
);

export default router;
