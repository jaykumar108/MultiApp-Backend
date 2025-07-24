const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.Controller");
const { authMiddleware, requireAdmin, requireUser } = require("../Middleware/Auth");

// Public routes (no authentication required)
router.post("/register", authController.register);
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/login", authController.loginWithPassword);

// Protected routes (authentication required)
    router.post("/logout", authMiddleware, authController.logout);
router.get("/profile", authMiddleware, requireUser, authController.getProfile);
// Example: router.get("/profile", authMiddleware, requireUser, authController.getProfile);
// Example: router.get("/admin/users", authMiddleware, requireAdmin, authController.getAllUsers);

module.exports = router;
