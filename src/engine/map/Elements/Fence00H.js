import { SpriteElement } from '../SpriteElement.js';

export class Fence00H extends SpriteElement
{
  static descriptor = {
    width: 16,
    height: 16,
    atlas: 'map/map-sprites-01.png',
    frame: [-1520, -1520],
    collision: [0, 0, 16, 16],
  };
}
