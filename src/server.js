import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import emailRoutes from './routes/email.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

/* -------------------------------------------- */
/*  IMPORTANT: CORS MUST BE FIRST               */
/* -------------------------------------------- */
app.use((req, res, next) => {
  console.log("Incoming Origin:", req.headers.origin);
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:8081",
      "https://crypto-mine-capital.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Ensure all OPTIONS requests return CORS headers immediately
app.options("*", (req, res) => {
  res.sendStatus(200);
});

/* -------------------------------------------- */
/*  Helmet Security (configured for CORS)       */
/* -------------------------------------------- */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* -------------------------------------------- */
/*  Logging & Body Parser                       */
/* -------------------------------------------- */
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* -------------------------------------------- */
/*  Routes                                      */
/* -------------------------------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/email", emailRoutes);

/* -------------------------------------------- */
/*  Health Check                                */
/* -------------------------------------------- */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database: "MongoDB Atlas Connected",
  });
});

/* -------------------------------------------- */
/*  404 Handler                                 */
/* -------------------------------------------- */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

/* -------------------------------------------- */
/*  Global Error Handler                        */
/* -------------------------------------------- */
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

/* -------------------------------------------- */
/*  Create Admin User If Missing                */
/* -------------------------------------------- */
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@institutionalminer.com";
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      await User.create({
        firstName: "Admin",
        lastName: "User",
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || "admin123456",
        dateOfBirth: new Date("1980-01-01"),
        role: "admin",
        isActive: true,
        isVerified: true,
      });

      console.log("✅ Admin user created successfully");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
  }
};

/* -------------------------------------------- */
/*  Start Server                                */
/* -------------------------------------------- */
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📊 Database: Crypto-Capital (MongoDB Atlas)`);

  setTimeout(createAdminUser, 2000);
});

export default app;
