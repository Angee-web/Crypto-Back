// models/PerformanceAlert.js
import mongoose from 'mongoose';

const performanceAlertSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true, // the alert text
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info', // optional: categorize alert
  },
  date: {
    type: Date,
    default: Date.now, // when the alert occurred
  },
  read: {
    type: Boolean,
    default: false, // mark if the user has seen it
  },
}, { timestamps: true }); // automatically adds createdAt and updatedAt

export default mongoose.model('PerformanceAlert', performanceAlertSchema);
