// This file keeps clipboard item creation in one place.
// The server still stores encrypted clipboard data only.
// The item shape matches the original server code.
function createClipboardItem(item, device) {
  return {
    id: String(item.id).slice(0, 80),
    ciphertext: String(item.ciphertext),
    iv: String(item.iv || ''),
    salt: String(item.salt || ''),
    type: item.type === 'link' ? 'link' : 'text',
    deviceId: device.id,
    deviceName: device.name,
    createdAt: Number(item.createdAt) || Date.now(),
    burnAfterSync: Boolean(item.burnAfterSync)
  };
}

module.exports = { createClipboardItem };
