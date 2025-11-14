import mongoose from 'mongoose';

const recentTransactionsSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ["deposit", "withdrawal", "reinvestment"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    method: { type: String, default: "bank" },
    description: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model('RecentTransactions', recentTransactionsSchema);
