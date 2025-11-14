#!/usr/bin/env node

// Simple API test script
const baseURL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'password123'
};

const adminCredentials = {
  email: 'admin@institutionalminer.com',
  password: 'admin123456'
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    console.log(`${options.method || 'GET'} ${endpoint}:`, response.status, data.success ? '✅' : '❌');
    return { response, data };
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return null;
  }
}

async function testAPI() {
  console.log('🚀 Testing Institutional Miner Backend API\n');

  // 1. Test health endpoint
  await apiRequest('/health');

  // 2. Test user registration
  const registerResult = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });

  if (!registerResult?.data.success) {
    console.log('📝 User might already exist, trying login...\n');
  }

  // 3. Test user login
  const loginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });

  const userToken = loginResult?.data.data.token;

  if (userToken) {
    // 4. Test user dashboard
    await apiRequest('/dashboard', {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    // 5. Test mining operations
    await apiRequest('/dashboard/mining-operations', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
  }

  // 6. Test admin login
  const adminLoginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(adminCredentials)
  });

  const adminToken = adminLoginResult?.data.data.token;

  if (adminToken) {
    // 7. Test admin endpoints
    await apiRequest('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    await apiRequest('/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  console.log('\n✅ API Testing Complete!');
  console.log('\n📚 Available endpoints:');
  console.log('- POST /api/auth/register - Register new user');
  console.log('- POST /api/auth/login - User login');
  console.log('- GET /api/auth/profile - Get user profile');
  console.log('- GET /api/dashboard - Get dashboard data');
  console.log('- GET /api/dashboard/mining-operations - Get mining operations');
  console.log('- GET /api/admin/stats - Admin dashboard stats');
  console.log('- GET /api/admin/users - Get all users (admin)');
  console.log('- PUT /api/admin/users/:id/dashboard - Update user dashboard (admin)');
  console.log('- PUT /api/admin/users/:id/info - Update user info (admin)');
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPI().catch(console.error);
}