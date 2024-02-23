import { Router } from "express";
import UserController from "../controllers/userController.js";

const router = Router();
const controller = new UserController();

// ---------- REGISTER & LOGIN ROUTES ----------
router.post("/register", controller.registerUser);
router.post("/login", controller.loginUser);

// ---------- PASSWORD MANAGEMENT ROUTES ----------
router.post("/forgot-password", controller.forgetPasswordTokenGenerator);
router.put("/reset-password", controller.passwordReset);

export default router;
