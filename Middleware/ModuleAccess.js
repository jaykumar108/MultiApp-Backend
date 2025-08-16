const User = require("../models/user.model");

// Middleware to check if user has access to a specific module
const requireModuleAccess = (moduleName, permission = 'read') => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hasAccess = user.hasModuleAccess(moduleName, permission);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          message: "Access denied: Insufficient module permissions",
          required: {
            module: moduleName,
            permission: permission
          },
          current: {
            role: user.role,
            activeModules: user.getActiveModuleAccess()
          }
        });
      }

      // Add module access info to request for potential use in controllers
      req.moduleAccess = {
        moduleName,
        permission,
        userRole: user.role
      };

      next();
    } catch (error) {
      console.error("Module access middleware error:", error);
      return res.status(500).json({ message: "Module access check failed", error: error.message });
    }
  };
};

// Middleware to check if user has any of the specified permissions for a module
const requireAnyModulePermission = (moduleName, permissions = ['read']) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has any of the required permissions
      const hasAnyPermission = permissions.some(permission => 
        user.hasModuleAccess(moduleName, permission)
      );
      
      if (!hasAnyPermission) {
        return res.status(403).json({ 
          message: "Access denied: Insufficient module permissions",
          required: {
            module: moduleName,
            permissions: permissions
          },
          current: {
            role: user.role,
            activeModules: user.getActiveModuleAccess()
          }
        });
      }

      // Add module access info to request
      req.moduleAccess = {
        moduleName,
        requiredPermissions: permissions,
        userRole: user.role
      };

      next();
    } catch (error) {
      console.error("Module access middleware error:", error);
      return res.status(500).json({ message: "Module access check failed", error: error.message });
    }
  };
};

// Middleware to check if user has all specified permissions for a module
const requireAllModulePermissions = (moduleName, permissions = ['read']) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has all required permissions
      const hasAllPermissions = permissions.every(permission => 
        user.hasModuleAccess(moduleName, permission)
      );
      
      if (!hasAllPermissions) {
        return res.status(403).json({ 
          message: "Access denied: Insufficient module permissions",
          required: {
            module: moduleName,
            permissions: permissions
          },
          current: {
            role: user.role,
            activeModules: user.getActiveModuleAccess()
          }
        });
      }

      // Add module access info to request
      req.moduleAccess = {
        moduleName,
        requiredPermissions: permissions,
        userRole: user.role
      };

      next();
    } catch (error) {
      console.error("Module access middleware error:", error);
      return res.status(500).json({ message: "Module access check failed", error: error.message });
    }
  };
};

// Helper function to get user's module access info
const getUserModuleAccess = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return null;
    }
    
    return {
      role: user.role,
      activeModules: user.getActiveModuleAccess(),
      allModules: user.moduleAccess
    };
  } catch (error) {
    console.error("Get user module access error:", error);
    return null;
  }
};

module.exports = {
  requireModuleAccess,
  requireAnyModulePermission,
  requireAllModulePermissions,
  getUserModuleAccess
};
