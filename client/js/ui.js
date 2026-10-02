// Small UI helpers used across UniClip.
// These functions only update the existing page elements.
// The original messages and behavior are kept.
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toast);
  window.__toast = setTimeout(
    () => t.classList.remove('show'),
    2400
  );
}

function setStatus(connected) {
  state.connected = connected;
  $('statusDot').classList.toggle('offline', !connected);
  $('statusText').textContent = connected
    ? 'Connected'
    : 'Reconnecting…';
}

function error(msg) {
  $('landingError').textContent = msg;
  $('landingError').classList.remove('hidden');
}

function clearError() {
  $('landingError').classList.add('hidden');
}

function showWorkspace() {
  $('landing').classList.add('hidden');
  $('workspace').classList.remove('hidden');
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>'"]/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c])
  );
}

function formatTime(ts) {
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  }).format(new Date(ts));
}
