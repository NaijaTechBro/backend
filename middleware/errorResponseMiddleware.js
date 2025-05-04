/**
 * @desc    Custom error response class for API errors
 * @extends Error
 */
class ErrorResponse extends Error {
    /**
     * Create a formatted error response
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {Object} [errors=null] - Additional error details (for validation errors)
     */
    constructor(message, statusCode, errors = null) {
      super(message);
      this.statusCode = statusCode;
      this.errors = errors;
      
      // Add timestamp for logging purposes
      this.timestamp = new Date().toISOString();
      
      // Capture stack trace (excluding constructor call)
      Error.captureStackTrace(this, this.constructor);
    }
  
    /**
     * Creates a formatted error object for response
     * @returns {Object} Formatted error response
     */
    toJSON() {
      const response = {
        success: false,
        error: {
          statusCode: this.statusCode,
          message: this.message
        }
      };
  
      // Add validation errors if present
      if (this.errors) {
        response.error.errors = this.errors;
      }
  
      return response;
    }
  }
  
  module.exports = ErrorResponse;