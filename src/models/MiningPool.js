// models/MiningPool.js
import mongoose from 'mongoose';

const miningPoolSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String },
  hashRate: { type: Number, default: 0 },
  efficiency: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('MiningPool', miningPoolSchema);
