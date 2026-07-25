/** Atlas path of the `map-sprites-02` sheet. */
export const MAP_SPRITES_02_ATLAS = 'map/map-sprites-02.png';

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
    atlas: MAP_SPRITES_02_ATLAS,
    frame: [-x, -y],
    shadow: false,
    ...extra,
  };
}

/**
 * Generic trunk collision footprint for vegetation sprites.
 * @param {number} width
 * @param {number} height
 * @returns {[number, number, number, number]}
 */
export function treeCollision(width, height) {
  const collisionWidth = Math.max(10, Math.round(width * 0.32));
  const collisionHeight = Math.max(14, Math.round(height * 0.28));
  const left = Math.round((width - collisionWidth) / 2);
  const top = height - collisionHeight;
  return [left, top, collisionWidth, collisionHeight];
}
