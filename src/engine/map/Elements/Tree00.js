import { SpriteElement } from '../SpriteElement.js';

/**
 * A tree sprite, solid around its trunk, with a soft round drop shadow.
 */
export class Tree00 extends SpriteElement
{
  /** @type {import('../SpriteElement.js').SpriteDescriptor} */
  static descriptor = {
    width: 64,
    height: 64,
    atlas: 'map/map-sprites-01.png',
    frame: [-256, 0],
    collision: [24, 34, 16, 24],
    shadow: { width: 48, height: 30, top: 45, left: 10, borderRadius: '100%' },
  };
}
