import { Router } from "express";
import ProdeController from "../../controllers/prode/prodeController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new ProdeController();

/* ---------- CONSTANTS ---------- */
router.get("/constants", authMiddleware, controller.getProdeConstants);

/* ---------- PLAYERS ---------- */
router.post(
  "/player",
  authMiddleware,
  adminAuthMiddleware,
  controller.createProdePlayer,
);
router.get("/player/:id", authMiddleware, controller.getProdePlayerById);
router.get("/player", authMiddleware, controller.getAllProdePlayers);
router.put(
  "/player/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.updateProdePlayer,
);
router.delete(
  "/player/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteProdePlayer,
);

/* ---------- TOURNAMENTS ---------- */
router.post(
  "/tournament",
  authMiddleware,
  adminAuthMiddleware,
  controller.createProdeTournament,
);
router.get(
  "/tournament/:id",
  authMiddleware,
  controller.getProdeTournamentById,
);
router.get("/tournament", authMiddleware, controller.getAllProdeTournaments);
router.put(
  "/tournament/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.updateProdeTournament,
);
router.delete(
  "/tournament/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteProdeTournament,
);

/* ---- Monthly winners (manual) ---- */
router.put(
  "/tournament/:id/monthly-winners",
  authMiddleware,
  adminAuthMiddleware,
  controller.upsertMonthlyWinners,
);

router.delete(
  "/tournament/:id/monthly-winners/:month",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteMonthlyWinnersByMonth,
);

/* ---------- MATCHDAYS ---------- */
// listar por torneo (query o param). acá uso param como en tu estilo:
router.get(
  "/matchday/tournament/:tournamentId",
  authMiddleware,
  controller.getMatchdaysByTournament,
);

// crear fecha
router.post(
  "/matchday",
  authMiddleware,
  adminAuthMiddleware,
  controller.createProdeMatchday,
);

// obtener fecha por id
router.get("/matchday/:id", authMiddleware, controller.getProdeMatchdayById);

// update metadata (month, roundNumber, status, etc.)
router.put(
  "/matchday/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.updateProdeMatchdayMeta,
);

// update full (reemplaza duels)
router.put(
  "/matchday/:id/full",
  authMiddleware,
  adminAuthMiddleware,
  controller.updateProdeMatchdayFull,
);

router.delete(
  "/matchday/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteProdeMatchday,
);

export default router;
