import { Element } from './Element.js';
import { SpriteRenderer } from './Renderer/SpriteRenderer.js';

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
   * @returns {object} the element's sprite descriptor
   */
  getSpriteDescriptor() {
    return this._descriptor;
  }
}
