const crypto = require('crypto');
const { newSession, touch, publicDevices } = require('./models/Session');
const {
  addClipboardItem,
  deleteClipboardItem,
  clearClipboard
} = require('./routes/clipboardRoutes');

const MAX_HISTORY = 100;
const SESSION_TTL_MS = 30 * 60 * 1000;

// Configures all real-time socket events
function setupSocket(io) {
  const sessions = new Map();// Stores active sessions in server memory

// Generates unique session identification code
  function makeCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      code += alphabet[crypto.randomInt(alphabet.length)];
    }

    return code;
  }
// Sanitizes and limits device names
  function cleanName(name) {
    return String(name || 'Device').trim().slice(0, 32) || 'Device';
  }

  function broadcastDevices(session) {
    io.to(session.id).emit(
      'devices:update',
      publicDevices(session)
    );
  }
// Sends current session state
  function sendState(socket, session) {
    socket.emit('session:state', {
      code: session.id,
      devices: publicDevices(session),
      history: session.history
    });
  }

  function removeSocket(socket) {
    const code = socket.data.sessionCode;

    if (!code) return;

    const session = sessions.get(code);

    if (!session) return;

    session.devices.delete(socket.id);
    touch(session);
    broadcastDevices(session);

    if (session.devices.size === 0) {
      session.updatedAt = Date.now();
    }
  }
// Handles incoming client socket connections
  io.on('connection', socket => {
    socket.on(
      'session:create',
      ({ deviceName, deviceId } = {}, ack = () => {}) => {
        let code;

        do {
          code = makeCode();
        } while (sessions.has(code));

        const session = newSession(code);
        sessions.set(code, session);
        socket.join(code);
        socket.data.sessionCode = code;

        session.devices.set(socket.id, {
          id: String(deviceId || socket.id),
          name: cleanName(deviceName)
        });

        touch(session);
        sendState(socket, session);
        broadcastDevices(session);
        ack({ ok: true, code });
      }
    );

    socket.on(
      'session:join',
      ({ code, deviceName, deviceId } = {}, ack = () => {}) => {
        const normalized = String(code || '')
          .trim()
          .toUpperCase();
        const session = sessions.get(normalized);

        if (!session) {
          return ack({
            ok: false,
            error: 'Session not found or expired.'
          });
        }

        if (session.devices.size >= 8) {
          return ack({
            ok: false,
            error: 'This session is full.'
          });
        }

        socket.join(normalized);
        socket.data.sessionCode = normalized;

        session.devices.set(socket.id, {
          id: String(deviceId || socket.id),
          name: cleanName(deviceName)
        });

        touch(session);
        sendState(socket, session);
        broadcastDevices(session);
        ack({ ok: true, code: normalized });
      }
    );

    socket.on('device:rename', ({ name } = {}) => {
      const session = sessions.get(socket.data.sessionCode);

      if (!session) return;

      const device = session.devices.get(socket.id);

      if (!device) return;

      device.name = cleanName(name);
      touch(session);
      broadcastDevices(session);
    });

    socket.on('clip:add', (item, ack = () => {}) => {
      const session = sessions.get(socket.data.sessionCode);

      if (!session) {
        return ack({
          ok: false,
          error: 'Invalid clipboard item.'
        });
      }

      const device = session.devices.get(socket.id);

      const result = addClipboardItem(
        session,
        item,
        device,
        MAX_HISTORY
      );

      if (!result.ok || result.duplicate) {
        return ack(result);
      }

      touch(session);
      io.to(session.id).emit('clip:add', result.item);
      ack({ ok: true });
    });

    socket.on('clip:delete', ({ id } = {}, ack = () => {}) => {
      const session = sessions.get(socket.data.sessionCode);

      if (!session) return ack({ ok: false });

      const changed = deleteClipboardItem(session, id);

      if (changed) {
        touch(session);
        io.to(session.id).emit('clip:delete', { id });
      }

      ack({ ok: true });
    });

    socket.on('clip:copy', ({ id } = {}, ack = () => {}) => {
      const session = sessions.get(socket.data.sessionCode);

      if (!session) return ack({ ok: false });

      const device = session.devices.get(socket.id);
      const item = session.history.find(x => x.id === id);

      if (!device || !item) return ack({ ok: false });

      if (item.burnAfterSync && item.deviceId !== device.id) {
        const changed = deleteClipboardItem(session, id);

        if (changed) {
          touch(session);
          io.to(session.id).emit('clip:delete', { id });
        }
      }

      ack({ ok: true });
    });

    socket.on('clip:clear', (ack = () => {}) => {
      const session = sessions.get(socket.data.sessionCode);

      if (!session) return ack({ ok: false });

      clearClipboard(session);
      touch(session);
      io.to(session.id).emit('clip:clear');
      ack({ ok: true });
    });

    socket.on('disconnect', () => removeSocket(socket));
  });
// Periodically removes expired inactive sessions
  setInterval(() => {
    const now = Date.now();

    for (const [code, session] of sessions) {
      if (
        now - session.updatedAt > SESSION_TTL_MS &&
        session.devices.size === 0
      ) {
        sessions.delete(code);
      }
    }
  }, 60_000).unref();
}

module.exports = setupSocket;
