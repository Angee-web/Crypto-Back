import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import DashboardData from './DashboardData.js';

const userSchema = new mongoose.Schema({
  // Basic Authentication (Required for Sign In)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  resetPasswordOTP: String,
resetPasswordOTPExpire: Date,
  
  // Personal Information (Step 1)
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  ssn: {
    type: String,
    required: [true, 'SSN is required'],
    select: false // Hide SSN in queries for security
  },
  citizenshipStatus: {
    type: String,
    required: [true, 'Citizenship status is required'],
    enum: ['us-citizen', 'permanent-resident', 'undocumented individual']
  },
  
  // Contact Information (Step 2)
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required']
  },
  phoneType: {
    type: String,
    required: [true, 'Phone type is required'],
    enum: ['mobile', 'home', 'work']
  },
  address: {
    streetAddress: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    }
  },
  
  // Security Information (Step 3)
  security: {
    question: {
      type: String,
      required: [true, 'Security question is required'],
      enum: [
        'mothers-maiden-name',
        'first-pet',
        'birth-city',
        'elementary-school',
        'favorite-book'
      ]
    },
    answer: {
      type: String,
      required: [true, 'Security answer is required'],
      select: false // Hide for security
    }
  },
  
  // Agreements & Consent (Step 4)
  agreements: {
    termsAccepted: {
      type: Boolean,
      required: [true, 'Terms agreement is required'],
      validate: {
        validator: function(v) { return v === true; },
        message: 'Terms must be accepted'
      }
    },
    investmentAgreement: {
      type: Boolean,
      required: [true, 'Investment agreement is required'],
      validate: {
        validator: function(v) { return v === true; },
        message: 'Investment agreement must be accepted'
      }
    },
    accreditedInvestor: {
      type: Boolean,
      default: false
    },
    marketingConsent: {
      type: Boolean,
      default: false
    },
    acceptedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Account Management
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  lastLogin: {
    type: Date
  },
  lastLogout: {
    type: Date
  },
  
  // Dashboard Data (Admin Managed)
  dashboardData: { type: mongoose.Schema.Types.ObjectId, ref: 'DashboardData' } 
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'investmentProfile.plan': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Hash security answer before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('security.answer')) return next();
  this.security.answer = await bcrypt.hash(this.security.answer.toLowerCase(), 12);
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.compareSecurityAnswer = async function(candidateAnswer) {
  return await bcrypt.compare(candidateAnswer.toLowerCase(), this.security.answer);
};

userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.ssn;
  delete user.security;
  return user;
};

// Method to generate reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return null;
  return `${this.address.streetAddress}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// userSchema.post('save', async function(doc, next) {
//   if (!doc.dashboardData) {
//     const dashboard = await DashboardData.create({ user: doc._id });
//     doc.dashboardData = dashboard._id;
//     await doc.save();
//   }
//   next();
// });

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

export default User;