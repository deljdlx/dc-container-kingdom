/**
 * A first-class camera: the world-space offset of the top-left of the view.
 *
 * Independent of any character — it can sit still, be moved explicitly
 * (`moveTo`/`moveBy`), or follow an element (`follow`). The viewport renders the
 * board translated by `(-x, -y)`; depth is world-space, so the camera never
 * touches z-order.
 */
export class Camera {
  _x = 0;
  _y = 0;

  /** @type {import('./Element.js').Element|null} */
  _target = null;

  _active = false;

  constructor(viewportWidth, viewportHeight) {
    this._viewportWidth = viewportWidth;
    this._viewportHeight = viewportHeight;
  }

  x() {
    return this._x;
  }

  y() {
    return this._y;
  }

  moveTo(x, y) {
    this._x = x;
    this._y = y;
    this._active = true;
    return this;
  }

  moveBy(dx, dy) {
    this._x += dx;
    this._y += dy;
    this._active = true;
    return this;
  }

  /**
   * Keep an element centred in the view.
   * @param {import('./Element.js').Element} target
   */
  follow(target) {
    this._target = target;
    this._active = true;
    return this;
  }

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
