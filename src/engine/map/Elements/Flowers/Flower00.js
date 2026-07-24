import { SpriteElement } from '../../SpriteElement.js';

/**
 * A decorative flower sprite; non-solid but carries a trigger zone so
 * characters stepping onto it can fire an interaction.
 */
export class Flower00 extends SpriteElement
{
  /** @type {import('../../SpriteElement.js').SpriteDescriptor} */
  static descriptor = {
    width: 32,
    height: 32,
    atlas: 'map/flowers-00.png',
    frame: [0, -96],
    trigger: [0, 0, 32, 32],
  };
}
