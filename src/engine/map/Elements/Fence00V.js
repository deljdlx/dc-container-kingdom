import { SpriteElement } from '../SpriteElement.js';

/**
 * A single vertical fence tile, solid over its full 8×16 cell. Stacked
 * vertically by FenceGroup00 to build a fence run.
 */
export class Fence00V extends SpriteElement
{
  /** @type {import('../SpriteElement.js').SpriteDescriptor} */
  static descriptor = {
    width: 8,
    height: 16,
    atlas: 'map/map-sprites-01.png',
    frame: [-1504, -1504],
    collision: [0, 0, 8, 16],
  };
}
