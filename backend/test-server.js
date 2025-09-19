const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('Starting test server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);

// Health check endpoint
app.get('/', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    message: 'Test Server Running',
    status: 'OK',
    port: PORT,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Additional health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Server error' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server successfully started on port ${PORT}`);
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
