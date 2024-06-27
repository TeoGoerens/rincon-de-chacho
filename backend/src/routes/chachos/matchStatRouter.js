import { Router } from "express";
import MatchStatController from "../../controllers/chachos/matchStatController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new MatchStatController();

// ---------- GET ROUTES ----------

router.get(
  "/tournament-round/:pid",
  authMiddleware,
  controller.getMatchStatByRound
);
router.get("/filtered", authMiddleware, controller.getMatchStatsFiltered);

// ---------- POST ROUTES ----------
router.post(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.createMatchStat
);

// ---------- PUT ROUTES ----------
router.put(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.updateMatchStat
);
//Actualizar desde votes PUNTAJES y PERLAS

// ---------- DELETE ROUTES ----------
router.delete(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteMatchStat
);

export default router;
