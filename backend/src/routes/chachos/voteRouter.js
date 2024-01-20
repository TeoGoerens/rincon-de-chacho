import { Router } from "express";
import VoteController from "../../controllers/chachos/voteController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new VoteController();

// ---------- GET ROUTES ----------
//router.get("/", controller.getAllVotesForRound);
//router.get("/:pid", controller.getVoteById);

// ---------- POST ROUTES ----------
router.post("/:pid", authMiddleware, controller.createVoteForRound);

// ---------- PUT ROUTES ----------
router.put(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.updateVoteForRound
);

// ---------- DELETE ROUTES ----------
router.delete(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteVoteForRound
);

export default router;
