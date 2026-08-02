/**
 * Integer 2D point. Every mutation rounds to the nearest pixel so positions stay
 * whole numbers. Doubles as a getter/setter: pass a value to write, omit it to read.
 */
export class Coordinates
{
  /** @type {number} */
  _x;

  /** @type {number} */
  _y;

  /**
   * @param {?number} x
   * @param {?number} y
   */
  constructor(x = null, y = null) {
    this._x = x;
    this._y = y;
  }

  /**
   * Add `value` to the given axis.
   * @param {'x'|'y'} axis
   * @param {number} value
   * @returns {number|undefined} the new axis value, or undefined for an unknown axis
   */
  add(axis, value) {
    if(axis === 'x') {
      return this.x(this.x() + value);
    }

    if(axis === 'y') {
      return this.y(this.y() + value);
    }
  }


  /**
   * Get or set the x coordinate (rounded on set).
   * @param {?number} value
   * @returns {number}
   */
  x(value = null) {
    if(value !== null) {
      this._x = Math.round(value);
    }
    return this._x;
  }

  /**
   * Get or set the y coordinate (rounded on set).
   * @param {?number} value
   * @returns {number}
   */
  y(value = null) {
    if(value !== null) {
      this._y = Math.round(value);
    }
    return this._y;
  }
}
