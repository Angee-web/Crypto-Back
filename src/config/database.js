import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// MongoDB Atlas connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/institutional-miner';
    
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create admin user if it doesn't exist
    await createAdminUser();
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ 
      email: process.env.ADMIN_EMAIL,
      role: 'admin' 
    });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      
      const adminUser = new User({
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isVerified: true,
        profile: {
          bio: 'System Administrator',
          location: 'System',
          website: '',
          socialLinks: {
            linkedin: '',
            twitter: '',
            github: ''
          }
        },
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          privacy: {
            profileVisibility: 'private',
            showEmail: false,
            showPhone: false
          },
          dashboard: {
            theme: 'light',
            language: 'en',
            timezone: 'UTC'
          }
        },
        investmentProfile: {
          riskTolerance: 'moderate',
          investmentGoals: ['wealth_preservation'],
          timeHorizon: 'long_term',
          experienceLevel: 'expert'
        },
        mining: {
          hashRate: 0,
          totalEarnings: 0,
          activePlans: [],
          earnings: []
        }
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Mock database for development/testing (not used when connecting to MongoDB Atlas)
export const mockDB = {
  isMockDB: () => process.env.USE_MOCK_DB === 'true',
  findUserByEmail: async (email) => null,
  findUserById: async (id) => null,
  createUser: async (userData) => null,
  updateUser: async (id, updateData) => null
};

export default connectDB;