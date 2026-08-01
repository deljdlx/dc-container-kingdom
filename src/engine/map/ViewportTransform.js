/**
 * The single owner of the world ↔ screen relation.
 *
 * The board is drawn once, then moved as a whole: the map scrolls by translating
 * it, and zooms by scaling it. Before this object, that relation was written in
 * two places with two different models — the engine translated by the camera,
 * the host translated *and* scaled — and everything else (a canvas overlay, a
 * pointer converted back to world coordinates) had to guess which regime it was
 * in. It guessed wrong at least once.
 *
 * **Convention** — the transform stores the **CSS translation applied to the
 * board**, in screen pixels. A camera at `(cx, cy)` therefore feeds
 * `offset = (-cx, -cy)`; a host panning by `(px, py)` feeds `offset = (px, py)`.
 * One sign to remember, written down once.
 *
 * With `transform-origin: 0 0`, the relation is:
 *
 * ```
 * screen = world × scale + offset
 * world  = (screen − offset) / scale
 * ```
 *
 * Rounding is deliberately **absent**: the pan is fractional in practice, and
 * rounding here would make the map shimmer at fractional zoom. Whole-pixel
 * placement stays where it belongs, on element positions.
 */
export class ViewportTransform
{

  /** @type {number} beyond this, the extra device pixels cost more than they show */
  static MAX_PIXEL_RATIO = 2;

  /** @type {number} CSS translation applied to the board, in screen pixels */
  _offsetX = 0;

  /** @type {number} */
  _offsetY = 0;

  /** @type {number} 1 = 100 % */
  _scale = 1;

  /**
   * @param {Object} [options]
   * @param {number} [options.pixelRatio] usually `devicePixelRatio`; capped
   */
  constructor({ pixelRatio = 1 } = {}) {
    this._pixelRatio = Math.max(1, Math.min(pixelRatio, ViewportTransform.MAX_PIXEL_RATIO));
  }

  /**
   * Move the board.
   * @param {number} x
   * @param {number} y
   * @returns {this}
   */
  setOffset(x, y) {
    this._offsetX = x;
    this._offsetY = y;
    return this;
  }

  /** @returns {number} */
  offsetX() {
    return this._offsetX;
  }

  /** @returns {number} */
  offsetY() {
    return this._offsetY;
  }

  /**
   * Get or set the zoom.
   * @param {number|null} [value]
   * @returns {number}
   */
  scale(value = null) {
    if (value !== null) {
      this._scale = value;
    }
    return this._scale;
  }

  /** @returns {number} device pixels per CSS pixel, capped */
  pixelRatio() {
    return this._pixelRatio;
  }

  /**
   * @param {number} x world
   * @returns {number} screen — scalar, allocation-free, for the drawing loop
   */
  worldToScreenX(x) {
    return x * this._scale + this._offsetX;
  }

  /** @param {number} y world @returns {number} screen */
  worldToScreenY(y) {
    return y * this._scale + this._offsetY;
  }

  /** @param {number} x screen @returns {number} world */
  screenToWorldX(x) {
    return (x - this._offsetX) / this._scale;
  }

  /** @param {number} y screen @returns {number} world */
  screenToWorldY(y) {
    return (y - this._offsetY) / this._scale;
  }

  /**
   * @param {number} x world
   * @param {number} y world
   * @returns {{x: number, y: number}} screen — for callers not on a hot path
   */
  worldToScreen(x, y) {
    return { x: this.worldToScreenX(x), y: this.worldToScreenY(y) };
  }

  /**
   * @param {number} x screen
   * @param {number} y screen
   * @returns {{x: number, y: number}} world
   */
  screenToWorld(x, y) {
    return { x: this.screenToWorldX(x), y: this.screenToWorldY(y) };
  }

  /**
   * A frozen copy, for gestures that must keep converting against the state they
   * started from (a pinch anchors on the midpoint as it was when the fingers
   * landed) while the live transform keeps moving.
   * @returns {ViewportTransform}
   */
  clone() {
    const copy = new ViewportTransform({ pixelRatio: this._pixelRatio });
    copy.setOffset(this._offsetX, this._offsetY);
    copy.scale(this._scale);
    return copy;
  }

  /**
   * @returns {string} the CSS the board wears. The `scale()` term is always
   * emitted: the host's gesture behaviour is pinned to this exact string.
   */
  toCssTransform() {
    return `translate(${this._offsetX}px, ${this._offsetY}px) scale(${this._scale})`;
  }

  /**
   * Wear the transform on a DOM node. `transform-origin: 0 0` is not cosmetic —
   * the whole pan arithmetic assumes the scale grows from the top-left corner.
   * @param {HTMLElement} element
   */
  applyTo(element) {
    element.style.transformOrigin = '0 0';
    element.style.transform = this.toCssTransform();
  }

  /**
   * Set a canvas up so it can be drawn in **world coordinates**, device pixels
   * included. Callers then plot world positions directly.
   * @param {Object} context a 2d context
   */
  applyToContext(context) {
    const ratio = this._pixelRatio;
    const scale = this._scale * ratio;
    context.setTransform(scale, 0, 0, scale, this._offsetX * ratio, this._offsetY * ratio);
  }
}
