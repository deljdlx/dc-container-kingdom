class BoundingBox
{

  /**
   * @type {Element}
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

  /**
   * @param {Element|null} element
   */
  constructor(element = null) {
    if(element) {
      this._element = element
      this._x0 = element.x();
      this._y0 = element.y();
      this._x1 = element.x() + element.width();
      this._y1 = element.y() + element.height();
    }
  }

  /**
   * @param {boolean} value
   * @returns {boolean}
   */
  collided(value = null) {
    if(value !== null) {
      this._collided = value;
    }

    return this._collided;
  }

  /**
   * @param {BoundingBox} element
   * @returns {BoundingBox}
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
   * @param {Element} parentElement
   * @param {Element} childElement
   */
  updateWithRelativeElement(parentElement, childElement) {
    if(
      (parentElement.getCollisionBoundingBox().x1() <
      childElement.getCollisionBoundingBox().x1() + childElement.x()
      || parentElement.getCollisionBoundingBox().x1() === null)
      && childElement.getCollisionBoundingBox().x1() !== null
    ) {
      parentElement.getCollisionBoundingBox().x1(
        childElement.getCollisionBoundingBox().x1() + childElement.x()
      )
    }

    if(
      (parentElement.getCollisionBoundingBox().x0() >
      childElement.getCollisionBoundingBox().x0() + childElement.x()
      || parentElement.getCollisionBoundingBox().x0() === null)
      && childElement.getCollisionBoundingBox().x0() !== null
    ) {
      parentElement.getCollisionBoundingBox().x0(
        childElement.getCollisionBoundingBox().x0() + childElement.x()
      )
    }

    if(
      (parentElement.getCollisionBoundingBox().y1() <
      childElement.getCollisionBoundingBox().y1() + childElement.y()
      || parentElement.getCollisionBoundingBox().y1() === null)
      && childElement.getCollisionBoundingBox().y1() !== null
    ) {
      parentElement.getCollisionBoundingBox().y1(
        childElement.getCollisionBoundingBox().y1() + childElement.y()
      )
    }

    if(
      (parentElement.getCollisionBoundingBox().y0() >
      childElement.getCollisionBoundingBox().y0() + childElement.y()
      || parentElement.getCollisionBoundingBox().y0() === null)
      && childElement.getCollisionBoundingBox().y0() !== null
    ) {
      parentElement.getCollisionBoundingBox().y0(
        childElement.getCollisionBoundingBox().y0() + childElement.y()
      )
    }
  }

  // ===========================
  /**
   * @param {BoudingBox} boudingBox
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
   * @returns {boolean}
   */
  isUndefined() {
    return this._x0 === null || this._x1 === null || this._y0 === null || this._y1 === null;
  }

  // ===========================

  /**
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

  offsetX0() {
    return this.x0() + this._element.offsetX();
  }

  offsetX1() {
    return this.x1() + this._element.offsetX();
  }

  offsetY0() {
    return this.y0() + this._element.offsetY();
  }

  offsetY1() {
    return this.y1() + this._element.offsetY();
  }


  x0(value = null) {
    if(value !== null) {
      this._x0 = value;
    }
    return this._x0;
  }

  x1(value = null) {
    if(value !== null) {
      this._x1 = value;
    }
    return this._x1;
  }

  y0(value = null) {
    if(value !== null) {
      this._y0 = value;
    }
    return this._y0;
  }

  y1(value = null) {
    if(value !== null) {
      this._y1 = value;
    }
    return this._y1;
  }

  width(value = null) {
    if(value !== null) {
      this._x1 = this.x0() + value;
    }
    return this._x1 - this._x0;
  }

  height(value = null) {
    if(value) {
      this._y1 = this.y0() + value;
    }
    return this._y1 - this._y0;
  }

}