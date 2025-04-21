const rateLimit = require('express-rate-limit');


// Rate limiting with more appropriate limits
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes window
    max: 300, // Increased from 100 to 300 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 10 minutes',
    // Skip rate limiting for certain routes if needed
    skip: (req, res) => {
      // Example: Skip rate limiting for static assets or health checks
      return req.path.startsWith('/public/') || req.path === '/health';
    },
    // Store client information in memory by IP and route
    keyGenerator: (req, res) => {
      return req.ip + '-' + req.path;
    }
  });
  
  // For routes that need higher limits (like auth)
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50, // 50 requests per 10 minutes
    message: 'Too many authentication attempts, please try again after 10 minutes'
  });
  

  
module.exports = errorHandler = {limiter, authLimiter}; // Export the rate limiter middleware for use in your routes