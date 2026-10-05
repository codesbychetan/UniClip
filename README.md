# UniClip – Real-Time Cross-Device Clipboard Sync

A minimal and secure web application that allows users to **synchronize text and links between multiple devices in real time** without creating an account.

Each session uses a temporary 6-character pairing code, allowing devices to connect quickly and share clipboard content securely.

## Live Demo

- **Frontend:** https://uniclip-pi.vercel.app
- **Backend:** https://uniclip-backend.onrender.com

---

## Features

### Core

- **Real-Time Clipboard Sync** — Synchronize copied text and links between connected devices.
- **No Login Needed** — Create or join a session without creating an account.
- **Temporary Sessions** — Each session uses a 6-character pairing code.
- **QR Pairing** — Join a session by scanning the generated QR code.
- **Connected Devices** — View all devices currently connected to the session.
- **Explicit Sync Action** — Clipboard content is synced only when the user clicks **Sync Clipboard**.
- **Text & Link Detection** — Automatically detects whether the copied content is text or a link.
- **Clipboard History** — View previously synchronized clipboard items.
- **Copy Previous Items** — Copy any previous synced item back to the clipboard.
- **Delete & Clear History** — Delete individual items or clear the complete session history.
- **Automatic Reconnection** — Reconnects automatically if the connection is temporarily lost.

### Security

- **End-to-End Encryption** — Clipboard content is encrypted in the browser before being sent to the server.
- **Web Crypto API** — Uses AES-GCM encryption for clipboard data.
- **Ciphertext Only on Server** — The server does not receive or store plaintext clipboard content.
- **Burn After Sync** — Optionally remove clipboard content after it is copied on another device.

---

## Tech Stack

**Frontend:**

- HTML
- CSS
- JavaScript
- Web Crypto API
- Clipboard API
- Socket.IO Client

**Backend:**

- Node.js
- Express.js
- Socket.IO
- HTTPS

**Other:**

- QR Code Generation
- AES-GCM Encryption
- Temporary In-Memory Session Storage

---

## Preview

> Example UI:

- **Landing Page:**
  - Enter device name.
  - Create a new session or join an existing session.
  - Enter a 6-character pairing code.

- **Session Workspace:**
  - View connected devices.
  - Copy the pairing code.
  - Generate a QR code.
  - Sync clipboard content.
  - Enable Burn After Sync.
  - View clipboard history.
  - Copy or delete previous entries.

---

## Video Demonstration

[Watch Demo](https://drive.google.com/file/d/1ki8h8AioHx65t7NyMAFCh5pb3yGJxTqH/view?usp=sharing)