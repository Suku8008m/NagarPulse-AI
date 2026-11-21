/**
 * Generate standard NagarPulse Tracking ID
 * Format: NP-[YEAR/HASH]-[RANDOM_4] e.g. NP-2026-A101 or NP-NEL-KOVR-03
 */
function generateTrackingId(prefix = 'NP') {
  const dateStr = Date.now().toString(36).toUpperCase().slice(-4);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${randomStr}`;
}

module.exports = {
  generateTrackingId
};
