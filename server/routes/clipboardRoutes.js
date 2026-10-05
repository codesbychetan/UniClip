const { createClipboardItem } = require('../models/ClipboardItem');
// Adds encrypted item to session history
function addClipboardItem(session, item, device, maxHistory) {
  if (
    !session ||
    !item ||
    !item.id ||
    !item.ciphertext
  ) {
    return {
      ok: false,
      error: 'Invalid clipboard item.'
    };
  }

  if (session.history.some(x => x.id === item.id)) {
    return {
      ok: true,
      duplicate: true
    };
  }

  if (!device) {
    return {
      ok: false,
      error: 'Device is not connected to a session.'
    };
  }

  const safe = createClipboardItem(item, device);

  session.history.push(safe);
  session.history.sort((a, b) => a.createdAt - b.createdAt);

  if (session.history.length > maxHistory) {
    session.history = session.history.slice(-maxHistory);
  }

  return {
    ok: true,
    item: safe
  };
}
// Removes clipboard item from session history
function deleteClipboardItem(session, id) {
  const before = session.history.length;
  session.history = session.history.filter(x => x.id !== id);

  return session.history.length !== before;
}
// Clears all clipboard history items
function clearClipboard(session) {
  session.history = [];
}

module.exports = {
  addClipboardItem,
  deleteClipboardItem,
  clearClipboard
};
