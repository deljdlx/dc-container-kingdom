/**
 * Spawns particles at a steady rate, on the engine's single clock.
 *
 * An emitter is a **behavior**, not a timer: it is registered with
 * `viewport.addBehavior(emitter)` and receives the frame's `dt`, exactly like
 * {@link PatrolBehavior} or {@link FleeBehavior}. It therefore freezes and
 * resumes with the game, and never drifts from it.
 *
 * Its target is either a **fixed world point** (a fountain) or a **moving
 * element** (dust under a walking character). The element is duck-typed — it
 * only has to answer `offsetX()`/`offsetY()` — so an emitter can follow anything
 * placed in the world without the FX layer knowing what it is.
 *
 * Named effects subclass this to carry their own descriptor, and override
 * {@link shouldEmit} when they must stay silent (dust only while walking).
 */
export class Emitter
{

  /**
   * Emission descriptor, merged over {@link ParticleSystem.DEFAULTS}. Named
   * effects declare theirs here, the way `SpriteElement` declares its sprite.
   * @type {Object}
   */
  static descriptor = {};

  /** @type {number} milliseconds between two bursts */
  static interval = 100;

  /** @type {number} accumulated time since the last burst */
  _elapsed = 0;

  /** @type {boolean} */
  _running = true;

  /** @type {boolean} whether the target was ever seen inside the scene graph */
  _everAttached = false;

  /**
   * @param {import('./ParticleLayer.js').ParticleLayer} layer where to spawn
   * @param {Object} [options]
   * @param {{x: number, y: number}} [options.at] a fixed world point
   * @param {{offsetX: Function, offsetY: Function}} [options.follow] an element
   * to track; takes precedence over `at`
   * @param {{x: number, y: number}} [options.offset] shifts the spawn point,
   * so dust can land at the feet rather than the top-left corner
   * @param {Object} [options.descriptor] overrides the class descriptor
   * @param {number} [options.interval] overrides the class cadence
   * @param {(x: number, y: number) => boolean} [options.isVisible] world-space
   * visibility gate; an emitter off screen must not spend the shared particle
   * budget on droplets nobody can see
   */
  constructor(layer, {
    at = null, follow = null, offset = null, descriptor = null, interval = null, isVisible = null,
  } = {}) {
    this._layer = layer;
    this._at = at;
    this._follow = follow;
    this._offset = offset ?? { x: 0, y: 0 };
    this._descriptor = { ...this.constructor.descriptor, ...(descriptor ?? {}) };
    this._interval = interval ?? this.constructor.interval;
    this._isVisible = isVisible;
  }

  /**
   * An emitter bound to an element dies with it. `Element.destroy()` detaches
   * from the parent and tells nobody, so without this an emitter would outlive
   * its area and keep spawning at a dead thing's position — the very leak that
   * bit `freeArea` before (2026-07-26_14-18).
   *
   * But **"no parent" is not "destroyed"**: `Viewport.enableMainCharacter()`
   * builds its character and never attaches it to the scene graph, so an effect
   * following the player was killed on its first frame (regression of
   * 2026-08-02). What marks an orphan is having **had** a parent and lost it —
   * remembered here rather than sampled at construction, since a host may build
   * the emitter before attaching its target.
   * @returns {boolean} whether the emitter still has a reason to run
   */
  isAlive() {
    if (!this._follow || typeof this._follow.getParent !== 'function') {
      return true;
    }
    if (this._follow.getParent() !== null) {
      this._everAttached = true;
      return true;
    }
    return !this._everAttached;
  }

  /** @returns {this} */
  start() {
    this._running = true;
    return this;
  }

  /** Stop emitting; particles already alive still live out their lives. @returns {this} */
  stop() {
    this._running = false;
    return this;
  }

  /** @returns {boolean} */
  isRunning() {
    return this._running;
  }

  /**
   * Where the next burst spawns, in world coordinates. Following an element is
   * resolved **every frame**: that is what lets dust track a walking character.
   * @returns {{x: number, y: number}}
   */
  position() {
    const base = this._follow
      ? { x: this._follow.offsetX(), y: this._follow.offsetY() }
      : (this._at ?? { x: 0, y: 0 });
    return { x: base.x + this._offset.x, y: base.y + this._offset.y };
  }

  /**
   * Whether a burst is due this frame. Subclasses narrow this — dust only while
   * the character walks — without the base class knowing anything about them.
   * @returns {boolean}
   */
  shouldEmit() {
    return true;
  }

  /**
   * Tick the cadence and spawn when it comes due.
   * @param {number} dt elapsed milliseconds
   */
  update(dt) {
    if (!this._running) {
      return;
    }

    // Second belt against the leak: whatever path destroyed the target, an
    // orphaned emitter stops for good rather than haunting the loop.
    if (!this.isAlive()) {
      this.stop();
      return;
    }

    this._elapsed += dt;
    if (this._elapsed < this._interval) {
      return;
    }
    // Reset rather than subtract: after a long freeze (a background tab), the
    // backlog would otherwise fire as one huge burst.
    this._elapsed = 0;

    if (!this.shouldEmit()) {
      return;
    }

    const at = this.position();
    // Off screen, the burst is skipped entirely: the particle budget is shared
    // and capped, so invisible droplets would evict the ones being watched.
    if (this._isVisible && !this._isVisible(at.x, at.y)) {
      return;
    }
    this._layer.emit({ ...this._descriptor, x: at.x, y: at.y });
  }
}
