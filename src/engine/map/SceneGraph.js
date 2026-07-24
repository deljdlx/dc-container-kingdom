import { Element } from './Element.js';

/**
 * Scene-graph (parent/children tree) of an {@link Element}.
 *
 * Owns the parent pointer, the child list and name index, and the
 * position-relative-to-ancestors offsets. Extracted from Element so the base
 * node coordinates subsystems rather than implementing them; Element exposes
 * thin delegating methods, so every existing call site keeps working.
 */
export class SceneGraph {
  /** @type {import('./Element.js').Element} */
  _element;

  /** @type {import('./Element.js').Element|null} */
  parent = null;

  /** @type {import('./Element.js').Element[]} */
  children = [];

  /** @type {Object<string, import('./Element.js').Element>} */
  childrenByName = {};

  /**
   * Ancestor used as origin by {@link getRelativeToOffsets}; distinct from the
   * scene-graph parent (an element can be positioned relative to another).
   * @type {import('./Element.js').Element|null}
   */
  _relativeTo = null;

  /**
   * @param {import('./Element.js').Element} element the owning node
   */
  constructor(element) {
    this._element = element;
  }

  /**
   * @returns {import('./Element.js').Element|null} the parent node
   */
  getParent() {
    return this.parent;
  }

  /**
   * Set the parent node.
   * @param {import('./Element.js').Element} element
   * @returns {import('./Element.js').Element}
   */
  setParent(element) {
    this.parent = element;
    return this.parent;
  }

  /**
   * Get or set the element this node is positioned relative to.
   * @param {import('./Element.js').Element|null} element
   * @returns {import('./Element.js').Element|null}
   */
  relativeTo(element = null) {
    if (element !== null) {
      this._relativeTo = element;
    }
    return this._relativeTo;
  }

  /**
   * Accumulated x/y offset from the `relativeTo` ancestor chain.
   * @returns {{x: number, y: number}}
   */
  getRelativeToOffsets() {
    if (!this._relativeTo) {
      return { x: 0, y: 0 };
    }

    const offsets = this._relativeTo.getRelativeToOffsets();
    return {
      x: offsets.x + this._element.x(),
      y: offsets.y + this._element.y(),
    };
  }

  /**
   * World-space x: own x plus every ancestor's x.
   * @returns {number}
   */
  offsetX() {
    if (this.parent) {
      return this._element.x() + this.parent.offsetX();
    }
    return this._element.x();
  }

  /**
   * World-space y: own y plus every ancestor's y.
   * @returns {number}
   */
  offsetY() {
    if (this.parent) {
      return this._element.y() + this.parent.offsetY();
    }
    return this._element.y();
  }

  /**
   * @returns {import('./Element.js').Element[]} direct children
   */
  getChildren() {
    return this.children;
  }

  /**
   * @returns {Object<string, import('./Element.js').Element>} named children index
   */
  getChildrenByName() {
    return this.childrenByName;
  }

  /**
   * Look up a direct child by name.
   * @param {string} name
   * @returns {import('./Element.js').Element}
   * @throws {Error} when no child has that name
   */
  getChildByName(name) {
    if (typeof this.childrenByName[name] === 'undefined') {
      throw new Error('No element with name ' + name);
    }
    return this.childrenByName[name];
  }

  /**
   * Flatten the whole subtree (depth-first) into a single list.
   * @returns {import('./Element.js').Element[]}
   */
  getAllChildren() {
    const children = [];
    this.getChildren().forEach(child => {
      children.push(child);
      child.getAllChildren().forEach(grandChild => {
        children.push(grandChild);
      });
    });
    return children;
  }

  /**
   * Detach a child from both the list and the name index.
   * @param {import('./Element.js').Element} element
   */
  removeChild(element) {
    this.children = this.children.filter(child => child !== element);
    this.childrenByName = Object.keys(this.childrenByName).reduce((accumulator, name) => {
      if (this.childrenByName[name] !== element) {
        accumulator[name] = this.childrenByName[name];
      }
      return accumulator;
    }, {});
  }

  /** Reset the tree (used on destroy). */
  reset() {
    this.children = [];
    this.childrenByName = {};
  }

  /**
   * Create, attach and return a fresh empty child element.
   * @returns {import('./Element.js').Element}
   */
  createChild() {
    const element = new Element();
    element.setApplication(this._element.getApplication());
    this.children.push(element);

    element.setParent(this._element);
    element.relativeTo(this._element);

    return element;
  }

  /**
   * Attach an existing element at (x, y) under this node.
   * @param {number} x
   * @param {number} y
   * @param {import('./Element.js').Element} element
   * @param {string} name index key for name lookups
   * @returns {import('./Element.js').Element}
   */
  addChild(x, y, element, name) {
    element.setApplication(this._element.getApplication());
    this.children.push(element);
    this.childrenByName[name] = element;

    element.setParent(this._element);
    element.relativeTo(this._element);

    element.x(x);
    element.y(y);

    return element;
  }
}
