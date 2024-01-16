import { Router } from "express";
import UserController from "../controllers/userController.js";

const router = Router();
const controller = new UserController();

router.post("/signup", controller.signup);

export default router;
