const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({
    message: 'Backend API Running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8080,
    path: req.url
  }));
});

const port = process.env.PORT || 8080;
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on port ${port}`);
  console.log(`🌐 Listening on 0.0.0.0:${port}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});
