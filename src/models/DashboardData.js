import { hash } from 'crypto';
import mongoose from 'mongoose';

const dashboardDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  portfolioValue: { type: Number, default: 0 },
  miningPower: { type: Number, default: 0 },
  monthlyEarnings: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  metrics: {
    growthPercentage: { type: Number, default: 0 },
    uptimePercentage: { type: Number, default: 99.8 },
    monthlyGrowth: { type: Number, default: 0 },
    networkDifficulty: { type: String, default: '72.45 T' },
    blockReward: { type: String, default: '6.25 BTC' },
    energyCost: { type: String, default: '$0.042/kWh' }
  },
  recentTransactions: [
    {
      date: { type: Date, default: Date.now },
      type: { type: String, enum: ["deposit", "withdrawal", "reinvestment"], required: true },
      amount: { type: Number, required: true },
      currency: { type: String, default: "USD" },
      status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
      method: { type: String, default: "bank" },
      description: { type: String, default: "" },
      transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecentTransactions', default: () => new mongoose.Types.ObjectId() }
    }
  ],  
  miningPools: [
    {
      poolId: { type: mongoose.Schema.Types.ObjectId, ref: 'MiningPool', required: true },
      name: String,
      status: { type: String, enum: ["active", "inactive"], default: "active" },
      location: String,
      hashRate: { type: Number, default: 0 },
      efficiency: { type: Number, default: 0 }
    }
  ]  
}, { timestamps: true });

// Add this after defining the schema
dashboardDataSchema.set('toJSON', {
  transform: (doc, ret) => {
    // Convert top-level _id to string
    ret._id = ret._id.toString();

    // Convert poolId inside miningPools to string
    if (ret.miningPools) {
      ret.miningPools = ret.miningPools.map(pool => ({
        ...pool,
        poolId: pool.poolId ? pool.poolId.toString() : null
      }));
    }

    return ret;
  }
});


export default mongoose.model('DashboardData', dashboardDataSchema);
