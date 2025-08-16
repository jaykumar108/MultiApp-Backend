const User = require("../models/user.model");

// Grant module access to a subadmin (Admin only)
exports.grantModuleAccess = async (req, res) => {
  try {
    const { subadminId, moduleName, permissions } = req.body;
    const adminId = req.user.id;

    // Validate required fields
    if (!subadminId || !moduleName || !permissions) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["subadminId", "moduleName", "permissions"]
      });
    }

    // Validate permissions array
    const validPermissions = ['read', 'write', 'delete', 'create'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        message: "Invalid permissions",
        invalid: invalidPermissions,
        valid: validPermissions
      });
    }

    // Find the subadmin
    const subadmin = await User.findById(subadminId);
    if (!subadmin) {
      return res.status(404).json({ message: "Subadmin not found" });
    }

    // Verify the user is actually a subadmin
    if (subadmin.role !== 'subadmin') {
      return res.status(400).json({ message: "User is not a subadmin" });
    }

    // Grant module access
    await subadmin.grantModuleAccess(moduleName, permissions, adminId);

    res.status(200).json({
      message: "Module access granted successfully",
      subadmin: {
        id: subadmin._id,
        name: subadmin.name,
        email: subadmin.email,
        moduleAccess: subadmin.getActiveModuleAccess()
      }
    });
  } catch (error) {
    console.error("Grant module access error:", error);
    res.status(500).json({ message: "Failed to grant module access", error: error.message });
  }
};

// Revoke module access from a subadmin (Admin only)
exports.revokeModuleAccess = async (req, res) => {
  try {
    const { subadminId, moduleName } = req.body;

    // Validate required fields
    if (!subadminId || !moduleName) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["subadminId", "moduleName"]
      });
    }

    // Find the subadmin
    const subadmin = await User.findById(subadminId);
    if (!subadmin) {
      return res.status(404).json({ message: "Subadmin not found" });
    }

    // Verify the user is actually a subadmin
    if (subadmin.role !== 'subadmin') {
      return res.status(400).json({ message: "User is not a subadmin" });
    }

    // Revoke module access
    await subadmin.revokeModuleAccess(moduleName);

    res.status(200).json({
      message: "Module access revoked successfully",
      subadmin: {
        id: subadmin._id,
        name: subadmin.name,
        email: subadmin.email,
        moduleAccess: subadmin.getActiveModuleAccess()
      }
    });
  } catch (error) {
    console.error("Revoke module access error:", error);
    res.status(500).json({ message: "Failed to revoke module access", error: error.message });
  }
};

// Get all subadmins with their module access (Admin only)
exports.getAllSubadminsWithAccess = async (req, res) => {
  try {
    const subadmins = await User.find({ role: 'subadmin' })
      .select('-password -otp')
      .populate('moduleAccess.grantedBy', 'name email');

    const subadminsWithAccess = subadmins.map(subadmin => ({
      id: subadmin._id,
      name: subadmin.name,
      email: subadmin.email,
      city: subadmin.city,
      mobile: subadmin.mobile,
      moduleAccess: subadmin.getActiveModuleAccess(),
      createdAt: subadmin.createdAt
    }));

    res.status(200).json({
      message: "Subadmins retrieved successfully",
      count: subadminsWithAccess.length,
      subadmins: subadminsWithAccess
    });
  } catch (error) {
    console.error("Get subadmins error:", error);
    res.status(500).json({ message: "Failed to retrieve subadmins", error: error.message });
  }
};

// Get specific subadmin's module access (Admin only)
exports.getSubadminModuleAccess = async (req, res) => {
  try {
    const { subadminId } = req.params;

    const subadmin = await User.findById(subadminId)
      .select('-password -otp')
      .populate('moduleAccess.grantedBy', 'name email');

    if (!subadmin) {
      return res.status(404).json({ message: "Subadmin not found" });
    }

    if (subadmin.role !== 'subadmin') {
      return res.status(400).json({ message: "User is not a subadmin" });
    }

    res.status(200).json({
      message: "Subadmin module access retrieved successfully",
      subadmin: {
        id: subadmin._id,
        name: subadmin.name,
        email: subadmin.email,
        city: subadmin.city,
        mobile: subadmin.mobile,
        moduleAccess: subadmin.getActiveModuleAccess(),
        allModuleAccess: subadmin.moduleAccess, // Include revoked access for history
        createdAt: subadmin.createdAt
      }
    });
  } catch (error) {
    console.error("Get subadmin module access error:", error);
    res.status(500).json({ message: "Failed to retrieve subadmin module access", error: error.message });
  }
};

// Check if current user has access to a specific module
exports.checkModuleAccess = async (req, res) => {
  try {
    const { moduleName, permission = 'read' } = req.query;
    const userId = req.user.id;

    if (!moduleName) {
      return res.status(400).json({
        message: "Module name is required",
        required: ["moduleName"]
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasAccess = user.hasModuleAccess(moduleName, permission);

    res.status(200).json({
      message: "Module access check completed",
      hasAccess,
      moduleName,
      permission,
      userRole: user.role,
      activeModules: user.getActiveModuleAccess()
    });
  } catch (error) {
    console.error("Check module access error:", error);
    res.status(500).json({ message: "Failed to check module access", error: error.message });
  }
};

// Get current user's module access
exports.getMyModuleAccess = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select('-password -otp')
      .populate('moduleAccess.grantedBy', 'name email');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Module access retrieved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        moduleAccess: user.getActiveModuleAccess(),
        allModuleAccess: user.moduleAccess // Include revoked access for history
      }
    });
  } catch (error) {
    console.error("Get my module access error:", error);
    res.status(500).json({ message: "Failed to retrieve module access", error: error.message });
  }
};
