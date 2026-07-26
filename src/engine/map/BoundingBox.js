/**
 * Axis-aligned rectangle in an element's local space, expressed as two corners
 * (`x0,y0` top-left → `x1,y1` bottom-right). Backs both a single element's box
 * and the aggregate box that grows to enclose its children/zones. Coordinates
 * stay local; the `offset*` accessors project them into world space through the
 * owning element. A box is "undefined" until all four corners are set.
 */
export class BoundingBox
{

  /**
   * @type {import('./Element.js').Element}
   */
  _element;

  /**
   * @type {number}
   */
  _x0 = null;

  /**
   * @type {number}
   */
  _x1 = null;

  /**
   * @type {number}
   */
  _y0 = null;

  /**
   * @type {number}
   */
  _y1 = null;

  /**
   * @type {boolean}
   */
  _collided = false;

  /** @type {DomElement} debug overlay node for this zone, set only in debug mode */
  dom;

  /**
   * When an element is given, the box belongs to it — which is what lets the
   * `offset*` accessors project into world space — and is seeded from its
   * position and size.
   *
   * Pass `seedFromElement = false` to attach the box to its element while
   * leaving it **undefined** (all four corners `null`): that is what an
   * aggregate box needs, since it must grow from the zones and children it
   * encloses rather than from the element's own rectangle.
   * @param {import('./Element.js').Element|null} element
   * @param {boolean} [seedFromElement] whether to seed the corners from `element`
   */
  constructor(element = null, seedFromElement = true) {
    if(element) {
      this._element = element
    }
    if(element && seedFromElement) {
      this._x0 = element.x();
      this._y0 = element.y();
      this._x1 = element.x() + element.width();
      this._y1 = element.y() + element.height();
    }
  }

  /**
   * Get or set the collided flag. When set, the debug overlay box (if any) is
   * tinted via the `collided` CSS class — so zones light up on contact under
   * `?debug=1`, at no cost otherwise (no overlay node exists outside debug).
   * @param {?boolean} value
   * @returns {boolean}
   */
  collided(value = null) {
    if(value !== null) {
      this._collided = value;
      if(this.dom) {
        this.dom.classList.toggle('collided', value);
      }
    }

    return this._collided;
  }

  /**
   * Grow this box (in place) to also enclose `boundingBox`.
   * @param {BoundingBox} boundingBox
   * @returns {BoundingBox} this
   */
  updateWithBoundingBox(boundingBox) {

    if(this.x0() === null || boundingBox.x0() < this.x0()) {
      this.x0(boundingBox.x0());
    }

    if(this.x1() === null ||boundingBox.x1() > this.x1()) {
      this.x1(boundingBox.x1());
    }

    if(this.y0() === null || boundingBox.y0() < this.y0()) {
      this.y0(boundingBox.y0());
    }

    if(this.y1() === null || boundingBox.y1() > this.y1()) {
      this.y1(boundingBox.y1());
    }

    return this
  }

  /**
   * Grow **this** box to enclose `childElement`'s collision box, translated by
   * the child's local position — the shape an aggregate takes when it folds a
   * child in.
   *
   * A child whose own aggregate is still undefined (no zone, no child of its
   * own) contributes nothing: translating a `null` corner would silently turn it
   * into the offset itself and grow the envelope with a phantom edge.
   * @param {import('./Element.js').Element} childElement
   * @returns {BoundingBox} this
   */
  updateWithRelativeElement(childElement) {
    const childBox = childElement.getCollisionBoundingBox();
    if(childBox.isUndefined()) {
      return this;
    }

    const translated = new BoundingBox();
    translated.x0(childBox.x0() + childElement.x());
    translated.x1(childBox.x1() + childElement.x());
    translated.y0(childBox.y0() + childElement.y());
    translated.y1(childBox.y1() + childElement.y());

    return this.updateWithBoundingBox(translated);
  }

  // ===========================
  /**
   * AABB overlap test in world space; false if either box is undefined.
   * @param {BoundingBox} boundingBox
   * @returns {boolean}
   */
  isCollided(boundingBox) {
    if(this.isUndefined() || boundingBox.isUndefined()) {
      return false;
    }

    return (
      this.offsetX0() <= boundingBox.offsetX1()
      && this.offsetX1() >= boundingBox.offsetX0()
      && this.offsetY0() <= boundingBox.offsetY1()
      && this.offsetY1() >= boundingBox.offsetY0()
    );
  }

  /**
   * True while any of the four corners is still unset.
   * @returns {boolean}
   */
  isUndefined() {
    return this._x0 === null || this._x1 === null || this._y0 === null || this._y1 === null;
  }

  // ===========================

  /**
   * The four world-space corners as a plain object.
   * @returns {{x0: number, x1: number, y0: number, y1: number}}
   */
  offsets() {
    return {
      x0: this.offsetX0(),
      x1: this.offsetX1(),
      y0: this.offsetY0(),
      y1: this.offsetY1(),
    }
  }

  /**
   * @returns {number} left edge in world space
   */
  offsetX0() {
    return this.x0() + this._element.offsetX();
  }

  /**
   * @returns {number} right edge in world space
   */
  offsetX1() {
    return this.x1() + this._element.offsetX();
  }

  /**
   * @returns {number} top edge in world space
   */
  offsetY0() {
    return this.y0() + this._element.offsetY();
  }

  /**
   * @returns {number} bottom edge in world space
   */
  offsetY1() {
    return this.y1() + this._element.offsetY();
  }


  /**
   * Get or set the local left edge.
   * @param {?number} value
   * @returns {number}
   */
  x0(value = null) {
    if(value !== null) {
      this._x0 = value;
    }
    return this._x0;
  }

  /**
   * Get or set the local right edge.
   * @param {?number} value
   * @returns {number}
   */
  x1(value = null) {
    if(value !== null) {
      this._x1 = value;
    }
    return this._x1;
  }

  /**
   * Get or set the local top edge.
   * @param {?number} value
   * @returns {number}
   */
  y0(value = null) {
    if(value !== null) {
      this._y0 = value;
    }
    return this._y0;
  }

  /**
   * Get or set the local bottom edge.
   * @param {?number} value
   * @returns {number}
   */
  y1(value = null) {
    if(value !== null) {
      this._y1 = value;
    }
    return this._y1;
  }

  /**
   * Get the width, or set it by moving the right edge relative to `x0`.
   * @param {?number} value
   * @returns {number}
   */
  width(value = null) {
    if(value !== null) {
      this._x1 = this.x0() + value;
    }
    return this._x1 - this._x0;
  }

  /**
   * Get the height, or set it by moving the bottom edge relative to `y0`.
   * @param {?number} value
   * @returns {number}
   */
  height(value = null) {
    if(value) {
      this._y1 = this.y0() + value;
    }
    return this._y1 - this._y0;
  }

}
