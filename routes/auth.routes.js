const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.Controller");
const { authMiddleware, requireAdmin, requireUser } = require("../Middleware/Auth");
const { 
  validateRegister, 
  validateSendOTP, 
  validateVerifyOTP, 
  validateLogin 
} = require("../validations/auth.validation");

// Public routes (no authentication required)
router.post("/register", validateRegister, authController.register);
router.post("/send-otp", validateSendOTP, authController.sendOTP);
router.post("/verify-otp", validateVerifyOTP, authController.verifyOTP);
router.post("/login", validateLogin, authController.loginWithPassword);

// Protected routes (authentication required)
router.post("/logout", authMiddleware, authController.logout);
router.get("/profile", authMiddleware, requireUser, authController.getProfile);
router.get("/validate-token", authMiddleware, authController.validateToken);
// Example: router.get("/profile", authMiddleware, requireUser, authController.getProfile);
// Example: router.get("/admin/users", authMiddleware, requireAdmin, authController.getAllUsers);

module.exports = router;
