import { Element } from './Element.js';
import { SpriteRenderer } from './Renderer/SpriteRenderer.js';

/**
 * @typedef {object} SpriteDescriptor
 * @property {number} width sprite width in px
 * @property {number} height sprite height in px
 * @property {string} atlas atlas image path, relative to the assets base
 * @property {[number, number]} frame background-position [x, y] into the atlas
 * @property {[number, number, number, number]} [collision] solid box [x, y, w, h]
 * @property {[number, number, number, number]} [trigger] trigger box [x, y, w, h]
 * @property {boolean|{width?: number, height?: number, top?: number, left?: number, borderRadius?: string}} [shadow]
 *   drop shadow: true (default) | false | explicit geometry
 * @property {boolean} [manualZ] opt out of y-based depth sorting (e.g. ground)
 */

/**
 * Base class for a static sprite element. A concrete element is a pure
 * *declaration* — no DOM, no render() — via a static `descriptor`:
 *
 * ```js
 * export class House00 extends SpriteElement {
 *   static descriptor = {
 *     width: 130, height: 130,
 *     atlas: 'map/map-sprites-02.png',   // relative to the assets base
 *     frame: [-1734, -2390],             // background-position into the atlas
 *     collision: [10, 50, 110, 70],      // optional [x, y, w, h]
 *     trigger:   [0, 0, 32, 32],         // optional [x, y, w, h]
 *     shadow: true,                      // true (default) | false | { width, height, top, left, borderRadius }
 *     manualZ: false,                    // opt out of y-based depth (e.g. ground)
 *   };
 * }
 * ```
 *
 * {@link SpriteRenderer} paints it; the model never touches the DOM.
 */
export class SpriteElement extends Element {
  /** Builds the element from the concrete subclass's static `descriptor`. */
  constructor() {
    const descriptor = new.target.descriptor;
    super(0, 0, descriptor.width, descriptor.height);

    this._descriptor = descriptor;

    if (descriptor.manualZ) {
      this.manualZ = true;
    }
    if (descriptor.collision) {
      this.createCollisionZone(...descriptor.collision);
    }
    if (descriptor.trigger) {
      this.createTriggerZone(...descriptor.trigger);
    }

    this.setRenderer(new SpriteRenderer(this));
  }

  /**
   * @returns {SpriteDescriptor} the element's sprite descriptor
   */
  getSpriteDescriptor() {
    return this._descriptor;
  }
}
