const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🔍 Debug server starting...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);

// Basic middleware
app.use(express.json());

// Simple health check
app.get('/', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    message: 'Debug Server Running',
    status: 'OK',
    port: PORT,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Debug server successfully started on port ${PORT}`);
  console.log(`🌐 Server listening on 0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
