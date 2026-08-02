import { Emitter } from './Emitter.js';

/**
 * Dust kicked up under a walking character: it drifts slightly upwards and
 * fades, and it only appears **while the character actually moves**.
 *
 * Follows an element rather than a point, which is what proves the FX layer
 * tracks a moving world position while the camera scrolls:
 *
 * ```js
 * viewport.addBehavior(new FootstepDust(fx, {
 *   follow: character, offset: { x: 24, y: 44 }, isMoving: () => input.isMoving(),
 * }));
 * ```
 */
export class FootstepDust extends Emitter
{
  /** @type {Object} pale, slow, floating up rather than falling */
  static descriptor = {
    count: 3,
    direction: -Math.PI / 2,
    spread: Math.PI,
    speed: 18,
    gravity: -10,
    life: 600,
    size: 7,
    color: '#e8dcc4',
  };

  /** @type {number} */
  static interval = 120;

  /**
   * @param {import('./ParticleLayer.js').ParticleLayer} layer
   * @param {Object} [options] see {@link Emitter}, plus:
   * @param {() => boolean} [options.isMoving] predicate gating the emission;
   * without it the dust never shows, which is safer than dusting a statue
   */
  constructor(layer, options = {}) {
    super(layer, options);
    this._isMoving = options.isMoving ?? (() => false);
  }

  /** @returns {boolean} dust only rises under a moving character */
  shouldEmit() {
    return this._isMoving();
  }
}
