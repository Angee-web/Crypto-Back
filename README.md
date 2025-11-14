# Institutional Miner Backend API

A Node.js/Express backend API for the Institutional Miner platform with user authentication, dashboard data management, and admin controls.

## Features

- **User Authentication**: Registration and login with JWT tokens
- **User Dashboard**: Personalized mining and portfolio data for each user
- **Admin Management**: Admins can update user dashboard data and manage accounts
- **Security**: Rate limiting, CORS, helmet, input validation
- **Database**: MongoDB with Mongoose ODM

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   Copy the `.env` file and update with your settings:
   ```
   MONGODB_URI=mongodb://localhost:27017/institutional-miner
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=development
   ADMIN_EMAIL=admin@institutionalminer.com
   ADMIN_PASSWORD=admin123456
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` and automatically create an admin user.

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:** User object with JWT token

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:** User object with JWT token

#### Get Profile
- **GET** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Current user profile

### Dashboard Routes (`/api/dashboard`)

#### Get Dashboard Data
- **GET** `/api/dashboard`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Complete dashboard data including portfolio, mining pools, metrics, transactions, and alerts

#### Get Mining Operations
- **GET** `/api/dashboard/mining-operations`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Mining operations status and metrics

### Admin Routes (`/api/admin`)

All admin routes require admin authentication.

#### Get Dashboard Statistics
- **GET** `/api/admin/stats`
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** Platform statistics (total users, portfolio values, etc.)

#### Get All Users
- **GET** `/api/admin/users?page=1&limit=10`
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** Paginated list of users

#### Get User by ID
- **GET** `/api/admin/users/:userId`
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** Specific user details

#### Update User Dashboard Data
- **PUT** `/api/admin/users/:userId/dashboard`
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:**
  ```json
  {
    "portfolioValue": 150000,
    "miningPower": 45.5,
    "monthlyEarnings": 4200,
    "availableBalance": 12000,
    "miningPools": {
      "texas": { "hashRate": 200.5, "efficiency": 75 },
      "nevada": { "hashRate": 180.2, "efficiency": 70 },
      "wyoming": { "hashRate": 120.8, "efficiency": 65 }
    },
    "metrics": {
      "growthPercentage": 15.2,
      "uptimePercentage": 99.9,
      "monthlyGrowth": 12.5
    }
  }
  ```

#### Update User Information
- **PUT** `/api/admin/users/:userId/info`
- **Headers:** `Authorization: Bearer <admin-token>`
- **Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "plan": "Enterprise",
    "isActive": true
  }
  ```

#### Delete User
- **DELETE** `/api/admin/users/:userId`
- **Headers:** `Authorization: Bearer <admin-token>`

## Default Admin Account

When the server starts, it automatically creates an admin account:
- **Email:** `admin@institutionalminer.com`
- **Password:** `admin123456`

**Important:** Change these credentials in production!

## User Data Structure

Each user has the following dashboard data that admins can update:

```javascript
{
  portfolioValue: Number,      // Total portfolio value in USD
  miningPower: Number,         // Mining power in TH/s
  monthlyEarnings: Number,     // Monthly earnings in USD
  availableBalance: Number,    // Available balance for withdrawal
  miningPools: {
    texas: { hashRate: Number, efficiency: Number },
    nevada: { hashRate: Number, efficiency: Number },
    wyoming: { hashRate: Number, efficiency: Number }
  },
  metrics: {
    growthPercentage: Number,
    uptimePercentage: Number,
    monthlyGrowth: Number,
    networkDifficulty: String,
    blockReward: String,
    energyCost: String
  }
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Validates all user inputs
- **CORS**: Configured for frontend integration
- **Helmet**: Adds security headers
- **Password Hashing**: Uses bcryptjs for secure password storage

## Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // For validation errors
}
```

## Development

To add new features:

1. **Models**: Add to `src/models/`
2. **Controllers**: Add to `src/controllers/`
3. **Routes**: Add to `src/routes/`
4. **Middleware**: Add to `src/middleware/`

## Testing

Test the API endpoints using tools like:
- Postman
- Insomnia
- curl
- Frontend integration

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure production MongoDB instance
4. Set up proper logging
5. Use a process manager like PM2
6. Configure reverse proxy (nginx)
7. Enable SSL/TLS# Crypto-Back
