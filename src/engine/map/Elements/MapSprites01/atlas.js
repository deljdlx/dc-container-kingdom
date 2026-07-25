/** Atlas path of the `map-sprites-01` sheet. */
export const MAP_SPRITES_01_ATLAS = 'map/map-sprites-01.png';

/**
 * Build a sprite descriptor from pixel-space atlas coordinates.
 * @param {number} x left coordinate in the atlas
 * @param {number} y top coordinate in the atlas
 * @param {number} width sprite width in px
 * @param {number} height sprite height in px
 * @param {Partial<import('../../SpriteElement.js').SpriteDescriptor>} [extra]
 * @returns {import('../../SpriteElement.js').SpriteDescriptor}
 */
export function sprite(x, y, width, height, extra = {}) {
  return {
    width,
    height,
    atlas: MAP_SPRITES_01_ATLAS,
    frame: [-x, -y],
    shadow: false,
    ...extra,
  };
}

/**
 * Generic trunk collision footprint for trees.
 * @param {number} width
 * @param {number} height
 * @returns {[number, number, number, number]}
 */
export function treeCollision(width, height) {
  const collisionWidth = Math.max(10, Math.round(width * 0.34));
  const collisionHeight = Math.max(14, Math.round(height * 0.28));
  const left = Math.round((width - collisionWidth) / 2);
  const top = height - collisionHeight;
  return [left, top, collisionWidth, collisionHeight];
}

/**
 * Narrower footprint for dead trees and saplings.
 * @param {number} width
 * @param {number} height
 * @returns {[number, number, number, number]}
 */
export function deadTreeCollision(width, height) {
  const collisionWidth = Math.max(8, Math.round(width * 0.24));
  const collisionHeight = Math.max(14, Math.round(height * 0.26));
  const left = Math.round((width - collisionWidth) / 2);
  const top = height - collisionHeight;
  return [left, top, collisionWidth, collisionHeight];
}
