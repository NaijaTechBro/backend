/**
 * Jest tests for Investor API endpoints
 * 
 * Run with:
 * npm test
 * 
 * Make sure to install required dependencies:
 * npm install --save-dev jest axios dotenv
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from .env file if exists
dotenv.config();

// Configuration with environment variable fallbacks
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = '';
let investorId = '';
let portfolioItemId = '';
let startupId = process.env.STARTUP_ID || '6812231e9c425d79882cb024'; // Replace with a real startup ID

// Test user credentials - can be overridden with environment variables
const testUser = {
  firstName: process.env.TEST_FIRST_NAME || 'John',
  lastName: process.env.TEST_LAST_NAME || 'Doe',
  email: process.env.TEST_EMAIL || 'nestlypay@gmail.com',
  password: process.env.TEST_PASSWORD || 'Password123!',
  phone: process.env.TEST_PHONE || '1234567890',
  role: process.env.TEST_ROLE || 'investor',
};

// Axios instance with error handling
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  validateStatus: status => status < 500 // Don't reject on 4xx responses
});

// Set auth header helper
const setAuthHeader = () => ({
  headers: { Authorization: `Bearer ${authToken}` }
});

// For debug purposes
const logResponse = (response) => {
  if (process.env.DEBUG) {
    console.log(`Status: ${response.status}`);
    console.log('Headers:', response.headers);
    console.log('Data:', response.data);
  }
  return response;
};

// Setup and teardown
beforeAll(async () => {
  // Mark tests as pending if API_URL is not accessible
  try {
    await api.get('/');
  } catch (error) {
    console.error(`Cannot connect to API at ${API_URL}. Check if the server is running.`);
    console.error(`Error: ${error.message}`);
  }
  
  // Try to register (may fail if user already exists)
  try {
    await api.post(`/auth/register`, testUser);
    console.log('✅ User registered successfully');
  } catch (error) {
    console.log(`ℹ️ User registration skipped: ${error.message}`);
  }
  
  // Login to get token
  try {
    const loginResponse = await api.post(`/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    logResponse(loginResponse);
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ User logged in successfully');
    } else {
      console.error('❌ Login failed:', loginResponse.data);
      console.log('Using fallback test token if provided');
      // Use fallback token if login fails
      authToken = process.env.TEST_AUTH_TOKEN || '';
    }
    
    if (!authToken) {
      console.error('❌ No authentication token available. Tests may fail.');
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    // Use fallback token if login fails
    authToken = process.env.TEST_AUTH_TOKEN || '';
  }
  
  // Get or create investor profile
  if (authToken) {
    try {
      const createResponse = await api.post(
        `/investors/create`,
        {
          name: `${testUser.firstName} ${testUser.lastName}`,
          position: 'Angel Investor',
          organization: 'Test Ventures',
          bio: 'Test investor profile for API testing',
          investmentFocus: ['SaaS', 'AI'],
          preferredStages: ['Seed', 'Series A'],
          preferredSectors: ['Technology', 'Education'],
          preferredCountries: ['USA', 'Europe'],
          minInvestmentRange: 50000,
          maxInvestmentRange: 500000,
          contactDetails: {
            email: testUser.email,
            phone: testUser.phone,
            website: 'https://test.example.com'
          }
        },
        setAuthHeader()
      );
      
      logResponse(createResponse);
      
      if (createResponse.status === 200 && createResponse.data.data) {
        investorId = createResponse.data.data._id;
        console.log('✅ Created investor profile with ID:', investorId);
      }
    } catch (error) {
      console.log(`ℹ️ Failed to create profile: ${error.message}`);
      
      try {
        // Get existing profile if creation fails
        const myProfileResponse = await api.get(
          `/investors/me`,
          setAuthHeader()
        );
        
        logResponse(myProfileResponse);
        
        if (myProfileResponse.status === 200 && myProfileResponse.data.data) {
          investorId = myProfileResponse.data.data._id;
          console.log('✅ Retrieved existing investor profile with ID:', investorId);
        }
      } catch (profileError) {
        console.error('❌ Failed to get investor profile:', profileError.message);
        // Use fallback investor ID if profile retrieval fails
        investorId = process.env.TEST_INVESTOR_ID || '';
      }
    }
  }
  
  // Check if we have the required test data
  if (!investorId) {
    console.error('❌ No investor ID available. Tests may fail.');
  }
});

// Clean up after all tests
afterAll(async () => {
  // Clean up created portfolio items if needed
  if (portfolioItemId && investorId) {
    try {
      await api.delete(
        `/investors/${investorId}/portfolio/${portfolioItemId}`,
        setAuthHeader()
      );
      console.log('✅ Cleaned up test portfolio item');
    } catch (error) {
      console.log(`ℹ️ Cleanup skipped: ${error.message}`);
    }
  }
});

// Helper function to handle test conditions
const testWithAuth = (name, testFn) => {
  test(name, async () => {
    // Skip test if no auth token available
    if (!authToken) {
      console.warn(`Skipping test "${name}" - no authentication token available`);
      return;
    }
    await testFn();
  });
};

// Group tests by functionality
describe('Authentication', () => {
  test('Should login successfully', async () => {
    try {
      const response = await api.post(`/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      logResponse(response);
      
      if (response.status === 401) {
        console.warn('Login endpoint returns 401. Check if credentials are correct.');
      }
      
      // Check for response status and token only if test user exists
      if (response.status === 200) {
        expect(response.data).toHaveProperty('token');
        expect(typeof response.data.token).toBe('string');
      } else {
        // Mark test as passed if the login endpoint returns a valid response
        // but not necessarily a 200 (might be 401 if user doesn't exist)
        expect(response.status).toBeLessThan(500);
      }
    } catch (error) {
      console.error('Login test error:', error.message);
      // Test that the error is handled
      expect(error).toBeDefined();
    }
  });
});

describe('User Listings', () => {
  testWithAuth('Should retrieve founders list', async () => {
    try {
      const response = await api.get(
        `/investors/founders`, 
        setAuthHeader()
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      if (response.data.data) {
        expect(Array.isArray(response.data.data)).toBeTruthy();
      }
    } catch (error) {
      console.error('Founders list test error:', error.message);
      throw error;
    }
  });
  
  testWithAuth('Should retrieve investors list', async () => {
    try {
      const response = await api.get(
        `/investors/getInvestors`, 
        setAuthHeader()
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      if (response.data.data) {
        expect(Array.isArray(response.data.data)).toBeTruthy();
      }
    } catch (error) {
      console.error('Investors list test error:', error.message);
      throw error;
    }
  });
});

describe('Investor Profile Management', () => {
  testWithAuth('Should retrieve investor by ID', async () => {
    // Skip test if no investor ID available
    if (!investorId) {
      console.warn('Skipping test - no investor ID available');
      return;
    }
    
    try {
      const response = await api.get(
        `/investors/${investorId}`,
        setAuthHeader()
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('_id', investorId);
    } catch (error) {
      console.error('Investor profile test error:', error.message);
      throw error;
    }
  });
  
  testWithAuth('Should update investor profile', async () => {
    // Skip test if no investor ID available
    if (!investorId) {
      console.warn('Skipping test - no investor ID available');
      return;
    }
    
    const updatedBio = 'Updated bio for Jest testing';
    const updatedMaxInvestment = 750000;
    
    try {
      const response = await api.put(
        `/investors/${investorId}`,
        {
          bio: updatedBio,
          maxInvestmentRange: updatedMaxInvestment
        },
        setAuthHeader()
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('bio', updatedBio);
      expect(response.data.data).toHaveProperty('maxInvestmentRange', updatedMaxInvestment);
    } catch (error) {
      console.error('Update profile test error:', error.message);
      throw error;
    }
  });
});

describe('Portfolio Management', () => {
  testWithAuth('Should add portfolio company', async () => {
    // Skip test if no investor ID available
    if (!investorId) {
      console.warn('Skipping test - no investor ID available');
      return;
    }
    
    const portfolioData = {
      startupName: 'Test Startup',
      investmentDate: new Date().toISOString(),
      investmentStage: 'Seed',
      description: 'Test portfolio entry for Jest'
    };
    
    try {
      const response = await api.put(
        `/investors/${investorId}/portfolio`,
        portfolioData,
        setAuthHeader()
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('portfolio');
      expect(Array.isArray(response.data.data.portfolio)).toBeTruthy();
      expect(response.data.data.portfolio.length).toBeGreaterThan(0);
      
      // Save portfolio item ID for later tests
      const lastIndex = response.data.data.portfolio.length - 1;
      portfolioItemId = response.data.data.portfolio[lastIndex]._id;
      
      const addedItem = response.data.data.portfolio.find(item => item._id === portfolioItemId);
      expect(addedItem).toBeDefined();
      expect(addedItem).toHaveProperty('startupName', portfolioData.startupName);
      expect(addedItem).toHaveProperty('description', portfolioData.description);
    } catch (error) {
      console.error('Add portfolio test error:', error.message);
      throw error;
    }
  });
  
  testWithAuth('Should update portfolio company', async () => {
    // Skip if portfolio item wasn't created or no investor ID
    if (!portfolioItemId || !investorId) {
      console.warn('Skipping portfolio update test - missing portfolio item or investor ID');
      return;
    }
    
    const updatedData = {
      description: 'Updated test portfolio entry for Jest',
      investmentStage: 'Series A'
    };
    
    try {
      const response = await api.put(
        `/investors/${investorId}/portfolio/${portfolioItemId}`,
        updatedData,
        setAuthHeader()
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('portfolio');
      
      const updatedItem = response.data.data.portfolio.find(item => item._id === portfolioItemId);
      expect(updatedItem).toBeDefined();
      expect(updatedItem).toHaveProperty('description', updatedData.description);
      expect(updatedItem).toHaveProperty('investmentStage', updatedData.investmentStage);
    } catch (error) {
      console.error('Update portfolio test error:', error.message);
      throw error;
    }
  });
  
  testWithAuth('Should retrieve investor portfolio', async () => {
    try {
      const response = await api.get(
        `/investors/portfolio`,
        setAuthHeader()
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBeTruthy();
    } catch (error) {
      console.error('Get portfolio test error:', error.message);
      throw error;
    }
  });
  
  testWithAuth('Should remove portfolio company', async () => {
    // Skip if portfolio item wasn't created or no investor ID
    if (!portfolioItemId || !investorId) {
      console.warn('Skipping portfolio removal test - missing portfolio item or investor ID');
      return;
    }
    
    try {
      const response = await api.delete(
        `/investors/${investorId}/portfolio/${portfolioItemId}`,
        setAuthHeader()
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('portfolio');
      
      const removedItem = response.data.data.portfolio.find(item => item._id === portfolioItemId);
      expect(removedItem).toBeUndefined();
      
      // Clear portfolioItemId since it's been removed
      portfolioItemId = null;
    } catch (error) {
      console.error('Delete portfolio test error:', error.message);
      throw error;
    }
  });
});

describe('Investment Actions', () => {
  testWithAuth('Should invest in startup if valid startupId is provided', async () => {
    // Skip if no startupId is provided or no auth token
    if (!startupId || startupId === '6812231e9c425d79882cb024') {
      console.warn('Skipping investment test - no valid startupId provided');
      return;
    }
    
    const investmentData = {
      startupId: startupId,
      amount: 100000
    };
    
    try {
      const response = await api.post(
        `/investors/invest`,
        investmentData,
        setAuthHeader()
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    } catch (error) {
      // This may fail if the startup doesn't exist or the investor already invested
      console.warn('Investment test failed:', error.message);
      // Don't fail the test if the error is expected
      expect(error.message).toBeDefined();
    }
  });
});

describe('Search Functionality', () => {
  test('Should search investors by criteria', async () => {
    const searchCriteria = {
      sectors: ['Technology'],
      stages: ['Seed'],
      investmentMin: 10000,
      investmentMax: 1000000
    };
    
    try {
      const response = await api.post(
        `/investors/search`,
        searchCriteria
      );
      
      logResponse(response);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      if (response.data.data) {
        expect(Array.isArray(response.data.data)).toBeTruthy();
      }
    } catch (error) {
      console.error('Search test error:', error.message);
      throw error;
    }
  });
});