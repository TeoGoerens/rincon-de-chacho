import { Router } from "express";
import TournamentController from "../../controllers/chachos/tournamentController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";

const router = Router();
const controller = new TournamentController();

// ---------- GET ROUTES ----------
router.get("/:pid", controller.getTournamentById);
router.get("/", controller.getAllTournaments);

// ---------- POST ROUTES ----------
router.post("/", controller.createTournament);

// ---------- PUT ROUTES ----------
router.put("/:pid", controller.updateTournamentById);

// ---------- DELETE ROUTES ----------
router.delete("/:pid", controller.deleteTournamentById);

export default router;
