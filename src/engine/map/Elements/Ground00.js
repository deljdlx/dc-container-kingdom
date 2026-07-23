import { SpriteElement } from '../SpriteElement.js';

export class Ground00 extends SpriteElement
{
  static descriptor = {
    width: 50,
    height: 50,
    atlas: 'map/map-sprites-01.png',
    frame: [-1790, -800],
    manualZ: true,
    shadow: false,
  };
}
