import { SpriteElement } from '../SpriteElement.js';

export class Fence00V extends SpriteElement
{
  static descriptor = {
    width: 8,
    height: 16,
    atlas: 'map/map-sprites-01.png',
    frame: [-1504, -1504],
    collision: [0, 0, 8, 16],
  };
}
