import { Router } from "express";
import VoteController from "../../controllers/chachos/voteController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new VoteController();

// ---------- GET ROUTES ----------
router.get(
  "/:pid/voter/:vid",
  authMiddleware,
  controller.getVoteByRoundAndUser
);
router.get(
  "/:pid/player/:cid",
  authMiddleware,
  controller.getVoteByRoundAndPlayer
);
router.get("/:pid", authMiddleware, controller.getAllVotesForRound);
router.get("/", authMiddleware, controller.getAllVotes);

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
  controller.deleteVoteById
);

export default router;
