// server/controllers/viewController.js
const View = require('../../models/startup/viewModel');
const Startup = require('../../models/startup/startupModel');

// Record a view when user visits a startup profile
exports.recordView = async (req, res) => {
  try {
    const { startupId } = req.params;
    
    // Check if startup exists
    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }
    
    // If user is logged in, check if they've viewed this startup recently
    let userId = null;
    let preventDuplicate = false;
    
    if (req.user) {
      userId = req.user.id;
      
      // Check if this user has viewed this startup in the last 24 hours
      const recentView = await View.findOne({
        startup: startupId,
        user: userId,
        createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      if (recentView) {
        preventDuplicate = true;
      }
    }
    
    // Get client IP address for anonymous views
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // For anonymous users, check if this IP has viewed this startup recently
    if (!userId && ip) {
      const recentAnonymousView = await View.findOne({
        startup: startupId,
        ip,
        createdAt: { $gt: new Date(Date.now() - 6 * 60 * 60 * 1000) } // 6 hours for anonymous users
      });
      
      if (recentAnonymousView) {
        preventDuplicate = true;
      }
    }
    
    // Don't create duplicate views within the time period
    if (!preventDuplicate) {
      // Create view record
      await View.create({
        startup: startupId,
        user: userId,
        ip,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
      
      // Update total views on startup model
      await Startup.findByIdAndUpdate(startupId, {
        $inc: { viewCount: 1 }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'View recorded'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get view statistics for a startup (founder only)
exports.getStartupViewStats = async (req, res) => {
  try {
    const { startupId } = req.params;
    const { period } = req.query; // day, week, month, year, all
    
    // Check if startup exists
    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }
    
    // Check if user is authorized to view stats
    if (startup.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view these statistics'
      });
    }
    
    // Set date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'day':
        dateFilter = { 
          createdAt: { 
            $gte: new Date(now.setHours(0, 0, 0, 0)) 
          } 
        };
        break;
      case 'week':
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateFilter = { 
          createdAt: { 
            $gte: lastWeek 
          } 
        };
        break;
      case 'month':
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateFilter = { 
          createdAt: { 
            $gte: lastMonth 
          } 
        };
        break;
      case 'year':
        const lastYear = new Date(now);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        dateFilter = { 
          createdAt: { 
            $gte: lastYear 
          } 
        };
        break;
      default:
        // All time - no filter
        dateFilter = {};
    }
    
    // Get total view count
    const totalViews = await View.countDocuments({
      startup: startupId,
      ...dateFilter
    });
    
    // Get unique viewer count (user-based)
    const uniqueUserViews = await View.distinct('user', {
      startup: startupId,
      user: { $ne: null },
      ...dateFilter
    });
    
    // Get unique anonymous views (IP-based)
    const uniqueAnonymousViews = await View.distinct('ip', {
      startup: startupId,
      user: null,
      ...dateFilter
    });
    
    // Get view trends by day
    const startDate = period === 'day' ? new Date(now.setHours(0, 0, 0, 0)) :
                     period === 'week' ? new Date(now.setDate(now.getDate() - 7)) :
                     period === 'month' ? new Date(now.setMonth(now.getMonth() - 1)) :
                     period === 'year' ? new Date(now.setFullYear(now.getFullYear() - 1)) :
                     new Date(now.setFullYear(now.getFullYear() - 5)); // Default to 5 years for "all"
    
    const viewTrends = await View.aggregate([
      {
        $match: {
          startup: startup._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalViews,
        uniqueViewers: uniqueUserViews.length + uniqueAnonymousViews.length,
        registeredViewers: uniqueUserViews.length,
        anonymousViewers: uniqueAnonymousViews.length,
        trends: viewTrends
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get view statistics for all startups owned by current user
exports.getAllStartupsViewStats = async (req, res) => {
  try {
    // Find all startups owned by this user
    const startups = await Startup.find({ createdBy: req.user.id }).select('_id name viewCount');
    
    if (startups.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No startups found'
      });
    }
    
    const startupIds = startups.map(startup => startup._id);
    
    // Get recent views (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentViews = await View.aggregate([
      {
        $match: {
          startup: { $in: startupIds },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$startup',
          recentViews: { $sum: 1 }
        }
      }
    ]);
    
    // Format the response
    const statsData = startups.map(startup => {
      const recentViewData = recentViews.find(v => v._id.equals(startup._id));
      
      return {
        id: startup._id,
        name: startup.name,
        totalViews: startup.viewCount || 0,
        recentViews: recentViewData ? recentViewData.recentViews : 0
      };
    });
    
    res.status(200).json({
      success: true,
      data: statsData
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};