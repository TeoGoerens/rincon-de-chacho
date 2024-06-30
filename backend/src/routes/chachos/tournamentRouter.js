import { Router } from "express";
import TournamentController from "../../controllers/chachos/tournamentController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new TournamentController();

// ---------- GET ROUTES ----------
router.get(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.getTournamentById
);
router.get("/", authMiddleware, controller.getAllTournaments);

// ---------- POST ROUTES ----------
router.post(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  controller.createTournament
);

// ---------- PUT ROUTES ----------
router.put(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.updateTournamentById
);

// ---------- DELETE ROUTES ----------
router.delete(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteTournamentById
);

export default router;
