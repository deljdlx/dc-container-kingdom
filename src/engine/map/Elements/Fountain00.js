import { SpriteElement } from '../SpriteElement.js';
import { FountainSpray } from '../../fx/FountainSpray.js';

/**
 * A fountain sprite, solid across its basin, with a round drop shadow — and the
 * jet that goes with it.
 *
 * The effect is declared here, in coordinates **local to the sprite**, exactly
 * like the collision box and the shadow: drop a fountain anywhere, or ten of
 * them, and each one sprays from its own basin. It only comes alive once a host
 * binds the subtree (see `FxBinder`); an element built outside a viewport — the
 * catalog builds 414 of them — stays inert.
 */
export class Fountain00 extends SpriteElement
{
  /** @type {import('../SpriteElement.js').SpriteDescriptor} */
  static descriptor = {
    width: 80,
    height: 64,
    atlas: 'map/map-sprites-01.png',
    frame: [-1170, -2754],
    collision: [4, 5, 70, 59],
    shadow: { borderRadius: '100%', top: 16, height: 54 },
    // Local: over the basin's spout — 39 of the sprite's 80px width, adjusted by eye.
    fx: [{ emitter: FountainSpray, at: { x: 39, y: 8 } }],
  };
}
