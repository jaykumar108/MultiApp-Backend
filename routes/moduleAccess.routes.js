const express = require("express");
const router = express.Router();
const moduleAccessController = require("../controller/moduleAccess.Controller");
const { authMiddleware, requireAdmin } = require("../Middleware/Auth");
const { 
  requireModuleAccess, 
  requireAnyModulePermission 
} = require("../Middleware/ModuleAccess");

// Admin-only routes for managing module access
router.post("/grant", authMiddleware, requireAdmin, moduleAccessController.grantModuleAccess);
router.post("/revoke", authMiddleware, requireAdmin, moduleAccessController.revokeModuleAccess);
router.get("/subadmins", authMiddleware, requireAdmin, moduleAccessController.getAllSubadminsWithAccess);
router.get("/subadmin/:subadminId", authMiddleware, requireAdmin, moduleAccessController.getSubadminModuleAccess);

// User routes for checking their own module access
router.get("/check", authMiddleware, moduleAccessController.checkModuleAccess);
router.get("/my-access", authMiddleware, moduleAccessController.getMyModuleAccess);

// Example of protected routes using module access middleware
// These are examples of how you can protect specific module routes
router.get("/example-users", 
  authMiddleware, 
  requireModuleAccess('users', 'read'), 
  (req, res) => {
    res.json({ message: "Users module accessed successfully", moduleInfo: req.moduleAccess });
  }
);

router.post("/example-users", 
  authMiddleware, 
  requireModuleAccess('users', 'create'), 
  (req, res) => {
    res.json({ message: "User creation accessed successfully", moduleInfo: req.moduleAccess });
  }
);

router.put("/example-users/:id", 
  authMiddleware, 
  requireModuleAccess('users', 'write'), 
  (req, res) => {
    res.json({ message: "User update accessed successfully", moduleInfo: req.moduleAccess });
  }
);

router.delete("/example-users/:id", 
  authMiddleware, 
  requireModuleAccess('users', 'delete'), 
  (req, res) => {
    res.json({ message: "User deletion accessed successfully", moduleInfo: req.moduleAccess });
  }
);

// Example of using multiple permissions
router.get("/example-reports", 
  authMiddleware, 
  requireAnyModulePermission('reports', ['read', 'write']), 
  (req, res) => {
    res.json({ message: "Reports module accessed successfully", moduleInfo: req.moduleAccess });
  }
);

module.exports = router;
