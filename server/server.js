const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const selfsigned = require('selfsigned');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const setupSocket = require('./socket');

const app = express();

function getLanIPv4() {
  const nets = os.networkInterfaces();

  for (const entries of Object.values(nets)) {
    for (const info of entries || []) {
      if (
        info.family === 'IPv4' &&
        !info.internal &&
        info.address !== '127.0.0.1'
      ) {
        return info.address;
      }
    }
  }

  return '127.0.0.1';
}

const LAN_IP = process.env.UNICLIP_HOST || getLanIPv4();
const CERT_DIR = path.join(__dirname, '.cert');
const KEY_FILE = path.join(CERT_DIR, 'server-key.pem');
const CERT_FILE = path.join(CERT_DIR, 'server-cert.pem');

function ensureCertificate() {
  fs.mkdirSync(CERT_DIR, { recursive: true });

  if (
    fs.existsSync(KEY_FILE) &&
    fs.existsSync(CERT_FILE)
  ) {
    return;
  }

  const attrs = [
    {
      name: 'commonName',
      value: LAN_IP
    }
  ];

  const altNames = [
    {
      type: 2,
      value: 'localhost'
    },
    {
      type: 7,
      ip: '127.0.0.1'
    },
    {
      type: 7,
      ip: LAN_IP
    }
  ];

  const pems = selfsigned.generate(attrs, {
    days: 825,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'subjectAltName',
        altNames
      }
    ]
  });

  fs.writeFileSync(KEY_FILE, pems.private);
  fs.writeFileSync(CERT_FILE, pems.cert);
}

ensureCertificate();

const isRender = Boolean(process.env.RENDER);

const server = isRender
  ? http.createServer(app)
  : https.createServer(
      {
        key: fs.readFileSync(KEY_FILE),
        cert: fs.readFileSync(CERT_FILE)
      },
      app
    );

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: false
  }
});

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
  if (isRender) {
    console.log(`UniClip running on http://0.0.0.0:${PORT}`);
  } else {
    console.log(`UniClip running on https://localhost:${PORT}`);
    console.log(`Phone/other devices: https://${LAN_IP}:${PORT}`);
  }
});