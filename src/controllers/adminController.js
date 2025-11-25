import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import MiningPool from '../models/MiningPool.js';
import DashboardData from '../models/DashboardData.js';

// GET USERS AND DELETE USERS 

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: 'user' })
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ role: 'user' });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};

// Get specific user details (admin only)
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
  .select('-password')
  .populate('dashboardData');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
};


// DASHBOARD MANAGEMENT

/* -------------------- MINING POOL MANAGEMENT -------------------- */

// Create new mining pool
export const createMiningPool = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, location, hashRate, efficiency, status } = req.body;

    const existing = await MiningPool.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mining pool already exists' });
    }

    const newPool = await MiningPool.create({ name, location, hashRate, efficiency, status });
    res.status(201).json({ success: true, message: 'Mining pool created successfully', data: newPool });
  } catch (error) {
    console.error('Create mining pool error:', error);
    res.status(500).json({ success: false, message: 'Server error creating mining pool' });
  }
};

// Get all mining pools
export const getMiningPools = async (req, res) => {
  try {
    const pools = await MiningPool.find().sort({ createdAt: -1 });

    // Convert _id to string
    const formatted = pools.map(p => ({
      ...p.toObject(),
      _id: p._id.toHexString()
    }));

    res.status(200).json({ success: true, data: formatted });
    console.log('Mining pools retrieved successfully', formatted);
  } catch (error) {
    console.error('Get mining pools error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching mining pools' });
  }
};


// Update mining pool
export const updateMiningPool = async (req, res) => {
  try {
    const { poolId } = req.params;
    const updateData = req.body;

    const pool = await MiningPool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Mining pool not found' });
    }

    Object.assign(pool, updateData);
    await pool.save();

    res.status(200).json({ success: true, message: 'Mining pool updated successfully', data: pool });
  } catch (error) {
    console.error('Update mining pool error:', error);
    res.status(500).json({ success: false, message: 'Server error updating mining pool' });
  }
};

// Delete mining pool
export const deleteMiningPool = async (req, res) => {
  try {
    const { poolId } = req.params;
    const pool = await MiningPool.findById(poolId);

    if (!pool) {
      return res.status(404).json({ success: false, message: 'Mining pool not found' });
    }

    await pool.deleteOne();
    res.status(200).json({ success: true, message: 'Mining pool deleted successfully' });
  } catch (error) {
    console.error('Delete mining pool error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting mining pool' });
  }
};

export const removeMiningPoolFromUser = async (req, res) => {
  try {
    const { userId, poolId } = req.params;

    if (!userId || !poolId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Pool ID are required"
      });
    }

    // Find user's dashboard
    const dashboard = await DashboardData.findOne({ userId });
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "Dashboard not found for this user"
      });
    }

    // Remove the pool from miningPools array
    const initialLength = dashboard.miningPools.length;
    dashboard.miningPools = dashboard.miningPools.filter(
      pool => pool.poolId?.toString() !== poolId
    );

    if (dashboard.miningPools.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Pool not found in user's dashboard"
      });
    }

    await dashboard.save();

    res.status(200).json({
      success: true,
      message: "Mining pool removed successfully",
      data: dashboard.miningPools
    });
  } catch (error) {
    console.error("Error removing mining pool:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing mining pool"
    });
  }
};


/* -------------------- DASHBOARD DATA MANAGEMENT -------------------- */

// Get dashboard data of a specific user
export const getUserDashboard = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate({
      path: 'dashboardData',
      populate: { path: 'miningPools' } // populate mining pools
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: { dashboard: user.dashboardData }
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard data' });
  }
};

// Update dashboard data of a specific user
export const updateUserDashboard = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      metrics,
      availableBalance,
      miningPools,
      recentTransactions,
      performanceAlerts,
      investments,
      portfolioValue,
      miningPower,
      monthlyEarnings
    } = req.body;

    const dashboard = await DashboardData.findOne({ userId });
    if (!dashboard) return res.status(404).json({ success: false, message: 'Dashboard not found' });

    // Update metrics
    if (metrics) {
      dashboard.metrics = { ...dashboard.metrics, ...metrics };
    }

    // Update main values (THIS WAS MISSING ❗)
    if (portfolioValue !== undefined) dashboard.portfolioValue = portfolioValue;
    if (miningPower !== undefined) dashboard.miningPower = miningPower;
    if (monthlyEarnings !== undefined) dashboard.monthlyEarnings = monthlyEarnings;

    // Balance
    if (availableBalance !== undefined) {
      dashboard.availableBalance = availableBalance;
    }

    // Mining pools
    if (miningPools && Array.isArray(miningPools)) {
      dashboard.miningPools = miningPools.map(pool => ({
        poolId: pool.poolId,
        name: pool.name,
        status: pool.status || 'active',
        location: pool.location,
        hashRate: pool.hashRate || 0,
        efficiency: pool.efficiency || 0
      }));
    }

    // Recent transactions
    if (recentTransactions && Array.isArray(recentTransactions)) {
      dashboard.recentTransactions = recentTransactions.map(tx => ({
        date: tx.date ? new Date(tx.date) : new Date(),
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency || 'USD',
        status: tx.status || 'completed',
        method: tx.method || 'bank',
        description: tx.description || '',
        transactionId: tx.transactionId
      }));
    }

    // Performance alerts
    if (performanceAlerts && Array.isArray(performanceAlerts)) {
      dashboard.performanceAlerts = performanceAlerts.map(alert => ({
        performanceAlertId: alert.performanceAlertId,
        message: alert.message,
        severity: alert.severity || 'info',
        date: alert.date ? new Date(alert.date) : new Date(),
        read: alert.read || false
      }));
    }

    // Investments
    if (investments && Array.isArray(investments)) {
      dashboard.investments = investments.map(inv => ({
        goals: inv.goals,
        plan: inv.plan,
        riskTolerance: inv.riskTolerance,
        initialInvestment: inv.initialInvestment,
        paymentMethod: inv.paymentMethod,
        transactionReference: inv.transactionReference,
        status: inv.status,
      }));
    }

    await dashboard.save();

    res.status(200).json({
      success: true,
      message: 'Dashboard updated successfully',
      data: dashboard
    });

  } catch (error) {
    console.error('Update dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error updating dashboard' });
  }
};


