import { Router } from "express";
import ProdePlayerController from "../../controllers/prode/prodePlayerController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";

const router = Router();
const playerController = new ProdePlayerController();

/* Router mínimo tras la demolición del Prode legacy: solo lo que otras
   secciones necesitan (Admin Usuarios vincula user ↔ prode_player). */
router.get("/player", authMiddleware, playerController.getAllProdePlayers);

export default router;
