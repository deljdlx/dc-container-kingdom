import { SpriteElement } from '../SpriteElement.js';

/**
 * A house sprite, solid across its base so characters can't walk through it.
 */
export class House00 extends SpriteElement
{
  /** @type {import('../SpriteElement.js').SpriteDescriptor} */
  static descriptor = {
    width: 130,
    height: 130,
    atlas: 'map/map-sprites-02.png',
    frame: [-1734, -2390],
    collision: [10, 50, 110, 70],
  };
}
