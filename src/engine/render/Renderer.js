/**
 * Positive base added to every world-space depth z-index. Areas paint their
 * ground (grass) background at z-index `auto` (≈ 0); without this base an
 * element north of the origin — where absolute Y is negative — would get a
 * negative z-index and sink *behind* the ground. The offset is uniform, so
 * relative painter ordering is untouched.
 *
 * It buys **headroom, not immunity**: an element at world y = −1 000 000 still
 * lands at zero. Everything that has to stay under the map must therefore sit
 * just above the ground (see {@link GROUND_FX_DEPTH}), never «just below this
 * base» — that reading is what put the ground FX surface over the first area
 * north of the origin.
 */
export const DEPTH_BASE = 1_000_000;

/**
 * Depth of the FX surfaces, an order of magnitude above {@link DEPTH_BASE}.
 *
 * The board is an element like any other, so it carries a computed z-index of
 * its own (`DEPTH_BASE + offsetY + height`) and creates a stacking context with
 * it: a sibling canvas at `z-index: auto` paints *under* the whole map, DOM
 * order notwithstanding. Measured on 2026-08-01 — the board sat at 1 000 560
 * and the particles were painted, correct, and invisible.
 *
 * The invariant this constant assumes: no element ever reaches a world depth of
 * ten million, i.e. `offsetY + height < 9_000_000` pixels of world.
 */
export const FX_DEPTH = 10_000_000;

/**
 * Depth of the ground FX surface, **inside** the board.
 *
 * The board carries a z-index, so it is a stacking context: a sibling canvas is
 * either above the whole map or below its grass. Sliding between the two means
 * being a child of the board — where the grass and the flat ground decals
 * (`manualZ`) stay at `auto` (≈ 0) and anything standing sits at
 * `DEPTH_BASE + offsetY + height`.
 *
 * **It has to sit just above the ground, not just below `DEPTH_BASE`.** It was
 * `DEPTH_BASE - 1`, on the assumption that no element ever falls below
 * `DEPTH_BASE`. That assumption is false the moment an element stands **north of
 * the world origin**, where `offsetY` is negative: measured on 2026-08-03, a
 * house at world y = −140 sat at 999 990 and a tree at y = −260 at 999 804 —
 * both *under* a surface at 999 999, so the player's dust painted over them.
 *
 * At 1 the invariant becomes «anything standing has a depth above 1», which
 * holds while `DEPTH_BASE + offsetY + height > 1` — about **1 785 areas north of
 * the origin**. Not infinite, and deliberately written down: the previous
 * version broke at the **first** one.
 */
export const GROUND_FX_DEPTH = 1;

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
      // consistent across areas (the camera never affects z). North of the
      // origin this goes *below* DEPTH_BASE — which is why nothing may assume
      // that constant as a floor (see GROUND_FX_DEPTH).
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
  /**
   * Repaint: put the node where the model is.
   *
   * {@link render} **is** that job — it syncs size, world position and painter
   * depth, and writes only what changed since the last paint. So updating is
   * rendering again, and the `_last*` guards make it free when nothing moved.
   *
   * It used to be empty, which meant a moving element was never redrawn: the
   * per-frame walk came all the way to the dirty node and did nothing.
   * `CharacterRenderer` escaped it by repainting itself — the exception that hid
   * the rule.
   * @returns {DomElement} the element's root DOM node
   */
  update() {
    return this.render();
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

