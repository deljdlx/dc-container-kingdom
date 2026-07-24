import { SpriteElement } from '../SpriteElement.js';

/**
 * A small decorative sunflower sprite; non-solid, purely ornamental.
 */
export class Sunflower00 extends SpriteElement
{
  /** @type {import('../SpriteElement.js').SpriteDescriptor} */
  static descriptor = {
    width: 16,
    height: 24,
    atlas: 'map/map-sprites-01.png',
    frame: [-1760, -1256],
  };
}
