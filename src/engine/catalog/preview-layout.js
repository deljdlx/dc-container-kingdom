/**
 * Build preview canvas metrics around an element footprint and its collision
 * bounds, without any visual scaling.
 *
 * @param {import('../index.js').Element} element
 * @returns {{width: number, height: number, contentWidth: number, contentHeight: number, offsetX: number, offsetY: number}}
 */
export function getStageMetrics(element) {
  const bounds = element.getBoundingBox();
  const collisionBounds = element.getCollisionBoundingBox();
  const left = minDefined(0, bounds.x0(), collisionBounds.x0());
  const top = minDefined(0, bounds.y0(), collisionBounds.y0());
  const right = maxDefined(element.width(), bounds.x1(), collisionBounds.x1());
  const bottom = maxDefined(element.height(), bounds.y1(), collisionBounds.y1());

  const contentWidth = Math.max(1, right - left);
  const contentHeight = Math.max(1, bottom - top);
  const paddedWidth = Math.max(160, contentWidth + 32);
  const paddedHeight = Math.max(160, contentHeight + 32);

  return {
    width: paddedWidth,
    height: paddedHeight,
    contentWidth,
    contentHeight,
    offsetX: ((paddedWidth - contentWidth) / 2) - left,
    offsetY: ((paddedHeight - contentHeight) / 2) - top,
  };
}

/**
 * @param {...(number|null)} values
 * @returns {number}
 */
function minDefined(...values) {
  return Math.min(...values.filter((value) => value !== null));
}

/**
 * @param {...(number|null)} values
 * @returns {number}
 */
function maxDefined(...values) {
  return Math.max(...values.filter((value) => value !== null));
}
