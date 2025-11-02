// Update server.js to serve static files in production
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
// Support multiple client origins via CLIENT_URLS env var (comma-separated),
// or a single CLIENT_URL. Trim trailing slashes to avoid mismatches.
const rawClientUrls = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = rawClientUrls.split(',').map(u => (u || '').trim().replace(/\/$/, ''));

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g., curl, server-to-server) when origin is undefined
    if (!origin) return callback(null, true);
    
    // Remove trailing slash for consistency
    const cleaned = origin.replace(/\/$/, '');
    
    // Check exact matches first
    if (allowedOrigins.indexOf(cleaned) !== -1) {
      return callback(null, true);
    }
    
    // Allow all Vercel preview URLs for this project
    if (cleaned.match(/^https:\/\/collaborative-text-editor-with-ai.*\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (cleaned.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    console.warn('CORS blocked for origin:', origin, 'allowedOrigins:', allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const aiRoutes = require('./routes/ai');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Socket.io connection handling
require('./websockets/socketHandler')(io);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative-editor', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
