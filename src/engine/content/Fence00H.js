import { SpriteElement } from '../scene/SpriteElement.js';

/**
 * A single horizontal fence tile, solid over its full 16×16 cell. Tiled
 * side by side by FenceGroup00 to build a fence run.
 */
export class Fence00H extends SpriteElement
{
  /** @type {import('../SpriteElement.js').SpriteDescriptor} */
  static descriptor = {
    width: 16,
    height: 16,
    atlas: 'map/map-sprites-01.png',
    frame: [-1520, -1520],
    collision: [0, 0, 16, 16],
  };
}
