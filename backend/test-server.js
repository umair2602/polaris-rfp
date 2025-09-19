const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

// Simple health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Test Server Running',
    status: 'OK',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});
