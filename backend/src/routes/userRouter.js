import { Router } from "express";
import UserController from "../controllers/userController.js";
import authMiddleware from "../middlewares/auth/authMiddleware.js";
import adminAuthMiddleware from "../middlewares/auth/adminAuthMiddleware.js";
import uploadAvatar from "../middlewares/multer/multerAvatarConfig.js";

const router = Router();
const controller = new UserController();

// ---------- REGISTER & LOGIN ROUTES ----------
router.post("/register", controller.registerUser);
router.post("/login", controller.loginUser);

// ---------- PASSWORD MANAGEMENT ROUTES ----------
router.post("/forgot-password", controller.forgetPasswordTokenGenerator);
router.put("/reset-password", controller.passwordReset);

// ---------- ADMIN ROUTES ----------
router.get("/", authMiddleware, adminAuthMiddleware, controller.getAllUsers);
router.put("/:id", authMiddleware, adminAuthMiddleware, controller.updateUser);

// ---------- PROFILE PICTURE ----------
router.put("/:id/profile-picture", authMiddleware, uploadAvatar, controller.updateProfilePicture);

export default router;
