const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"],
    maxlength: [50, "Name cannot exceed 50 characters"],
    match: [/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Please enter a valid email address"
    ]
  },
  city: {
    type: String,
    required: false,
    trim: true,
    maxlength: [50, "City name cannot exceed 50 characters"],
    match: [/^[a-zA-Z\s]+$/, "City can only contain letters and spaces"]
  },
  mobile: {
    type: String,
    default: null,
    trim: true,
    match: [
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9"
    ],
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow null/empty values
        return /^[6-9]\d{9}$/.test(v);
      },
      message: "Mobile number must be 10 digits and start with 6, 7, 8, or 9"
    }
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    maxlength: [128, "Password cannot exceed 128 characters"],
    validate: {
      validator: function(v) {
        // Password must contain at least one letter and one number
        return /^(?=.*[A-Za-z])(?=.*\d)/.test(v);
      },
      message: "Password must contain at least one letter and one number"
    }
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: "Role must be either 'user' or 'admin'"
    },
    default: 'user'
  },
  otp: {
    code: {
      type: String,
      minlength: [4, "OTP code must be at least 4 characters"],
      maxlength: [6, "OTP code cannot exceed 6 characters"]
    },
    expiresAt: {
      type: Date,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow null values
          return v > new Date();
        },
        message: "OTP expiration time must be in the future"
      }
    }
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


module.exports = mongoose.model("User", userSchema);
