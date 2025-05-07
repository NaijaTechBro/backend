/**
 * Jest configuration for Investor API tests
 */

module.exports = {
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
  
    // The directory where Jest should output its coverage files
    coverageDirectory: "coverage",
  
    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,
  
    // The test environment that will be used for testing
    testEnvironment: "node",
  
    // The glob patterns Jest uses to detect test files
    testMatch: [
      "**/__tests__/**/*.js?(x)",
      "**/?(*.)+(spec|test).js?(x)"
    ],
  
    // An array of regexp pattern strings that are matched against all test paths
    // before executing the test
    testPathIgnorePatterns: [
      "/node_modules/"
    ],
  
    // Default timeout for tests in milliseconds
    testTimeout: 10000,
  
    // Verbose output
    verbose: true
  };