import express from "express";
const router = express.Router();
import * as authController from "../controller/auth.Controller.js";
import { authMiddleware, requireAdmin, requireUser } from "../Middleware/Auth.js";
import {
  validateRegister,
  validateSendOTP,
  validateVerifyOTP,
  validateLogin
} from "../validations/auth.validation.js";

// Public routes (no authentication required)
router.post("/register", validateRegister, authController.register);
router.post("/send-otp", validateSendOTP, authController.sendOTP);
router.post("/verify-otp", validateVerifyOTP, authController.verifyOTP);
router.post("/login", validateLogin, authController.loginWithPassword);

// Protected routes (authentication required)
router.post("/logout", authMiddleware, authController.logout);
router.get("/profile", authMiddleware, requireUser, authController.getProfile);
router.get("/validate-token", authMiddleware, authController.validateToken);

export default router;
