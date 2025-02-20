class Coordinates
{
  _x;
  _y;

  constructor(x = null, y = null) {
    this._x = x;
    this._y = y;
  }

  add(axis, value) {
    if(axis === 'x') {
      return this.x(this.x() + value);
    }

    if(axis === 'y') {
      return this.y(this.y() + value);
    }
  }


  x(value = null) {
    if(value !== null) {
      this._x = Math.round(value);
    }
    return this._x;
  }

  y(value = null) {
    if(value !== null) {
      this._y = Math.round(value);
    }
    return this._y;
  }
}