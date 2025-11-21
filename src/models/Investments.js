// models/Investment.js
import mongoose from "mongoose";

const InvestmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Step 1 — Investment Goals
    goals: {
      type: String, // e.g., "Wealth Growth", "Passive Income", "Diversification"
      required: true,
    },

    // Step 2 — Plan Selection
    plan: {
      type: String, // e.g., "Starter", "Professional", "Enterprise"
      required: true,
    },

    // Step 3 — Risk Tolerance
    riskTolerance: {
      type: String, // "low" | "medium" | "high"
      required: true,
    },

    // Step 4 — Funding Details
    initialInvestment: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String, // "bank-transfer" | "crypto" | "wallet-balance"
      required: true,
    },

    transactionReference: {
      type: String, // proof or ref number
    },

    // System fields
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Investment", InvestmentSchema);
