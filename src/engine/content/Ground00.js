import { SpriteElement } from '../scene/SpriteElement.js';

/**
 * A ground tile: walkable, no shadow, and pinned below other elements via
 * `manualZ` so it never participates in y-based depth sorting.
 */
export class Ground00 extends SpriteElement
{
  /** @type {import('../SpriteElement.js').SpriteDescriptor} */
  static descriptor = {
    width: 50,
    height: 50,
    atlas: 'map/map-sprites-01.png',
    frame: [-1790, -800],
    manualZ: true,
    shadow: false,
  };
}
