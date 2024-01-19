import { Router } from "express";
import FootballCategoryController from "../../controllers/chachos/footballCategoryController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";

const router = Router();
const controller = new FootballCategoryController();

// ---------- GET ROUTES ----------
router.get("/:pid", controller.getFootballCategoryById);
router.get("/", controller.getAllFootballCategories);

// ---------- POST ROUTES ----------
router.post("/", controller.createFootballCategory);

// ---------- PUT ROUTES ----------
router.put("/:pid", controller.updateFootballCategory);

// ---------- DELETE ROUTES ----------
router.delete("/:pid", controller.deleteFootballCategoryById);

export default router;
