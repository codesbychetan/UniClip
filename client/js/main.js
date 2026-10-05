async function startSession(mode) {
  clearError();

  const name = ($('deviceName').value || 'Device').trim();

  if (!name) {
    error('Please enter a device name.');
    return;
  }

  state.deviceName = name;

  const code = mode === 'create'
    ? null
    : $('joinCode').value.trim().toUpperCase();

  if (mode === 'join' && code.length !== 6) {
    error('Enter the 6-character pairing code.');
    return;
  }

  const event = mode === 'create'
    ? 'session:create'
    : 'session:join';

  socket.emit(
    event,
    mode === 'create'
      ? {
          deviceName: name,
          deviceId: state.deviceId
        }
      : {
          code,
          deviceName: name,
          deviceId: state.deviceId
        },
    res => {
      if (!res?.ok) {
        error(res?.error || 'Could not start session.');
        return;
      }

      state.code = res.code;
      state.key = null;
      $('sessionCode').textContent = res.code;
      showWorkspace();

      history.pushState(
        { uniclipSession: true },
        '',
        location.pathname
      );

      toast(
        mode === 'create'
          ? 'Session created'
          : 'Joined session'
      );
    }
  );
}

$('createBtn').onclick = () => startSession('create');
$('joinBtn').onclick = () => startSession('join');

$('joinCode').oninput = e => {
  e.target.value = e.target.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};

$('copyCodeBtn').onclick = async () => {
  await navigator.clipboard.writeText(state.code);
  toast('Pairing code copied');
};

function leaveSession() {
  state.code = null;
  state.key = null;
  state.history.clear();
  $('sessionCode').textContent = '------';
  $('workspace').classList.add('hidden');
  $('landing').classList.remove('hidden');
  $('syncMessage').classList.add('hidden');
  socket.disconnect();
  socket.connect();
}

$('leaveBtn').onclick = () => history.back();

window.addEventListener('popstate', () => {
  if (!$('workspace').classList.contains('hidden')) {
    leaveSession();
  }
});

socket.on('connect', () => {
  setStatus(true);

  if (
    state.code &&
    !$('workspace').classList.contains('hidden')
  ) {
    socket.emit(
      'session:join',
      {
        code: state.code,
        deviceName: state.deviceName,
        deviceId: state.deviceId
      },
      res => {
        if (!res?.ok) {
          toast('Session expired - please create a new session');
          state.code = null;
        }
      }
    );
  }
});

socket.on('disconnect', () => setStatus(false));

socket.on('session:state', async data => {
  state.code = data.code;
  $('sessionCode').textContent = data.code;
  state.history.clear();

  for (const item of data.history || []) {
    state.history.set(item.id, item);
  }

  renderDevices(data.devices || []);
  await renderHistory();
});

socket.on('devices:update', renderDevices);

socket.on('clip:add', async item => {
  if (!state.history.has(item.id)) {
    state.history.set(item.id, item);
    await renderHistory();

    if (item.deviceId !== state.deviceId) {
      toast(`New ${item.type} synced`);
    }
  }
});

socket.on('clip:delete', async ({ id }) => {
  state.history.delete(id);
  await renderHistory();
});

socket.on('clip:clear', async () => {
  state.history.clear();
  await renderHistory();
});

function renderDevices(devices) {
  $('deviceCount').textContent = devices.length;

  $('devicesList').innerHTML = devices
    .map(d => `
      <div class="device">
        <span class="device-avatar">
          ${escapeHtml(d.name.slice(0, 1).toUpperCase())}
        </span>
        <span>${escapeHtml(d.name)}</span>
        ${d.id === state.deviceId
          ? '<span class="you">YOU</span>'
          : ''}
      </div>
    `)
    .join('') || '<div class="subtext">No devices connected.</div>';
}

