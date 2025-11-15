import express from 'express';
import { 
  getAllUsers,
  getUserById,
  updateUserDashboard,
  deleteUser,
  getDashboardStats,
  updateDashboardValidation,
  miningPoolValidation,
  getMiningPools,
  updateMiningPool,
  deleteMiningPool,
  createMiningPool,
  removeMiningPoolFromUser,
  deletePerformanceAlertForUser,
  performanceAlertValidation,
  addPerformanceAlertForUser
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Admin dashboard stats
router.get('/stats', getDashboardStats);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/dashboard', updateDashboardValidation, updateUserDashboard);
// router.put('/users/:userId/info', updateUserInfoValidation, updateUserInfo);
router.delete('/users/:userId', deleteUser);

router.post('/mining-pools', miningPoolValidation, createMiningPool);
router.get('/mining-pools', getMiningPools);
router.put('/mining-pools/:poolId', updateMiningPool);
router.delete('/mining-pools/:poolId', deleteMiningPool);
router.delete('/users/:userId/miningPools/:poolId', removeMiningPoolFromUser);
router.post('/performance-alerts/:userId', performanceAlertValidation, addPerformanceAlertForUser);
router.delete('/performance-alerts/:alertId', deletePerformanceAlertForUser);

export default router;