import { Router } from "express";
import PlayerController from "../../controllers/chachos/playerController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new PlayerController();

// ---------- GET ROUTES ----------
router.get(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.getPlayerById
);
router.get("/", authMiddleware, adminAuthMiddleware, controller.getAllPlayers);

// ---------- POST ROUTES ----------
router.post("/", authMiddleware, adminAuthMiddleware, controller.createPlayer);

// ---------- PUT ROUTES ----------
router.put(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.updatePlayerById
);

// ---------- DELETE ROUTES ----------
router.delete(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.deletePlayerById
);

export default router;
