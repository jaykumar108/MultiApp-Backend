const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../services/auth.Email"); // nodemailer logic

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, city, mobile, password, confirmPassword, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !city || !password || !confirmPassword) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["name", "email", "city", "password", "confirmPassword"]
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      city,
      mobile,
      password,
      role: role || 'user'
    });

    res.status(201).json({ 
      message: "User registered successfully", 
      userId: user._id,
      user: {
        name: user.name,
        email: user.email,
        city: user.city,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// Send OTP to email
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // expires in 5 minutes
    };

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

// Verify OTP and login
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({ 
        message: "Email and OTP are required",
        required: ["email", "otp"]
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otp.code) {
      return res.status(400).json({ message: "OTP not requested or expired" });
    }

    const now = new Date();
    if (now > user.otp.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = { code: null, expiresAt: null }; // Clear OTP
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    res.status(200).json({ 
      message: "Login successful", 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city,
        mobile: user.mobile,
      }
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

// Login with password
exports.loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required",
        required: ["email", "password"]
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    res.status(200).json({ 
      message: "Login successful", 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city,
        mobile: user.mobile
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User profile fetched successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city,
        mobile: user.mobile,
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};


// Validate token and return user details
exports.validateToken = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user.id).select('-password -otp');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'Token valid',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city,
        mobile: user.mobile,
      }
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};
