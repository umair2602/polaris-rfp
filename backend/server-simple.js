const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const rfpRoutes = require('./routes/rfp-simple');
const proposalRoutes = require('./routes/proposals-simple');
const templateRoutes = require('./routes/templates-simple');
const contentRoutes = require('./routes/content');
const googleDriveRoutes = require('./routes/googledrive-simple');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://main.d2ds3speyvmfi1.amplifyapp.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/rfp', rfpRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/googledrive', googleDriveRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'RFP Proposal Generation System API',
    version: '1.0.0',
    status: 'running',
    mode: 'simple (no MongoDB required)'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API documentation: http://0.0.0.0:${PORT}/`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`💾 Mode: Simple (in-memory storage)`);
  console.log(`👤 Default login: admin / admin123`);
});