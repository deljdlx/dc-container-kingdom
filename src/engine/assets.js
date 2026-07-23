/**
 * Configurable base path for the engine's sprite sheets.
 *
 * By default images resolve to `engine/images/...` (relative to the serving
 * root). A host application that serves the engine from a different location
 * — a sub-path, a CDN, a bundler's asset dir — calls {@link setAssetsBase}
 * once before creating the {@link Application}.
 *
 * @example
 *   import { setAssetsBase } from '../engine/index.js';
 *   setAssetsBase('/static/rpg-engine/images');
 */

let base = 'engine/images';

/**
 * @param {string} path base URL/path for engine images (trailing slash optional)
 */
export function setAssetsBase(path) {
  base = String(path).replace(/\/+$/, '');
}

/**
 * @returns {string} the current assets base
 */
export function getAssetsBase() {
  return base;
}

/**
 * Build an absolute sprite URL from a path relative to the assets base.
 * @param {string} relativePath e.g. `map/map-sprites-01.png`
 * @returns {string}
 */
export function assetUrl(relativePath) {
  return `${base}/${String(relativePath).replace(/^\/+/, '')}`;
}
