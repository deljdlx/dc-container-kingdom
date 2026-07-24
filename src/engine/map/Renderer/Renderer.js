import { Element } from '../Element.js';

/**
 * Positive base added to every world-space depth z-index. Areas paint their
 * ground (grass) background at z-index `auto` (≈ 0); without this base an
 * element north of the origin — where absolute Y is negative — would get a
 * negative z-index and sink *behind* the ground. The base is large enough that
 * no reachable position brings the depth back down to the ground layer, while
 * the offset is uniform so relative painter ordering is untouched.
 */
const DEPTH_BASE = 1_000_000;

export class Renderer
{

  /**
   * @type {Element}
   */
  _element;

  /**
   * @type {DomElement}
   */
  dom;

  /**
   * @type {DomElement}
   */
  innerContent;

  /**
   * @type {DomElement}
   */
  domShadow;

  /**
   * @type {DomElement}
   */
  domSprite;

  /**
   * @type {DomElement}
   */
  childDom;

  /**
   * @type {DomElement}
   */
  collisionDom;

  /**
   * @type {DomElement}
   */
  boundingBox;

  _lastWidth = null;
  _lastHeight = null;
  _lastLeft = null;
  _lastTop = null;
  _lastZ = null;


   /**
   *
   * @param {Element} element
   */
  constructor(element) {
    this._element = element;
    this.dom = document.createElement('div');
    this.dom.classList.add('map-element');

    this.innerContent = document.createElement('div');
    this.innerContent.classList.add('map-element__inner-content');
    this.dom.append(this.innerContent);

    this.domSprite = document.createElement('div');
    this.domSprite.classList.add('map-element__sprite');
    this.dom.append(this.domSprite);
  }

  /**
   * @param {Element|null} referenceElement
   * @returns {DomElement}
   */
  render() {

    const relativeTo = this._element.relativeTo();

    const width = this._element.width();
    const height = this._element.height();

    if(width !== this._lastWidth) {
      this.dom.style.width = width + 'px';
      this._lastWidth = width;
    }
    if(height !== this._lastHeight) {
      this.dom.style.height = height + 'px';
      this._lastHeight = height;
    }

    let left = this._element.x();
    let top = this._element.y();

    if(relativeTo) {
      const offsets = relativeTo.getRelativeToOffsets();
      left += offsets.x;
      top += offsets.y;
    }

    if(left !== this._lastLeft) {
      this.dom.style.left = left + 'px';
      this._lastLeft = left;
    }
    if(top !== this._lastTop) {
      this.dom.style.top = top + 'px';
      this._lastTop = top;
    }

    if(this._element.manualZ === false) {
      // World-space depth: sort by absolute Y so painter's ordering stays
      // consistent across areas (the camera never affects z). DEPTH_BASE keeps
      // the value above the ground layer even north of the origin.
      const z = DEPTH_BASE + this._element.offsetY() + height;
      if(z !== this._lastZ) {
        this.dom.style.zIndex = z;
        this._lastZ = z;
      }
    }

    return this.dom;
  }

  getSprite() {
    return this.domSprite;
  }

  getShadow() {
    return this.domShadow;
  }

  addShadow() {
    if(this.domShadow) {
      return this.domShadow;
    }
    this.domShadow = document.createElement('div');
    this.domShadow.classList.add('map-element__shadow');
    this.domShadow.style.width = this.getElement().width() + 'px';
    this.domShadow.style.height = (this.getElement().height() / 3) + 'px';
    this.domShadow.style.top = (this.getElement().height() / 3 * 2)  + 'px';
    this.domShadow.style.left = (4)  + 'px';

    this.dom.prepend(this.domShadow);
    return this.domShadow;
  }

  update() {
    /*
    if(this._element.collided()) {
      this.dom.classList.add('collided');
    }
    else {
      this.dom.classList.remove('collided');
    }
    */
  }

  getDom() {
    return this.dom;
  }

  clear() {
    this.dom.remove();
  }

  getElement() {
    return this._element;
  }

  addClass(className) {
    this.dom.classList.add(className);
  }


  renderBoundingBox() {
    if(this.boundingBox) {
      return this.boundingBox;
    }
    this.boundingBox = document.createElement('div');
    this.boundingBox.classList.add('map-element__bounding-box');
    this.dom.append(this.boundingBox);
    return this.boundingBox;
  }

  renderCollisionZones() {

    const element = this._element;

    if(this.collisiondDom) {
      return this.collisiondDom;
    }
    this.collisiondDom = document.createElement('div');
    this.collisiondDom.classList.add('map-element__collision-bounding-box');
    this.collisiondDom.style.left = element.getCollisionBoundingBox().x0() + 'px';
    this.collisiondDom.style.top = element.getCollisionBoundingBox().y0() + 'px';
    this.collisiondDom.style.width = element.getCollisionBoundingBox().width() + 'px';
    this.collisiondDom.style.height = element.getCollisionBoundingBox().height() + 'px';

    if(this.dom) {
      this.dom.appendChild(this.collisiondDom);
    }

    element.getCollisionZones().forEach(boundingBox => {
      const collisionDom = document.createElement('div');
      collisionDom.classList.add('map-element__collision-zone');
      collisionDom.style.width = boundingBox.width() + 'px';
      collisionDom.style.height = boundingBox.height() + 'px';
      collisionDom.style.left = boundingBox.x0() + 'px';
      collisionDom.style.top = boundingBox.y0() + 'px';

      boundingBox.dom = collisionDom;

      if(this.dom) {
        this.dom.appendChild(collisionDom);
      }
    });

    element.getChildren().forEach(element => {
      element.renderCollisionZones();
    });

    return this.collisiondDom;
  }

  setInnerHTML(html) {
    this.innerContent.innerHTML = html;
    this.innerContent.style.minWidth = this._element.width() + 'px';
  }
}

