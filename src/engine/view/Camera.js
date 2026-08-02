/**
 * A first-class camera: the world-space offset of the top-left of the view.
 *
 * Independent of any character — it can sit still, be moved explicitly
 * (`moveTo`/`moveBy`), or follow an element (`follow`). The viewport renders the
 * board translated by `(-x, -y)`; depth is world-space, so the camera never
 * touches z-order.
 */
export class Camera {
  /** @type {number} world-space x offset of the view's top-left */
  _x = 0;
  /** @type {number} world-space y offset of the view's top-left */
  _y = 0;

  /** @type {import('./Element.js').Element|null} element the camera tracks, if any */
  _target = null;

  /** @type {boolean} whether the camera drives the view (set by any move/follow) */
  _active = false;

  /**
   * @param {number} viewportWidth
   * @param {number} viewportHeight
   */
  constructor(viewportWidth, viewportHeight) {
    this._viewportWidth = viewportWidth;
    this._viewportHeight = viewportHeight;
  }

  /** @returns {number} world-space x offset of the view's top-left */
  x() {
    return this._x;
  }

  /** @returns {number} world-space y offset of the view's top-left */
  y() {
    return this._y;
  }

  /**
   * Jump the camera to an absolute world-space position and activate it.
   * @param {number} x
   * @param {number} y
   * @returns {Camera} this, for chaining
   */
  moveTo(x, y) {
    this._x = x;
    this._y = y;
    this._active = true;
    return this;
  }

  /**
   * Shift the camera by a delta and activate it.
   * @param {number} dx
   * @param {number} dy
   * @returns {Camera} this, for chaining
   */
  moveBy(dx, dy) {
    this._x += dx;
    this._y += dy;
    this._active = true;
    return this;
  }

  /**
   * Keep an element centred in the view.
   * @param {import('./Element.js').Element} target
   * @returns {Camera} this, for chaining
   */
  follow(target) {
    this._target = target;
    this._active = true;
    return this;
  }

  /** @returns {import('./Element.js').Element|null} the followed element, if any */
  getTarget() {
    return this._target;
  }

  /**
   * @returns {boolean} whether the camera is driving the view (a host that
   * moves the board itself leaves it inactive).
   */
  isActive() {
    return this._active;
  }

  /** Recompute the position from the follow target, if any. */
  update() {
    if (this._target) {
      this._x = this._target.x() + this._target.width() / 2 - this._viewportWidth / 2;
      this._y = this._target.y() + this._target.height() / 2 - this._viewportHeight / 2;
    }
  }
}
