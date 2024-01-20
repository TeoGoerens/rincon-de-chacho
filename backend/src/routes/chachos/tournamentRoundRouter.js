import { Router } from "express";
import TournamentRoundController from "../../controllers/chachos/tournamentRoundController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new TournamentRoundController();

// ---------- GET ROUTES ----------
router.get("/:pid", controller.getTournamentRoundById);
router.get("/:pid/players", controller.getPlayersTournamentRoundById);
router.get("/", controller.getAllTournamentRounds);

// ---------- POST ROUTES ----------
router.post(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  controller.createTournamentRound
);

// ---------- PUT ROUTES ----------
router.put(
  "/:pid/open-for-vote",
  authMiddleware,
  adminAuthMiddleware,
  controller.ToggleOpenForVote
);
router.put("/:pid", controller.updateTournamentRoundById);

// ---------- DELETE ROUTES ----------
router.delete(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteTournamentRoundById
);

export default router;
