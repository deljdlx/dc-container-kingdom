/**
 * Positive base added to every world-space depth z-index. Areas paint their
 * ground (grass) background at z-index `auto` (≈ 0); without this base an
 * element north of the origin — where absolute Y is negative — would get a
 * negative z-index and sink *behind* the ground. The base is large enough that
 * no reachable position brings the depth back down to the ground layer, while
 * the offset is uniform so relative painter ordering is untouched.
 */
const DEPTH_BASE = 1_000_000;

/**
 * Base renderer for any map element: owns the element's root DOM node and the
 * inner/sprite sub-nodes, and keeps world-space position, size and painter
 * depth in sync with the model. Subclasses specialise the paint step (areas,
 * characters, sprites, board) while reusing this positioning logic.
 */
export class Renderer
{

  /**
   * @type {import('../Element.js').Element}
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

  /** @type {DomElement} debug box for the aggregate collision bounding box */
  collisionBoundingBoxDom;

  /**
   * @type {DomElement}
   */
  boundingBox;

  /**
   * Last painted geometry/depth, cached so `render()` only touches the DOM when
   * a value actually changed (positions are recomputed every frame).
   */
  _lastWidth = null;
  _lastHeight = null;
  _lastLeft = null;
  _lastTop = null;
  _lastZ = null;


   /**
   * Build the element's root DOM node with its inner-content and sprite layers.
   * @param {import('../Element.js').Element} element
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
   * Sync the root node's size, world-space position and painter depth with the
   * model, writing only the properties that changed since the last paint.
   * @returns {DomElement} the element's root DOM node
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

  /** @returns {DomElement} the sprite layer node */
  getSprite() {
    return this.domSprite;
  }

  /** @returns {DomElement} the shadow node (undefined until `addShadow()` runs) */
  getShadow() {
    return this.domShadow;
  }

  /**
   * Create the drop-shadow node (idempotent), sized from the element's height.
   * @returns {DomElement} the shadow node
   */
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

  /** Per-frame update hook; overridden by subclasses, a no-op on the base. */
  update() {
  }

  /** @returns {DomElement} the element's root DOM node */
  getDom() {
    return this.dom;
  }

  /** Detach the root node from the DOM. */
  clear() {
    this.dom.remove();
  }

  /** @returns {import('../Element.js').Element} the rendered model element */
  getElement() {
    return this._element;
  }

  /**
   * Add a CSS class to the root node.
   * @param {string} className
   */
  addClass(className) {
    this.dom.classList.add(className);
  }


  /**
   * Create the debug bounding-box overlay node (idempotent).
   * @returns {DomElement} the bounding-box node
   */
  renderBoundingBox() {
    if(this.boundingBox) {
      return this.boundingBox;
    }
    this.boundingBox = document.createElement('div');
    this.boundingBox.classList.add('map-element__bounding-box');
    this.dom.append(this.boundingBox);
    return this.boundingBox;
  }

  /**
   * Build the debug overlays for this element's collision bounding box plus its
   * collision and trigger zones, then recurse into children (idempotent).
   * @returns {DomElement} the collision bounding-box node
   */
  renderCollisionZones() {

    const element = this._element;

    if(this.collisionBoundingBoxDom) {
      return this.collisionBoundingBoxDom;
    }
    this.collisionBoundingBoxDom = document.createElement('div');
    this.collisionBoundingBoxDom.classList.add('map-element__collision-bounding-box');
    this.collisionBoundingBoxDom.style.left = element.getCollisionBoundingBox().x0() + 'px';
    this.collisionBoundingBoxDom.style.top = element.getCollisionBoundingBox().y0() + 'px';
    this.collisionBoundingBoxDom.style.width = element.getCollisionBoundingBox().width() + 'px';
    this.collisionBoundingBoxDom.style.height = element.getCollisionBoundingBox().height() + 'px';

    if(this.dom) {
      this.dom.appendChild(this.collisionBoundingBoxDom);
    }

    /**
     * Paint one collision/trigger zone overlay and cache its node on the box.
     * @param {import('../BoundingBox.js').BoundingBox} boundingBox
     * @param {string} className
     */
    const renderZone = (boundingBox, className) => {
      const zoneDom = document.createElement('div');
      zoneDom.classList.add(className);
      zoneDom.style.width = boundingBox.width() + 'px';
      zoneDom.style.height = boundingBox.height() + 'px';
      zoneDom.style.left = boundingBox.x0() + 'px';
      zoneDom.style.top = boundingBox.y0() + 'px';

      boundingBox.dom = zoneDom;

      if(this.dom) {
        this.dom.appendChild(zoneDom);
      }
    };

    element.getCollisionZones('collision').forEach(zone => renderZone(zone, 'map-element__collision-zone'));
    element.getCollisionZones('trigger').forEach(zone => renderZone(zone, 'map-element__trigger-zone'));

    element.getChildren().forEach(element => {
      element.renderCollisionZones();
    });

    return this.collisionBoundingBoxDom;
  }

  /**
   * Replace the inner-content HTML and widen the node to the element's width.
   * @param {string} html
   */
  setInnerHTML(html) {
    this.innerContent.innerHTML = html;
    this.innerContent.style.minWidth = this._element.width() + 'px';
  }
}

