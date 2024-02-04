import { Router } from "express";
import RivalTeamController from "../../controllers/chachos/rivalTeamController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new RivalTeamController();

// ---------- GET ROUTES ----------
router.get(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.getRivalTeamById
);
router.get(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  controller.getAllRivalTeams
);

// ---------- POST ROUTES ----------
router.post(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  controller.createRivalTeam
);

// ---------- PUT ROUTES ----------
router.put(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.updateRivalTeam
);

// ---------- DELETE ROUTES ----------
router.delete(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteRivalTeamById
);

export default router;
