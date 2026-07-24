/**
 * Debug visualisation is opt-in via the URL: add `?debug=1` to see element
 * outlines (map-debug.css) and the collision / trigger zone boxes. Everything
 * keys off the `debug` class on <body> — the stylesheets, and the debug render
 * pass — so this single toggle turns the whole thing on or off.
 *
 * Call it once, early, before the app renders (the renderer's debug pass checks
 * the class). Loading the debug stylesheet unconditionally is harmless: its
 * rules only apply under `body.debug`.
 *
 * @param {Window} [win] injectable for tests
 * @returns {boolean} whether debug mode was enabled
 */
export function applyDebugFlag(win = window) {
  const enabled = new URLSearchParams(win.location.search).get('debug') === '1';
  if (enabled) {
    win.document.body.classList.add('debug');
  }
  return enabled;
}

/** @param {Document} [doc] @returns {boolean} whether debug mode is on */
export function isDebugEnabled(doc = document) {
  return doc.body.classList.contains('debug');
}
