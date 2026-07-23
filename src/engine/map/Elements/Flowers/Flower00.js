import { SpriteElement } from '../../SpriteElement.js';

export class Flower00 extends SpriteElement
{
  static descriptor = {
    width: 32,
    height: 32,
    atlas: 'map/flowers-00.png',
    frame: [0, -96],
    trigger: [0, 0, 32, 32],
  };
}
