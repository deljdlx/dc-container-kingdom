class Geometry
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

  coordinates() {
    return this._coordinates;
  }

  width(value = null) {
    if(value !== null) {
      this._width = Math.round(value);
    }
    return this._width;
  }

  height(value = null) {
    if(value !== null) {
      this._height = Math.round(value);
    }
    return this._height;
  }

  x(value = null) {
    return this._coordinates.x(value);
  }

  y(value = null) {
    return this._coordinates.y(value);
  }

  add(axis, value) {
    return this._coordinates.add(axis, value);
  }

}
