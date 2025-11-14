import User from '../models/User.js';

// Get user dashboard overview data
export const getDashboardOverview = async (req, res) => {
  try {
    // Populate dashboardData and nested miningPools.poolId
    const user = await User.findById(req.user._id)
      .populate({
        path: 'dashboardData',
        populate: { path: 'miningPools.poolId', model: 'MiningPool' }
      });

    if (!user) {
      console.warn(`Dashboard overview: User not found - ID ${req.user._id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const investmentProfile = user.investmentProfile || {};
    const totalInvested = investmentProfile.initialInvestment || 0;
    const plan = investmentProfile.plan || null;

    // Convert dashboardData to plain object
    const dashboardDataRaw = user.dashboardData?.toObject() || {};

    // Map miningPools to include full pool details and convert IDs to strings
    const miningPools = (dashboardDataRaw.miningPools || []).map(pool => {
      // If poolId is populated (object with _id), use it; otherwise fallback
      const poolObj = pool.poolId && pool.poolId._id ? pool.poolId : {};
    
      return {
        _id: pool._id.toString(),
        poolId: pool.poolId && pool.poolId._id ? pool.poolId._id.toString() : pool.poolId || null,
        name: pool.name || poolObj.name || '',
        location: pool.location || poolObj.location || '',
        status: pool.status || poolObj.status || 'active',
        hashRate: pool.hashRate || poolObj.hashRate || 0,
        efficiency: pool.efficiency || poolObj.efficiency || 0
      };
    });    

    const dashboardData = {
      ...dashboardDataRaw,
      miningPools,
      totalInvested,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        plan,
        joinDate: user.createdAt,
        lastLogin: user.lastLogin || new Date()
      }
    };

    console.log(`Dashboard overview retrieved for user: ${user.email}`);

    res.status(200).json({
      success: true,
      data: dashboardData,
      timestamp: new Date(),
      message: "Dashboard data retrieved successfully"
    });

  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Only allow updates to safe fields
    const { firstName, lastName, phoneNumber, phoneType, address, investmentProfile } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (phoneType) user.phoneType = phoneType;
    if (address) {
      user.address = {
        ...user.address,
        ...address, // e.g., streetAddress, city, state, zipCode
      };
    }
    if (investmentProfile) {
      user.investmentProfile = {
        ...user.investmentProfile,
        ...investmentProfile, // e.g., plan, goals, riskTolerance, experience
      };
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;
    delete updatedUser.ssn;
    delete updatedUser.security;

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error updating profile" });
  }
};



// Get detailed portfolio performance data
export const getPortfolioPerformance = async (req, res) => {
  try {
    const { period = '30D' } = req.query;

    // Fetch user and populate dashboardData
    const user = await User.findById(req.user._id).populate('dashboardData');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const baseValue = parseFloat(user.investmentProfile?.initialInvestment) || 0;
    const dashboard = user.dashboardData;

    // Determine number of data points
    let dataPoints;
    switch (period) {
      case '30D':
        dataPoints = 30;
        break;
      case '90D':
        dataPoints = 90;
        break;
      case '1Y':
        dataPoints = 365;
        break;
      default:
        dataPoints = 30;
    }    

    // Generate performance data
    const generateDetailedChart = () => {
      const data = [];
      for (let i = 0; i < dataPoints; i++) {
        const growthRate = 0.002; // daily growth
        const volatility = (Math.random() - 0.5) * 0.02; // random fluctuation
        const value = baseValue * Math.pow(1 + growthRate + volatility, i);

        // Sum hashRate across all mining pools
        const hashRate = dashboard?.miningPools?.reduce((sum, pool) => sum + (pool.hashRate || 0), 0) || 0;

        data.push({
          date: new Date(Date.now() - (dataPoints - i) * 24 * 60 * 60 * 1000),
          value: Math.round(value),
          earnings: Math.round(value * 0.001), // example earnings
          hashRate: Math.round(hashRate * 10) / 10
        });
      }
      return data;
    };

    const performanceData = {
      period,
      data: generateDetailedChart(),
      summary: {
        totalReturn: `+${((Math.random() * 20) + 10).toFixed(1)}%`,
        volatility: `${(Math.random() * 5 + 2).toFixed(1)}%`,
        sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
        maxDrawdown: `-${(Math.random() * 8 + 2).toFixed(1)}%`
      }
    };

    res.status(200).json({
      success: true,
      data: performanceData
    });

  } catch (error) {
    console.error('Get portfolio performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching performance data'
    });
  }
};


// Get mining operations detailed status
export const getMiningOperations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const investmentAmount = parseFloat(user.investmentProfile?.initialInvestment) || 0;
    const miningPower = Math.round((investmentAmount / 1000) * 0.75 * 10) / 10;

    const miningOperations = {
      totalHashRate: miningPower,
      activeMiners: Math.round(miningPower * 2),
      pools: {
        texas: { name: "Texas Mining Pool", hashRate: Math.round((miningPower * 0.4) * 10) / 10, efficiency: 94.2 + Math.random() * 3, uptime: 99.1 + Math.random() * 0.8, temperature: 65 + Math.random() * 10, powerConsumption: Math.round(miningPower * 0.4 * 14), status: "operational" },
        nevada: { name: "Nevada Mining Pool", hashRate: Math.round((miningPower * 0.35) * 10) / 10, efficiency: 92.8 + Math.random() * 4, uptime: 98.9 + Math.random() * 1, temperature: 62 + Math.random() * 12, powerConsumption: Math.round(miningPower * 0.35 * 14), status: "operational" },
        wyoming: { name: "Wyoming Mining Pool", hashRate: Math.round((miningPower * 0.25) * 10) / 10, efficiency: 91.5 + Math.random() * 5, uptime: 99.3 + Math.random() * 0.6, temperature: 59 + Math.random() * 15, powerConsumption: Math.round(miningPower * 0.25 * 14), status: "operational" }
      },
      globalMetrics: { networkDifficulty: "72.45 T", blockReward: "6.25 BTC", energyCost: "$0.042/kWh", efficiency: "94.2%", nextHalving: "2028-04-20" }
    };

    res.status(200).json({
      success: true,
      data: miningOperations
    });

  } catch (error) {
    console.error('Get mining operations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching mining operations data'
    });
  }
};

// Get user notifications and alerts
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notifications = [
      { id: `notif_${Date.now()}_1`, type: "mining_reward", title: "Mining Reward Received", message: `You received $${Math.floor(Math.random() * 200 + 100)} in mining rewards`, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: false, priority: "medium" },
      { id: `notif_${Date.now()}_2`, type: "performance", title: "High Performance Alert", message: "Your mining efficiency is 3.2% above average this week", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), read: false, priority: "low" },
      { id: `notif_${Date.now()}_3`, type: "maintenance", title: "Scheduled Maintenance", message: "Mining pool maintenance scheduled for Dec 15, 2AM-4AM EST", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), read: true, priority: "high" }
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        totalCount: notifications.length
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notifications'
    });
  }
};
