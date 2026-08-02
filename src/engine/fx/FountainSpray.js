import { Emitter } from './Emitter.js';

/**
 * A jet of droplets thrown upwards, falling back under gravity — a fountain, a
 * geyser, a burst pipe.
 *
 * Declarative like a {@link SpriteElement}: the numbers live in the static
 * descriptor, the behaviour is inherited. Point it at a world position:
 *
 * ```js
 * viewport.addBehavior(new FountainSpray(fx, { at: { x: 224, y: 438 } }));
 * ```
 */
export class FountainSpray extends Emitter
{
  /** @type {Object} two droplets, upwards in a narrow cone, pulled back down */
  static descriptor = {
    count: 2,
    direction: -Math.PI / 2,
    spread: 0.9,
    speed: 90,
    gravity: 220,
    life: 1200,
    size: 5,
    color: '#9fe4ff',
  };

  /** @type {number} */
  static interval = 40;
}
