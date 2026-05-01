require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/database');
const { getDashboard } = require('./controllers/taskController');
const { authenticate } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health Check Endpoint (Railway needs this to show "Active")
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects/:projectId/tasks', require('./routes/tasks'));
app.get('/api/dashboard', authenticate, getDashboard);

// 404 Handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    console.log('Initializing Database...');
    await initDB();
    
    // Bind to 0.0.0.0 to allow Railway's network to reach the container
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is live on port ${PORT}`);
      console.log(`Health check available at: /api/health`);
    });
  } catch (error) {
    console.error('Critical Failure: Could not start server:', error);
    process.exit(1);
  }
};

start();