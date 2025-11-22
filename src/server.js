import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import emailRoutes from './routes/email.js';

// Load environment variables
dotenv.config();

console.log("BREVO_HOST:", process.env.BREVO_HOST);
console.log("BREVO_USER:", process.env.BREVO_USER);
console.log("BREVO_PORT:", process.env.BREVO_PORT);

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB Atlas
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// More strict rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:8080",
    "https://crypto-mine-capital.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Preflight
app.options('*', cors());

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: 'MongoDB Atlas Connected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Create admin user if it doesn't exist
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@institutionalminer.com';
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (!adminExists) {
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123456',
        dateOfBirth: new Date('1980-01-01'),
        ssn: '000-00-0000',
        citizenshipStatus: 'us-citizen',
        phoneNumber: '(555) 123-4567',
        phoneType: 'work',
        address: {
          streetAddress: '123 Admin St',
          city: 'New York',
          state: 'New York',
          zipCode: '10001'
        },
        investmentProfile: {
          plan: 'institutional',
          initialInvestment: 100000,
          experience: 'professional',
          riskTolerance: 'moderate',
          goals: 'Administrative access'
        },
        security: {
          question: 'mothers-maiden-name',
          answer: 'admin'
        },
        agreements: {
          termsAccepted: true,
          investmentAgreement: true,
          accreditedInvestor: true,
          marketingConsent: false
        },
        role: 'admin',
        isActive: true,
        isVerified: true,
        dashboardData: {
          portfolioValue: 100000,
          miningPower: 75.0,
          monthlyEarnings: 5500,
          availableBalance: 12500,
          miningPools: {
            texas: { hashRate: 125.5, efficiency: 65 },
            nevada: { hashRate: 150.2, efficiency: 75 },
            wyoming: { hashRate: 95.8, efficiency: 50 }
          },
          metrics: {
            growthPercentage: 8.5,
            uptimePercentage: 99.8,
            monthlyGrowth: 6.2,
            networkDifficulty: '72.45 T',
            blockReward: '6.25 BTC',
            energyCost: '$0.042/kWh'
          }
        }
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: Crypto-Capital (MongoDB Atlas)`);
  
  // Wait a moment for database connection, then create admin user
  setTimeout(createAdminUser, 2000);
});

export default app;