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
    // A palette, not a single tone: dust that comes out all the same shade reads
    // as a flat blob. Three neighbouring sands are enough to make it look like
    // matter — and a host that wants one colour just passes a string.
    color: ['#e8dcc4', '#d9c9a8', '#f2e8d5'],
    // Dust belongs on the ground: a tree in front of the walker must hide it.
    layer: 'ground',
  };

  /** @type {number} */
  static interval = 120;

  /** @type {boolean} whether the target walked at all since the last burst */
  _walkedSinceBurst = false;

  /**
   * @param {import('./ParticleLayer.js').ParticleLayer} layer
   * @param {Object} [options] see {@link Emitter}, plus:
   * @param {() => boolean} [options.isMoving] predicate gating the emission.
   * Omit it and the effect **asks whatever it follows** — which is what makes it
   * reusable: the same dust works under the player and under an NPC, and can be
   * declared on a character class rather than wired by hand.
   */
  constructor(layer, options = {}) {
    super(layer, options);
    this._isMoving = options.isMoving ?? null;
  }

  /**
   * Watch every frame, burst on the emitter's own cadence.
   *
   * The two clocks do not line up: an NPC patrol steps every 60 ms while the
   * dust bursts every 120 ms, and `Character.isWalking()` is **one frame wide**
   * by design. Sampling it at burst time therefore asked «are you walking right
   * now?» on a frame where the NPC happened to be between steps — measured: not
   * a single particle in two seconds of patrolling.
   *
   * So the answer is remembered rather than sampled. The old predicate got away
   * with sampling because it read the *keyboard*, which stays true for as long
   * as a key is held.
   * @param {number} dt elapsed milliseconds
   */
  update(dt) {
    this._walkedSinceBurst = this._walkedSinceBurst || this._isTargetWalking();
    super.update(dt);
  }

  /**
   * Dust rises if the target walked since the last burst, and the answer is
   * consumed — standing still for a full window stops it.
   * @returns {boolean}
   */
  shouldEmit() {
    const walked = this._walkedSinceBurst;
    this._walkedSinceBurst = false;

    return walked;
  }

  /**
   * With no predicate given, the followed element is asked. Something that
   * cannot answer — a rock, a house, a bare `Element` — stays **silent**: better
   * mute than dust under a statue, and the caller keeps the last word by passing
   * its own predicate.
   * @returns {boolean}
   */
  _isTargetWalking() {
    if (this._isMoving) {
      return this._isMoving();
    }

    return typeof this._follow?.isWalking === 'function' && this._follow.isWalking();
  }
}
