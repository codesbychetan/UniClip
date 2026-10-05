// Displays temporary notification message
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
// Updates connection status indicator
function setStatus(connected) {
  state.connected = connected;
  $('statusDot').classList.toggle('offline', !connected);
  $('statusText').textContent = connected
    ? 'Connected'
    : 'Reconnecting…';
}
// Displays landing page error message
function error(msg) {
  $('landingError').textContent = msg;
  $('landingError').classList.remove('hidden');
}
// Hides current landing page error
function clearError() {
  $('landingError').classList.add('hidden');
}
// Switches from landing to workspace
function showWorkspace() {
  $('landing').classList.add('hidden');
  $('workspace').classList.remove('hidden');
}
// Prevents unsafe HTML content rendering
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
// Formats timestamps for display
function formatTime(ts) {
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  }).format(new Date(ts));
}
