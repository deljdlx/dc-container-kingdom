import { SpriteElement } from '../SpriteElement.js';

export class Fountain00 extends SpriteElement
{
  static descriptor = {
    width: 80,
    height: 64,
    atlas: 'map/map-sprites-01.png',
    frame: [-1170, -2754],
    collision: [4, 5, 70, 59],
    shadow: { borderRadius: '100%', top: 16, height: 54 },
  };
}
