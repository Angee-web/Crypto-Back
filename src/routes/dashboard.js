import express from 'express';
import { 
  getDashboardOverview,
  getPortfolioPerformance,
  getMiningOperations,
  getNotifications,
  updateUserProfile,
  getPerformanceAlerts,
  markAlertAsRead
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// Dashboard routes
router.get('/overview', getDashboardOverview);
router.get('/portfolio-performance', getPortfolioPerformance);
router.get('/mining-operations', getMiningOperations);
router.get('/notifications', getNotifications);
router.put("/edit-profile", updateUserProfile);
router.get('/performance-alerts', getPerformanceAlerts); 
router.patch('/performance-alerts/:alertId/mark-read', markAlertAsRead);

export default router;