async function renderHistory() {
  const list = [...state.history.values()]
    .sort((a, b) => b.createdAt - a.createdAt);

  $('historySubtitle').textContent =
    `${list.length} item${list.length === 1 ? '' : 's'} · updates appear instantly`;

  $('emptyState').classList.toggle('hidden', list.length > 0);

  const html = [];

  for (const item of list) {
    const text = await decryptItem(item);

    html.push(`
      <article class="history-item" data-id="${escapeHtml(item.id)}">
        <div>
          <div class="history-meta">
            <span class="type-badge">${item.type}</span>
            <span>${escapeHtml(item.deviceName)}</span>
            <span>·</span>
            <span>${formatTime(item.createdAt)}</span>
            ${item.burnAfterSync ? '<span>· burn</span>' : ''}
          </div>

          <div class="history-content">
            ${escapeHtml(text)}
          </div>
        </div>

        <div class="history-actions">
          <button class="small-btn copy-old" data-id="${escapeHtml(item.id)}">
            Copy
          </button>

          <button class="small-btn delete-old" data-id="${escapeHtml(item.id)}">
            Delete
          </button>
        </div>
      </article>
    `);
  }

  $('historyList').innerHTML = html.join('');

  document.querySelectorAll('.copy-old').forEach(b => {
    b.onclick = async () => copyHistory(b.dataset.id);
  });

  document.querySelectorAll('.delete-old').forEach(b => {
    b.onclick = () => deleteItem(b.dataset.id);
  });
}

async function copyHistory(id) {
  const item = state.history.get(id);

  if (!item) return;

  const text = await decryptItem(item);

  try {
    await navigator.clipboard.writeText(text);
    toast('Copied back to clipboard');

    if (item.burnAfterSync) {
      socket.emit('clip:copy', { id });
    }
  } catch {
    toast('Clipboard permission was denied');
  }
}

function deleteItem(id) {
  socket.emit('clip:delete', { id }, () => {});
}

$('clearBtn').onclick = () => {
  if (
    state.history.size &&
    confirm('Clear clipboard history for everyone in this session?')
  ) {
    socket.emit('clip:clear');
  }
};

$('syncBtn').onclick = async () => {
  if (!state.code) return;

  const btn = $('syncBtn');
  btn.disabled = true;

  const msg = $('syncMessage');
  msg.classList.remove('hidden');
  msg.textContent = 'Reading clipboard...';

  try {
    if (!navigator.clipboard?.readText) {
      throw new Error(
        'Clipboard API is not available in this browser.'
      );
    }

    const text = await navigator.clipboard.readText();

    if (!text.trim()) {
      throw new Error('Your clipboard is empty.');
    }

    const encrypted = await encryptText(text);

    const type = /^(https?:\/\/|www\.)/i.test(text.trim())
      ? 'link'
      : 'text';

    const item = {
      id: makeId(),
      ...encrypted,
      type,
      deviceName: state.deviceName,
      createdAt: Date.now(),
      burnAfterSync: $('burnToggle').checked
    };

    socket.emit('clip:add', item, res => {
      if (res?.ok) {
        msg.textContent = 'Synced securely ✓';
        toast('Clipboard synced');

        setTimeout(() => {
          msg.classList.add('hidden');
        }, 1600);
      } else {
        msg.textContent = res?.error || 'Sync failed.';
      }
    });
  } catch (e) {
    msg.textContent = e.name === 'NotAllowedError'
      ? 'Clipboard permission denied. Click the button again and allow clipboard access.'
      : e.message || 'Could not read clipboard.';
  } finally {
    btn.disabled = false;
  }
};

$('qrBtn').onclick = async () => {
  const url = `${location.origin}/?join=${encodeURIComponent(state.code)}`;

  $('qrCodeText').textContent = state.code;
  $('qrCanvas').innerHTML = '';

  try {
    const res = await fetch(
      `https://uniclip-backend.onrender.com/qr?data=${encodeURIComponent(url)}`
    );

    if (!res.ok) {
      throw new Error('QR unavailable');
    }

    const blob = await res.blob();
    const img = document.createElement('img');

    img.src = URL.createObjectURL(blob);
    $('qrCanvas').appendChild(img);
  } catch {
    $('qrCanvas').textContent =
      'QR unavailable. Share the code instead.';
  }

  $('qrModal').classList.remove('hidden');
};

$('closeQr').onclick = () => {
  $('qrModal').classList.add('hidden');
};

document.querySelector('.modal-backdrop').onclick = () => {
  $('qrModal').classList.add('hidden');
};

$('shareBtn').onclick = async () => {
  const url = `${location.origin}/?join=${encodeURIComponent(state.code)}`;

  try {
    await navigator.share({
      title: 'Join my UniClip session',
      url
    });
  } catch {
    await navigator.clipboard.writeText(url);
    toast('Pairing link copied');
  }
};

const params = new URLSearchParams(location.search);

if (params.get('join')) {
  $('joinCode').value = params
    .get('join')
    .toUpperCase()
    .slice(0, 6);

  setTimeout(() => $('joinCode').focus(), 100);
}