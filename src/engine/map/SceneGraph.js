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

  childrenByName = {};

  _relativeTo = null;

  constructor(element) {
    this._element = element;
  }

  getParent() {
    return this.parent;
  }

  setParent(element) {
    this.parent = element;
    return this.parent;
  }

  relativeTo(element = null) {
    if (element !== null) {
      this._relativeTo = element;
    }
    return this._relativeTo;
  }

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

  offsetX() {
    if (this.parent) {
      return this._element.x() + this.parent.offsetX();
    }
    return this._element.x();
  }

  offsetY() {
    if (this.parent) {
      return this._element.y() + this.parent.offsetY();
    }
    return this._element.y();
  }

  getChildren() {
    return this.children;
  }

  getChildrenByName() {
    return this.childrenByName;
  }

  getChildByName(name) {
    if (typeof this.childrenByName[name] === 'undefined') {
      throw new Error('No element with name ' + name);
    }
    return this.childrenByName[name];
  }

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

  /** Create, attach and return a fresh empty child element. */
  createChild() {
    const element = new Element();
    element.setApplication(this._element.getApplication());
    this.children.push(element);

    element.setParent(this._element);
    element.relativeTo(this._element);

    return element;
  }

  /** Attach an existing element at (x, y) under this node. */
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