// Get dashboard statistics (admin only)
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    // Fetch users with dashboardData populated
    const users = await User.find({ role: 'user' }).populate('dashboardData');

    // Calculate platform stats
    const totalPortfolioValue = users.reduce((sum, user) => sum + (user.dashboardData?.portfolioValue || 0), 0);
    const totalMiningPower = users.reduce((sum, user) => sum + (user.dashboardData?.miningPower || 0), 0);
    const totalMonthlyEarnings = users.reduce((sum, user) => sum + (user.dashboardData?.monthlyEarnings || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        userStats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers
        },
        platformStats: {
          totalPortfolioValue,
          totalMiningPower,
          totalMonthlyEarnings,
          averagePortfolioValue: totalUsers > 0 ? totalPortfolioValue / totalUsers : 0
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics'
    });
  }
};

// Performance alert management

export const addPerformanceAlertForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { message, severity } = req.body;

    const dashboard = await DashboardData.findOne({ userId });
    console.log('Found dashboard:', dashboard);
    console.log('dashboard for userId:', userId);
    if (!dashboard) {
      return res.status(404).json({ success: false, message: 'Dashboard not found for this user' });
    }

    const newAlert = {
      performanceAlertId: undefined,
      message,
      severity: severity || 'info',
      date: new Date(),
      read: false
    };

    dashboard.performanceAlerts.push(newAlert);
    await dashboard.save();

    res.status(201).json({
      success: true,
      message: 'Performance alert added successfully',
      data: newAlert
    });
  } catch (error) {
    console.error('Add performance alert error:', error);
    res.status(500).json({ success: false, message: 'Server error adding performance alert' });
  }
};

export const deletePerformanceAlertForUser = async (req, res) => {
  try {
    const { userId, alertId } = req.params;

    const dashboard = await DashboardData.findOne({ userId });
    if (!dashboard) {
      return res.status(404).json({ success: false, message: 'Dashboard not found for this user' });
    }

    const initialLength = dashboard.performanceAlerts.length;
    dashboard.performanceAlerts = dashboard.performanceAlerts.filter(
      alert => alert.performanceAlertId?.toString() !== alertId
    );

    if (dashboard.performanceAlerts.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Performance alert not found' });
    }

    await dashboard.save();

    res.status(200).json({
      success: true,
      message: 'Performance alert deleted successfully'
    });
  } catch (error) {
    console.error('Delete performance alert error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting performance alert' });
  }
};

/* -------------------- DASHBOARD DATA VALIDATION -------------------- */

export const updateDashboardValidation = [
  body('portfolioValue').optional().isNumeric().withMessage('Portfolio value must be a number'),
  body('miningPower').optional().isNumeric().withMessage('Mining power must be a number'),
  body('monthlyEarnings').optional().isNumeric().withMessage('Monthly earnings must be a number'),
  body('availableBalance').optional().isNumeric().withMessage('Available balance must be a number'),

  body('metrics.growthPercentage').optional().isNumeric().withMessage('Growth percentage must be a number'),
  body('metrics.uptimePercentage').optional().isNumeric().withMessage('Uptime percentage must be a number'),
  body('metrics.monthlyGrowth').optional().isNumeric().withMessage('Monthly growth must be a number'),

  body('miningPools').optional().isArray().withMessage('Mining pools must be an array of IDs'),
  body('miningPools.*').optional().isMongoId().withMessage('Each mining pool must be a valid ID')
];

export const miningPoolValidation = [
  body('miningPools').isArray().withMessage('Mining pools must be an array'),

  // Only validate poolId as a Mongo ID
  body('miningPools.*.poolId')
    .notEmpty()
    .withMessage('Pool ID is required')
    .isMongoId()
    .withMessage('Pool ID must be a valid Mongo ID'),

  body('miningPools.*.name').notEmpty().withMessage('Pool name is required'),
  body('miningPools.*.status')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('miningPools.*.location').notEmpty().withMessage('Location is required'),
  body('miningPools.*.hashRate').isNumeric().withMessage('Hash rate must be a number'),
  body('miningPools.*.efficiency').isNumeric().withMessage('Efficiency must be a number'),
];

// Validation rules for user info updates
export const updateUserInfoValidation = [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').optional().trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('plan').optional().isIn(['Basic', 'Professional', 'Enterprise']).withMessage('Invalid plan type'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value')
];

// Validation for performance alerts
export const performanceAlertValidation = [
  body('message').notEmpty().withMessage('Alert message is required'),
  body('severity').optional().isIn(['info', 'warning', 'critical']).withMessage('Severity must be info, warning, or critical')
];