import { Coordinates } from './Coordinates.js';

/**
 * Size (width/height) plus position (via {@link Coordinates}) of an element.
 * Each accessor doubles as a getter/setter and rounds to integer pixels on set.
 */
export class Geometry
{
  /**
   * @type {Number}
   */
  _width = 16;

  /**
   * @type {Number}
   */
  _height = 16;
  /**
   * @type {Coordinates}
   */
  _coordinates;

  constructor() {
    this._coordinates = new Coordinates();
  }

  /**
   * Deep copy of this geometry (position and size).
   * @returns {Geometry}
   */
  clone() {
    const cloned = new Geometry();
    cloned.x(this.x());
    cloned.y(this.y());
    cloned.width(this.width());
    cloned.height(this.height());
    return cloned;
  }

  /**
   * @returns {Coordinates} the backing position object
   */
  coordinates() {
    return this._coordinates;
  }

  /**
   * Get or set the width (rounded on set).
   * @param {?number} value
   * @returns {number}
   */
  width(value = null) {
    if(value !== null) {
      this._width = Math.round(value);
    }
    return this._width;
  }

  /**
   * Get or set the height (rounded on set).
   * @param {?number} value
   * @returns {number}
   */
  height(value = null) {
    if(value !== null) {
      this._height = Math.round(value);
    }
    return this._height;
  }

  /**
   * Get or set the x coordinate.
   * @param {?number} value
   * @returns {number}
   */
  x(value = null) {
    return this._coordinates.x(value);
  }

  /**
   * Get or set the y coordinate.
   * @param {?number} value
   * @returns {number}
   */
  y(value = null) {
    return this._coordinates.y(value);
  }

  /**
   * Add `value` to the given position axis.
   * @param {'x'|'y'} axis
   * @param {number} value
   * @returns {number|undefined}
   */
  add(axis, value) {
    return this._coordinates.add(axis, value);
  }

}
