import { Router } from "express";
import CronicaController from "../../controllers/cronica/cronicaController.js";
import authMiddleware from "../../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../../middlewares/auth/adminAuthMiddleware.js";
import { uploadMultipleFilesCronica } from "../../middlewares/multer/multerCronicaConfig.js";

const router = Router();
const controller = new CronicaController();

// ---------- GET ROUTES ----------
router.get("/", authMiddleware, controller.getAllCronicas);
router.get("/:id", authMiddleware, controller.getCronicaById);

// ---------- POST ROUTES ----------
router.post(
  "/",
  (req, res, next) => {
    console.log("Paso 1: Entró a la ruta");
    next();
  },
  authMiddleware,
  (req, res, next) => {
    console.log("Paso 2: Pasó authMiddleware");
    next();
  },
  adminAuthMiddleware,
  (req, res, next) => {
    console.log("Paso 3: Pasó adminAuthMiddleware");
    next();
  },
  uploadMultipleFilesCronica,
  (req, res, next) => {
    console.log("Paso 4: Subida de archivos completada");
    next();
  },
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
