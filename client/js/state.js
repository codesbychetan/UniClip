const socket = io('https://uniclip-backend.onrender.com',{
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 5000
});

const $ = id => document.getElementById(id);
// Stores shared application state
const state = {
  code: null,
  deviceId: null,
  deviceName: 'Device',
  key: null,
  history: new Map(),
  connected: false
};
// Generates unique identifier for device
function makeId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  if (crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return [...bytes]
      .map((b, i) => {
        const h = b.toString(16).padStart(2, '0');
        return ([4, 6, 8, 10].includes(i) ? '-' : '') + h;
      })
      .join('');
  }

  return Date.now().toString(36) + '-' +
    Math.random().toString(36).slice(2) + '-' +
    Math.random().toString(36).slice(2);
}
// Restores or creates persistent device identifier
state.deviceId =
  localStorage.getItem('uniclip-device-id') || makeId();
// Clears device name input initially
localStorage.setItem('uniclip-device-id', state.deviceId);
$('deviceName').value = '';
