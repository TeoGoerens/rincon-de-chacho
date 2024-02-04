import { Router } from "express";
import FootballCategoryController from "../../controllers/chachos/footballCategoryController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";

const router = Router();
const controller = new FootballCategoryController();

// ---------- GET ROUTES ----------
router.get(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.getFootballCategoryById
);
router.get(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  controller.getAllFootballCategories
);

// ---------- POST ROUTES ----------
router.post(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  controller.createFootballCategory
);

// ---------- PUT ROUTES ----------
router.put(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.updateFootballCategory
);

// ---------- DELETE ROUTES ----------
router.delete(
  "/:pid",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteFootballCategoryById
);

export default router;
