const express = require('express'); // Creates main Express application instance
const http = require('http'); // Creates HTTP server for Socket.IO
const path = require('path'); // Provides filesystem path utilities
const { Server } = require('socket.io'); // Imports Socket.IO server functionality
const QRCode = require('qrcode'); // Generates QR codes for sessions
const setupSocket = require('./socket'); // Imports socket event setup logic

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: false
  }
});
// Defines server port from environment
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/js', express.static(path.join(__dirname, '..', 'client', 'js')));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'UniClip'
  });
});

app.get('/qr', async (req, res) => {
  try {
    const data = String(req.query.data || '');

    if (!data || data.length > 2000) {
      return res.status(400).json({
        error: 'Invalid QR data'
      });
    }

    const png = await QRCode.toBuffer(data, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M'
    });

    res.type('png').send(png);
  } catch {
    res.status(400).json({
      error: 'QR generation failed'
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(
    path.join(__dirname, '..', 'public', 'index.html')
  );
});

setupSocket(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`UniClip running on port ${PORT}`);
});