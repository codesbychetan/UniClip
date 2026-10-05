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
