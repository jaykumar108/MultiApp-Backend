# Module Access Management System

This document describes the module access management system that allows admins to grant custom module access to subadmins.

## Overview

The system provides granular control over what modules and permissions subadmins can access. Admins can grant, revoke, and manage module access for subadmins with specific permissions like read, write, delete, and create.

## User Roles

- **Admin**: Has access to all modules and can manage module access for subadmins
- **Subadmin**: Has limited access based on what modules and permissions are granted by admins

## Module Access Structure

Each user can have multiple module access entries with the following structure:

```javascript
moduleAccess: [
  {
    moduleName: "users",
    permissions: ["read", "write", "delete"],
    grantedBy: "admin_user_id",
    grantedAt: "2024-01-01T00:00:00.000Z",
    isActive: true
  }
]
```

## Available Modules

The following modules are available for access control:

- `users` - User management
- `reports` - Report generation and viewing
- `analytics` - Analytics and data insights
- `settings` - System settings
- `notifications` - Notification management
- `content` - Content management
- `billing` - Billing and payments
- `support` - Support ticket management
- `dashboard` - Dashboard access
- `admin` - Admin panel access

## Available Permissions

- `read` - View/read access
- `write` - Edit/update access
- `delete` - Delete/remove access
- `create` - Create/new access

## API Endpoints

### Admin-Only Endpoints

#### Grant Module Access
```
POST /api/module-access/grant
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "subadminId": "user_id",
  "moduleName": "users",
  "permissions": ["read", "write"]
}
```

#### Revoke Module Access
```
POST /api/module-access/revoke
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "subadminId": "user_id",
  "moduleName": "users"
}
```

#### Get All Subadmins with Access
```
GET /api/module-access/subadmins
Authorization: Bearer <admin_token>
```

#### Get Specific Subadmin's Access
```
GET /api/module-access/subadmin/:subadminId
Authorization: Bearer <admin_token>
```

### User Endpoints

#### Check Module Access
```
GET /api/module-access/check?moduleName=users&permission=read
Authorization: Bearer <user_token>
```

#### Get My Module Access
```
GET /api/module-access/my-access
Authorization: Bearer <user_token>
```

## Middleware Usage

### Basic Module Access Check
```javascript
const { requireModuleAccess } = require('../Middleware/ModuleAccess');

// Require read access to users module
router.get('/users', requireModuleAccess('users', 'read'), userController.getUsers);

// Require write access to users module
router.put('/users/:id', requireModuleAccess('users', 'write'), userController.updateUser);
```

### Multiple Permission Check
```javascript
const { requireAnyModulePermission } = require('../Middleware/ModuleAccess');

// Require either read or write access to reports module
router.get('/reports', requireAnyModulePermission('reports', ['read', 'write']), reportController.getReports);
```

### All Permissions Check
```javascript
const { requireAllModulePermissions } = require('../Middleware/ModuleAccess');

// Require all permissions for admin module
router.get('/admin', requireAllModulePermissions('admin', ['read', 'write', 'delete', 'create']), adminController.getAdminPanel);
```

## User Model Methods

### Check Module Access
```javascript
const user = await User.findById(userId);
const hasAccess = user.hasModuleAccess('users', 'read');
```

### Grant Module Access (Admin only)
```javascript
const subadmin = await User.findById(subadminId);
await subadmin.grantModuleAccess('users', ['read', 'write'], adminId);
```

### Revoke Module Access
```javascript
const subadmin = await User.findById(subadminId);
await subadmin.revokeModuleAccess('users');
```

### Get Active Module Access
```javascript
const user = await User.findById(userId);
const activeModules = user.getActiveModuleAccess();
```

## Utility Functions

The `utils/moduleAccessUtils.js` file provides helper functions:

```javascript
const {
  isValidModule,
  validatePermissions,
  getValidModules,
  getValidPermissions,
  checkUserModuleAccess,
  grantModuleAccessToUser,
  revokeModuleAccessFromUser
} = require('../utils/moduleAccessUtils');

// Check if module is valid
const isValid = isValidModule('users'); // true

// Validate permissions
const validation = validatePermissions(['read', 'write', 'invalid']);
// { isValid: false, invalid: ['invalid'], valid: ['read', 'write', 'delete', 'create'] }

// Get all valid modules
const modules = getValidModules(); // ['users', 'reports', ...]

// Grant access using utility
const result = await grantModuleAccessToUser(userId, 'users', ['read', 'write'], adminId);
```

## Example Usage Scenarios

### 1. Granting Access to a New Subadmin
```javascript
// Admin grants users module access to subadmin
const response = await fetch('/api/module-access/grant', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subadminId: 'subadmin_user_id',
    moduleName: 'users',
    permissions: ['read', 'write']
  })
});
```

### 2. Protecting a Route with Module Access
```javascript
// In your route file
router.get('/users', 
  authMiddleware, 
  requireModuleAccess('users', 'read'), 
  userController.getUsers
);
```

### 3. Checking Access in Controller
```javascript
// In your controller
exports.getUsers = async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user.hasModuleAccess('users', 'read')) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  // Proceed with user logic
  const users = await User.find().select('-password');
  res.json({ users });
};
```

## Security Considerations

1. **Admin-only operations**: Only users with admin role can grant/revoke module access
2. **Token validation**: All endpoints require valid JWT tokens
3. **Permission validation**: All permissions are validated against allowed values
4. **Module validation**: All module names are validated against allowed modules
5. **Audit trail**: All access grants are tracked with who granted them and when

## Database Schema

The module access is stored in the user document:

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  role: String, // 'admin' or 'subadmin'
  moduleAccess: [
    {
      moduleName: String,
      permissions: [String],
      grantedBy: ObjectId, // Reference to admin who granted access
      grantedAt: Date,
      isActive: Boolean
    }
  ]
}
```

## Error Handling

The system provides detailed error messages for various scenarios:

- Invalid module names
- Invalid permissions
- User not found
- Insufficient permissions
- Authentication required

## Testing

You can test the module access system using the example endpoints provided in the routes:

- `/api/module-access/example-users` - Example of users module protection
- `/api/module-access/example-reports` - Example of reports module protection

These endpoints demonstrate how to use the middleware to protect routes based on module access.
