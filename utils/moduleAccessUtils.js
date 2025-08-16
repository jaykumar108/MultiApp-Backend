const User = require("../models/user.model");

// Valid module names that can be granted access to
const VALID_MODULES = [
  'users',
  'reports', 
  'analytics',
  'settings',
  'notifications',
  'content',
  'billing',
  'support',
  'dashboard',
  'admin'
];

// Valid permissions that can be granted
const VALID_PERMISSIONS = ['read', 'write', 'delete', 'create'];

/**
 * Validate if a module name is valid
 * @param {string} moduleName - The module name to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidModule = (moduleName) => {
  return VALID_MODULES.includes(moduleName);
};

/**
 * Validate if permissions array contains valid permissions
 * @param {Array} permissions - Array of permission strings
 * @returns {Object} - { isValid: boolean, invalid: Array }
 */
const validatePermissions = (permissions) => {
  if (!Array.isArray(permissions)) {
    return { isValid: false, invalid: ['Permissions must be an array'] };
  }

  const invalidPermissions = permissions.filter(p => !VALID_PERMISSIONS.includes(p));
  
  return {
    isValid: invalidPermissions.length === 0,
    invalid: invalidPermissions,
    valid: VALID_PERMISSIONS
  };
};

/**
 * Get all valid modules
 * @returns {Array} - Array of valid module names
 */
const getValidModules = () => {
  return [...VALID_MODULES];
};

/**
 * Get all valid permissions
 * @returns {Array} - Array of valid permission names
 */
const getValidPermissions = () => {
  return [...VALID_PERMISSIONS];
};

/**
 * Check if a user has access to a specific module with specific permission
 * @param {string} userId - User ID
 * @param {string} moduleName - Module name
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} - True if user has access
 */
const checkUserModuleAccess = async (userId, moduleName, permission = 'read') => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    
    return user.hasModuleAccess(moduleName, permission);
  } catch (error) {
    console.error('Error checking user module access:', error);
    return false;
  }
};

/**
 * Get user's active module access
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of active module access
 */
const getUserActiveModuleAccess = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return [];
    }
    
    return user.getActiveModuleAccess();
  } catch (error) {
    console.error('Error getting user module access:', error);
    return [];
  }
};

/**
 * Grant module access to a user
 * @param {string} userId - User ID to grant access to
 * @param {string} moduleName - Module name
 * @param {Array} permissions - Array of permissions
 * @param {string} grantedBy - Admin user ID who is granting access
 * @returns {Promise<Object>} - Result object
 */
const grantModuleAccessToUser = async (userId, moduleName, permissions, grantedBy) => {
  try {
    // Validate module name
    if (!isValidModule(moduleName)) {
      return {
        success: false,
        error: `Invalid module name. Valid modules: ${VALID_MODULES.join(', ')}`
      };
    }

    // Validate permissions
    const permissionValidation = validatePermissions(permissions);
    if (!permissionValidation.isValid) {
      return {
        success: false,
        error: `Invalid permissions: ${permissionValidation.invalid.join(', ')}`
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    await user.grantModuleAccess(moduleName, permissions, grantedBy);
    
    return {
      success: true,
      message: `Module access granted successfully for ${moduleName}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        moduleAccess: user.getActiveModuleAccess()
      }
    };
  } catch (error) {
    console.error('Error granting module access:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Revoke module access from a user
 * @param {string} userId - User ID to revoke access from
 * @param {string} moduleName - Module name
 * @returns {Promise<Object>} - Result object
 */
const revokeModuleAccessFromUser = async (userId, moduleName) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    await user.revokeModuleAccess(moduleName);
    
    return {
      success: true,
      message: `Module access revoked successfully for ${moduleName}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        moduleAccess: user.getActiveModuleAccess()
      }
    };
  } catch (error) {
    console.error('Error revoking module access:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all users with their module access (for admin dashboard)
 * @param {string} role - Optional role filter
 * @returns {Promise<Array>} - Array of users with their module access
 */
const getAllUsersWithModuleAccess = async (role = null) => {
  try {
    const query = role ? { role } : {};
    const users = await User.find(query)
      .select('-password -otp')
      .populate('moduleAccess.grantedBy', 'name email');

    return users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
      mobile: user.mobile,
      moduleAccess: user.getActiveModuleAccess(),
      allModuleAccess: user.moduleAccess,
      createdAt: user.createdAt
    }));
  } catch (error) {
    console.error('Error getting users with module access:', error);
    return [];
  }
};

module.exports = {
  VALID_MODULES,
  VALID_PERMISSIONS,
  isValidModule,
  validatePermissions,
  getValidModules,
  getValidPermissions,
  checkUserModuleAccess,
  getUserActiveModuleAccess,
  grantModuleAccessToUser,
  revokeModuleAccessFromUser,
  getAllUsersWithModuleAccess
};
