// A session holds connected devices and clipboard history.
// Sessions are temporary and are removed after they expire.
// This keeps the same in-memory session model as the original server.
function newSession(code) {
  return {
    id: code,
    devices: new Map(),
    history: [],
    updatedAt: Date.now()
  };
}

function touch(session) {
  session.updatedAt = Date.now();
}

function publicDevices(session) {
  return [...session.devices.values()].map(d => ({
    id: d.id,
    name: d.name
  }));
}

module.exports = {
  newSession,
  touch,
  publicDevices
};
