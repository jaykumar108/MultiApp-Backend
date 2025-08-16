const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  city: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    default: null,
    match: /^[6-9]\d{9}$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['subadmin', 'admin'],
    default: 'subadmin'
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  moduleAccess: {
    type: [{
      moduleName: {
        type: String,
        required: true,
        trim: true
      },
      permissions: {
        type: [String],
        enum: ['read', 'write', 'delete', 'create'],
        default: ['read']
      },
      grantedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      grantedAt: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    default: []
  }
}, {
  timestamps: true
});

//Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

// Method to check if user has access to a specific module
userSchema.methods.hasModuleAccess = function (moduleName, permission = 'read') {
  // Admins have access to all modules
  if (this.role === 'admin') {
    return true;
  }
  
  // Check if subadmin has access to the specific module
  const moduleAccess = this.moduleAccess.find(
    access => access.moduleName === moduleName && access.isActive
  );
  
  if (!moduleAccess) {
    return false;
  }
  
  return moduleAccess.permissions.includes(permission);
};

// Method to grant module access to this user (called by admin)
userSchema.methods.grantModuleAccess = function (moduleName, permissions, grantedBy) {
  // Find existing access for this module
  const existingAccess = this.moduleAccess.find(
    access => access.moduleName === moduleName
  );
  
  if (existingAccess) {
    // Update existing access
    existingAccess.permissions = permissions;
    existingAccess.grantedBy = grantedBy;
    existingAccess.grantedAt = new Date();
    existingAccess.isActive = true;
  } else {
    // Add new access
    this.moduleAccess.push({
      moduleName,
      permissions,
      grantedBy,
      grantedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Method to revoke module access
userSchema.methods.revokeModuleAccess = function (moduleName) {
  const moduleAccess = this.moduleAccess.find(
    access => access.moduleName === moduleName
  );
  
  if (moduleAccess) {
    moduleAccess.isActive = false;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to get all active module access
userSchema.methods.getActiveModuleAccess = function () {
  return this.moduleAccess.filter(access => access.isActive);
};

module.exports = mongoose.model("User", userSchema);
