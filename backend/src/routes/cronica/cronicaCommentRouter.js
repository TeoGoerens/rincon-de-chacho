import { Router } from "express";
import CronicaCommentController from "../../controllers/cronica/cronicaCommentController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new CronicaCommentController();

// ----------------------------------------
// ---------- COMMENTS ENDPOINTS ----------
// ----------------------------------------

// ---------- GET ROUTES ----------
router.get("/:cid", authMiddleware, controller.getAllCommentsByCronicaId);

// ---------- POST ROUTES ----------
router.post("/:cid", authMiddleware, controller.createCommentOnACronica);

// ---------- PUT ROUTES ----------
router.put("/:mid/like", authMiddleware, controller.updateCommentLike);

router.put("/:mid/dislike", authMiddleware, controller.updateCommentDislike);

router.put("/:mid", authMiddleware, controller.updateCommentOnCronica);

// ---------- DELETE ROUTES ----------
router.delete("/:mid", authMiddleware, controller.deleteCommentFromCronica);

// ----------------------------------------
// ---------- REPLIES ENDPOINTS -----------
// ----------------------------------------

// ---------- POST ROUTES ----------
router.post("/:mid/reply", authMiddleware, controller.createReplyOnAComment);

// ---------- PUT ROUTES ----------
router.put(
  "/:mid/reply/:rid",
  authMiddleware,
  controller.updateReplyOnAComment
);

router.put("/:mid/reply/:rid/like", authMiddleware, controller.updateReplyLike);

router.put(
  "/:mid/reply/:rid/dislike",
  authMiddleware,
  controller.updateReplyDislike
);

// ---------- DELETE ROUTES ----------
router.delete(
  "/:mid/reply/:rid",
  authMiddleware,
  controller.deleteReplyOnAComment
);

export default router;
