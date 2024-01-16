import { Router } from "express";
import PlayerController from "../../controllers/chachos/playerController.js";

const router = Router();
const controller = new PlayerController();

// ---------- GET ROUTES ----------
router.get("/:pid", controller.getPlayerById);
router.get("/", controller.getAllPlayers);

// ---------- POST ROUTES ----------
router.post("/create", controller.createPlayer);

// ---------- PUT ROUTES ----------
router.put("/update/:pid", controller.updatePlayerById);

// ---------- DELETE ROUTES ----------
router.delete("/delete/:pid", controller.deletePlayerById);

export default router;
