# ShelterSeek

A full-stack accommodation booking platform built with React and Node.js. ShelterSeek connects travelers with hosts, allowing users to browse, book, and manage accommodations with features like real-time chat, interactive maps, and secure payment processing.

## Team Members

1. Sumukesh Reddy
2. Jhansi
3. Jashwanth
4. Pruthvi natha Reddy
5. Venkata sai Reddy

## Features

- **User Management**: Three types of accounts - Travelers, Hosts, and Admins
- **Authentication**: Secure login/signup with Google OAuth support
- **Room Listings**: Browse and search available accommodations with filters
- **Interactive Maps**: Explore locations using Leaflet maps
- **Real-time Chat**: Socket.IO-powered messaging between users
- **Booking System**: Reserve rooms with availability calendar
- **Payment Processing**: Secure payment handling
- **Admin Dashboard**: Manage users, listings, and view analytics
- **Host Dashboard**: Manage listings, bookings, and requests
- **Wishlist**: Save favorite accommodations
- **Chatbot**: AI-powered assistance using Google GenAI

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (running locally or MongoDB Atlas connection string)
- **Redis** (running locally on port 6379 for caching)
- **Git**

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sumukesh-Reddy/shelterseek-react.git
   cd shelterseek-react
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Connection Strings (MongoDB Atlas format)
# Replace with your MongoDB Atlas cluster connection strings
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/loginDataBase?retryWrites=true&w=majority
HOST_ADMIN_URI=mongodb+srv://username:password@cluster.mongodb.net/Host_Admin?retryWrites=true&w=majority
ADMIN_TRAVELER_URI=mongodb+srv://username:password@cluster.mongodb.net/Admin_Traveler?retryWrites=true&w=majority
PAYMENT_DB_URI=mongodb+srv://username:password@cluster.mongodb.net/payment?retryWrites=true&w=majority

# Alternative: For local MongoDB, use this format instead:
# MONGODB_URI=mongodb://localhost:27017/loginDataBase
# HOST_ADMIN_URI=mongodb://localhost:27017/Host_Admin
# ADMIN_TRAVELER_URI=mongodb://localhost:27017/Admin_Traveler
# PAYMENT_DB_URI=mongodb://localhost:27017/payment

# Session Secret (use a strong random string in production)
SESSION_SECRET=your-secret-key-here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=90d

# Email Configuration (for password reset and notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth (for Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
GOOGLE_API_KEY=your-google-api-key

# Frontend URLs (optional)
FRONTEND_LOGIN_URL=http://localhost:3000/login
FRONTEND_DASHBOARD_URL=http://localhost:3000/dashboard

# Google GenAI API Key (for chatbot)
GOOGLE_GENAI_API_KEY=your-genai-api-key
```

**Note**: 
- For MongoDB Atlas, use the `mongodb+srv://` format with your cluster credentials
- For local MongoDB, use the `mongodb://localhost:27017/` format
- Replace all placeholder values with your actual credentials
- Never commit your `.env` file to version control

### Redis Setup (Required for Caching)

Caching is enabled by default to improve performance. For this to work, you must have Redis running locally.

**On macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**On Windows:**
Download and install [Redis for Windows](https://github.com/tporadowski/redis/releases) or use WSL2.

**Using Docker (Easiest):**
```bash
docker-compose up -d redis
```

You can check if Redis is connected by visiting `http://localhost:3001/health` or checking the **System** section in Swagger docs at `http://localhost:3001/api-docs`.

### Frontend Configuration

The frontend typically runs on port 3000 by default. Make sure your backend API URL matches your backend server configuration.

## Running the Application

You'll need to run both the backend and frontend servers simultaneously.

### Option 1: Run in Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
node app.js
```

The backend server will start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

### Option 2: Run Both with npm scripts (if configured)

If you have scripts set up in the root `package.json`, you can run both servers together.

## Project Structure

```
shelterseek-react/
├── backend/
│   ├── app.js                 # Main server file
│   ├── config/
│   │   └── passport.js        # Google OAuth configuration
│   ├── controllers/           # Route controllers
│   ├── model/                 # MongoDB models
│   ├── routes/                # API routes
│   └── public/                # Static files and uploads
│
└── frontend/
    ├── public/                # Static assets
    └── src/
        ├── components/        # Reusable React components
        ├── pages/             # Page components
        ├── contexts/          # React contexts (Auth, Socket)
        └── store/             # Redux store
```

## Technologies Used

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **Passport.js** - Authentication
- **JWT** - Token-based authentication
- **Nodemailer** - Email services
- **Multer** - File uploads


### Frontend
- **React** - UI library
- **React Router** - Routing
- **Redux** - State management
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **Leaflet** - Interactive maps
- **React Leaflet** - React wrapper for Leaflet
- **Font Awesome** - Icons

## Default Ports

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`

## Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running locally, or
- Update the MongoDB URI in your `.env` file to point to your MongoDB Atlas cluster

### Port Already in Use
- If port 3000 or 3001 is already in use, you can:
  - Change the frontend port: `PORT=3002 npm start` in the frontend directory
  - Change the backend port: Update `PORT` in the backend `.env` file

### Email Not Working
- Make sure you've set up `EMAIL_USER` and `EMAIL_PASS` in your `.env` file
- For Gmail, you may need to use an App Password instead of your regular password
- Test email configuration by visiting: `http://localhost:3001/test-email-config`

### CORS Issues
- Make sure your frontend URL is allowed in the backend CORS configuration
- Check that both servers are running on the correct ports




# shelterseek-dubug
