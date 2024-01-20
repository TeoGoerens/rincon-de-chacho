import { Router } from "express";
import PlayerController from "../../controllers/chachos/playerController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new PlayerController();

// ---------- GET ROUTES ----------
router.get("/:pid", controller.getPlayerById);
router.get("/", authMiddleware, adminAuthMiddleware, controller.getAllPlayers);

// ---------- POST ROUTES ----------
router.post("/", controller.createPlayer);

// ---------- PUT ROUTES ----------
router.put("/:pid", controller.updatePlayerById);

// ---------- DELETE ROUTES ----------
router.delete("/:pid", controller.deletePlayerById);

export default router;
