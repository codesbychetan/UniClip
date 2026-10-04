# UniClip

Real-time cross-device clipboard synchronization without accounts.

## Features
- Temporary sessions with 6-character pairing codes
- QR pairing
- Connected device list
- Explicit Clipboard API sync action
- Text + link detection
- Real-time WebSocket synchronization with Socket.IO
- Ordered, duplicate-safe clipboard history
- Copy old entries back to the clipboard
- Delete one / clear all history
- Automatic reconnection
- End-to-end encryption using Web Crypto API (server stores/transmits ciphertext only)
- Burn After Sync option
- Graceful clipboard permission/error handling
- Responsive UI for desktop and mobile

## Run locally

Requirements: Node.js 18+

```bash
npm install
npm start
```

Open http://localhost:3000 in two browser tabs/devices.

1. On device A, click **Create session**.
2. Share the pairing code or QR with device B.
3. On device B, enter the code and join.
4. Give each browser a different device name.
5. Click **Sync Clipboard** after copying text/link.

For two physical devices on the same Wi-Fi, run the server on your laptop and open:
`http://YOUR-LAN-IP:3000`

Clipboard access generally requires a secure context (`https://`) or localhost. For deployed use, host the app behind HTTPS.

## Project structure

- `server.js` - keeps the original `npm start` command working
- `server/server.js` - Express, HTTPS, QR route and server startup
- `server/socket.js` - Socket.IO session and real-time events
- `server/models/Session.js` - session data helpers
- `server/models/ClipboardItem.js` - encrypted clipboard item shape
- `server/routes/clipboardRoutes.js` - clipboard history helpers
- `public/index.html` - application shell
- `public/styles.css` - responsive styling
- `client/js/state.js` - client state and Socket.IO connection
- `client/js/ui.js` - small UI helpers
- `client/js/crypto.js` - Web Crypto helpers
- `client/js/main.js` - main client actions and events
- `package.json` - dependencies and scripts

## Security note
The server never receives plaintext clipboard content. The browser encrypts content with AES-GCM before sending it. The pairing code is used to derive the session key locally. Because the code is intentionally short for usability, do not treat it as a high-security secret; the app is designed for temporary clipboard sharing.

## Online deployment
Any Node.js host supporting WebSockets can run this project. Set the start command to `npm start` and expose port `3000` (or use the platform-provided `PORT`). The included server reads `process.env.PORT`.
