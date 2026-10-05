// Creates new temporary session object
function newSession(code) {
  return {
    id: code,
    devices: new Map(),
    history: [],
    updatedAt: Date.now()
  };
}
// Updates session activity timestamp
function touch(session) {
  session.updatedAt = Date.now();
}
// Returns safe public device information
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
