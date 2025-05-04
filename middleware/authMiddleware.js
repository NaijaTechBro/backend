// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request
    req.user = await User.findById(decoded.id);
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};




// // server/middleware/auth.js
// const jwt = require('jsonwebtoken');
// const User = require('../models/userModel');
// const roleMiddleware = require('../middleware/roleVerifyMiddleware');

// // Middleware to protect routes
// exports.protect = async (req, res, next) => {
//   try {
//     let token;
    
//     // Check for token in headers or cookies (prioritize Authorization header)
//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//       token = req.headers.authorization.split(' ')[1];
//     } else if (req.cookies && req.cookies.token) {
//       token = req.cookies.token;
//     }
    
//     // Check if token exists
//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized to access this route'
//       });
//     }
    
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Fetch user data with fields needed for most role-based middleware
//     // This prevents additional DB queries in subsequent middleware
//     const user = await User.findById(decoded.id)
//       .select('_id email role isRoleVerified roleVerificationStatus');
    
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'The user belonging to this token no longer exists'
//       });
//     }
    
//     // Attach user to request for use in other middleware/controllers
//     req.user = user;
//     next();
//   } catch (err) {
//     if (err.name === 'JsonWebTokenError') {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid token'
//       });
//     } else if (err.name === 'TokenExpiredError') {
//       return res.status(401).json({
//         success: false,
//         message: 'Token expired'
//       });
//     } else {
//       console.error('Auth middleware error:', err);
//       return res.status(500).json({
//         success: false,
//         message: 'Server error during authentication'
//       });
//     }
//   }
// };

// // Role-based authorization middleware
// exports.authorize = (...roles) => {
//   return (req, res, next) => {
//     // Check if user has the required role
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `User role '${req.user.role}' is not authorized to access this route`
//       });
//     }
//     next();
//   };
// };

// // Export role middleware functions
// exports.verifyRole = roleMiddleware.verifyRole;
// exports.founderOnly = roleMiddleware.founderOnly;
// exports.investorOnly = roleMiddleware.investorOnly;
// exports.founderOrInvestor = roleMiddleware.founderOrInvestor;

// // Combine middleware for common use cases
// exports.protectedFounderRoute = [exports.protect, roleMiddleware.founderOnly];
// exports.protectedInvestorRoute = [exports.protect, roleMiddleware.investorOnly];
// exports.protectedAdminRoute = [exports.protect, exports.authorize('admin')];

// // Token validation without full user lookup - useful for lightweight auth checks
// exports.validateToken = (req, res, next) => {
//   try {
//     let token;
    
//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//       token = req.headers.authorization.split(' ')[1];
//     } else if (req.cookies && req.cookies.token) {
//       token = req.cookies.token;
//     }
    
//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized to access this route'
//       });
//     }
    
//     // Verify token but don't look up user in database
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Just attach the decoded payload to the request
//     req.tokenPayload = decoded;
//     next();
//   } catch (err) {
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid token'
//     });
//   }
// };