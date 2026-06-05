import { Router } from "express";
import TournamentRoundController from "../../controllers/chachos/tournamentRoundController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new TournamentRoundController();

// ---------- GET ROUTES ----------
router.get("/current-context", authMiddleware, controller.getCurrentContext);
router.get("/stats-summary",   authMiddleware, controller.getStatsSummary);
router.get("/tournament/:pid", authMiddleware, controller.getRoundsByTournament);
router.get("/:pid", authMiddleware, controller.getTournamentRoundById);
router.get("/:pid/players", authMiddleware, controller.getPlayersTournamentRoundById);
router.get("/", authMiddleware, controller.getAllTournamentRounds);

// ---------- POST ROUTES ----------
router.post(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  controller.createTournamentRound
);

// ---------- PUT ROUTES ----------
router.put(
  "/open-for-vote/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.ToggleOpenForVote
);
router.put(
  "/consolidate-pearls/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.consolidatePearls
);
router.put("/:pid", authMiddleware, adminAuthMiddleware, controller.updateTournamentRoundById);

// ---------- DELETE ROUTES ----------
router.delete(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteTournamentRoundById
);

export default router;
