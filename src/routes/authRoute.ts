import { Router } from "express";
import {
  loginController,
  registrerController,
  resetPasswordController,
  forgotPasswordController,
} from "../controllers/authController";

const router = Router();

router.route("/register").post(registrerController);
router.route("/login").post(loginController);
router.route("/forgot-password").post(forgotPasswordController);
router.route("/reset-password/:tokenAndEmail").post(resetPasswordController);

export default router;
