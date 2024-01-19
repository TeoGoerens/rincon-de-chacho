import { Router } from "express";
import RivalTeamController from "../../controllers/chachos/rivalTeamController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";

const router = Router();
const controller = new RivalTeamController();

// ---------- GET ROUTES ----------
router.get("/:pid", controller.getRivalTeamById);
router.get("/", controller.getAllRivalTeams);

// ---------- POST ROUTES ----------
router.post("/", controller.createRivalTeam);

// ---------- PUT ROUTES ----------
router.put("/:pid", controller.updateRivalTeam);

// ---------- DELETE ROUTES ----------
router.delete("/:pid", controller.deleteRivalTeamById);

export default router;
