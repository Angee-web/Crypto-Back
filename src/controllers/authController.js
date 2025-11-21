import { validationResult } from 'express-validator';
import { generateToken } from '../middleware/auth.js';
import { mockDB } from '../config/database.js';
import bcrypt from 'bcryptjs';
import crypto from "crypto";
import User from '../models/User.js';
import DashboardData from '../models/DashboardData.js';
import { sendPasswordResetConfirmationEmail } from './emailController.js';

// Helper function to dynamically import User model only when needed
const getUserModel = async () => {
  if (process.env.USE_MOCK_DB === 'true' || !process.env.MONGODB_URI) {
    return null;
  }
  const userModule = await import('../models/User.js');
  return userModule.default;
};

export const register = async (req, res) => {
  try {
    // 1. Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      ssn,
      citizenshipStatus,
      email,
      phoneNumber,
      phoneType,
      streetAddress,
      city,
      state,
      zipCode,
      password,
      securityQuestion,
      securityAnswer,
      termsAgreement,
      investmentAgreement,
      accreditedInvestor,
      marketingConsent,
    } = req.body;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    console.log("Existing user check:", existingUser ? "Found" : "Not found");
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    console.log("Registering user email:", email);
    console.log("Unhashed password:", password);

    // 3. Create the user first (without dashboardData)
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      ssn,
      citizenshipStatus,
      phoneNumber,
      phoneType,
      address: { streetAddress, city, state, zipCode },
      security: { question: securityQuestion, answer: securityAnswer },
      agreements: {
        termsAccepted: termsAgreement,
        investmentAgreement,
        accreditedInvestor: accreditedInvestor || false,
        marketingConsent: marketingConsent || false,
      },
      role: "user",
      isActive: true,
      isVerified: false,
      // dashboardData will be added after
    });

    // 4. Create the dashboard linked to the new user
    const dashboard = await DashboardData.create({
      userId: user._id,
      portfolioValue: 0,
      miningPower: 0,
      monthlyEarnings: 0,
      availableBalance: 0,
      miningPools: [], // pre-populate pools here if desired
      metrics: {
        growthPercentage: 0,
        uptimePercentage: 0,
        monthlyGrowth: 0,
        networkDifficulty: "0 T",
        blockReward: "0 BTC",
        energyCost: "$0.00/kWh",
      },
      recentTransactions: [],
    });

    // 5. Update the user with the dashboardData ID
    user.dashboardData = dashboard._id;
    await user.save();

    // 6. Generate JWT token
    const token = generateToken(user._id);

    // 7. Send public profile without sensitive info
    const publicProfile = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: publicProfile,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email address is already registered",
      });
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};



// Helper functions to set default dashboard data based on investment plan
const getMiningPowerByPlan = (plan) => {
  const planMapping = {
    'starter': 15.0,
    'growth': 35.0,
    'premium': 75.0,
    'institutional': 150.0
  };
  return planMapping[plan] || 25.0;
};

const getMonthlyEarningsByPlan = (plan) => {
  const planMapping = {
    'starter': 800,
    'growth': 2200,
    'premium': 5500,
    'institutional': 12000
  };
  return planMapping[plan] || 1500;
};

// Login user
export const login = async (req, res) => {
  try {
    // 1️⃣ Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log("Login endpoint hit:", req.body);

    // 2️⃣ Fetch user and include password
    const user = await User.findOne({ email }).select('+password');
    console.log("MongoDB user fetched:", user ? user.email : "NO USER FOUND");

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3️⃣ Log the hashed password from DB for debugging
    console.log("Password field from DB (raw):", user.password);

    // 4️⃣ Compare password with bcrypt
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log("Password incorrect for email:", email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 5️⃣ Check if account is active
    if (!user.isActive) {
      console.log("User account is deactivated:", email);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // 6️⃣ Update last login
    user.lastLogin = new Date();
    await user.save();
    console.log("User lastLogin updated for:", email);

    // 7️⃣ Generate JWT token
    const token = generateToken(user._id);

    // 8️⃣ Get public profile (without sensitive info)
    const publicProfile = user.getPublicProfile();

    console.log("Login successful for:", email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: publicProfile,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

export const logout = async (req, res) => {
  try {
    const User = await getUserModel();
    if (!User) {
      return res.status(500).json({
        success: false,
        message: 'User model not available'
      });
    }

    // Assuming user ID comes from auth middleware (req.userId)
    const user = await User.findById(req.userId);
    if (user) {
      user.lastLogout = new Date();
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    if (mockDB.isMockDB()) {
      const user = await mockDB.findUserById(req.user._id);
      const publicProfile = {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        dashboardData: user.dashboardData,
        createdAt: user.createdAt
      };
      
      return res.status(200).json({
        success: true,
        data: { user: publicProfile }
      });
    }

    const User = await getUserModel();
    if (!User) {
      return res.status(500).json({
        success: false,
        message: 'User model not available'
      });
    }

    const user = await User.findById(req.user._id);
    const publicProfile = user.getPublicProfile();
    
    res.status(200).json({
      success: true,
      data: { user: publicProfile }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// Generate random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 🔹 Send OTP (for testing: log to console)
const sendOTPEmail = async (email, otp) => {
  console.log('==============================');
  console.log(`📧 OTP for ${email}: ${otp}`);
  console.log('==============================');
  // TODO: integrate real email service
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: new RegExp(`^${email.trim()}$`, 'i'),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address.',
      });
    }

    const otp = generateOTP();

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // remove this → await sendOTPEmail(email, otp);
    // because the frontend will send the email using your /send-email endpoint

    res.status(200).json({
      success: true,
      otp,                                // 👈 FIX HERE
      message: 'OTP generated successfully.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.',
      });
    }

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();

    // 🔥 Send confirmation email
    await sendPasswordResetConfirmationEmail(email);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. A confirmation email has been sent.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password',
    });
  }
};
