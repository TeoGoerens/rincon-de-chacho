import { Router } from "express";
import CronicaController from "../../controllers/cronica/cronicaController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";
import { uploadMultipleFilesCronica } from "../../middlewares/multer/multerCronicaConfig.js";

const router = Router();
const controller = new CronicaController();

// ---------- GET ROUTES ----------
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Ruta test funcionando" });
});
router.get("/", authMiddleware, controller.getAllCronicas);
router.get("/:id", authMiddleware, controller.getCronicaById);

// ---------- POST ROUTES ----------
router.post(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  uploadMultipleFilesCronica,
  controller.createCronica
);

// ---------- PUT ROUTES ----------
router.put(
  "/:id",
  authMiddleware,
  adminAuthMiddleware,
  uploadMultipleFilesCronica,
  controller.updateCronicaById
);

router.put("/:id/likes", authMiddleware, controller.updateCronicaLikesById);

router.put("/:id/views", authMiddleware, controller.updateCronicaViewsById);

// ---------- DELETE ROUTES ----------
router.delete(
  "/:id",
  authMiddleware,
  adminAuthMiddleware,
  controller.deleteCronicaById
);

export default router;
