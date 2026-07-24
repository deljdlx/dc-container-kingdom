import { SpriteElement } from '../SpriteElement.js';

export class House00 extends SpriteElement
{
  static descriptor = {
    width: 130,
    height: 130,
    atlas: 'map/map-sprites-02.png',
    frame: [-1734, -2390],
    collision: [10, 50, 110, 70],
  };
}
