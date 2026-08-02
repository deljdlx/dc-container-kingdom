/**
 * A pool of short-lived particles, simulated in **world space**.
 *
 * Pure by design: it knows nothing of the DOM, of a canvas or of the camera. It
 * spawns particles, ages them by the frame's `dt` and forgets the dead ones —
 * which is what makes it testable without a DOM, like {@link DirectionalInput}.
 * Drawing lives in {@link ParticleLayer}.
 *
 * Units follow the rest of the engine: `dt` and `life` in **milliseconds**,
 * speeds in **pixels per second**.
 */
export class ParticleSystem
{

  /** @type {number} particles kept at most; the oldest die first beyond it */
  static DEFAULT_BUDGET = 600;

  /** @type {Object} emission defaults, deliberately narrow until real uses exist */
  static DEFAULTS = {
    count: 1,
    life: 800,
    size: 4,
    color: '#ffffff',
    speed: 40,
    /** radians: the arc particles are spread over, centred on `direction` */
    spread: Math.PI * 2,
    /** radians: 0 points right, like canvas angles */
    direction: 0,
    /** pixels per second², positive pulls down */
    gravity: 0,
    /** which surface paints it: 'above' the map, or on the 'ground' under it */
    layer: 'above',
  };

  /** @type {Array<Object>} live particles, oldest first */
  _particles = [];

  /**
   * @param {Object} [options]
   * @param {number} [options.budget] hard cap on live particles
   * @param {() => number} [options.random] injectable RNG, so tests are deterministic
   */
  constructor({ budget = ParticleSystem.DEFAULT_BUDGET, random = Math.random } = {}) {
    this._budget = budget;
    this._random = random;
  }

  /**
   * Spawn particles at a world position.
   * @param {Object} descriptor merged over {@link ParticleSystem.DEFAULTS}; `x`
   * and `y` are world coordinates
   * @returns {this}
   */
  emit(descriptor = {}) {
    const spec = { ...ParticleSystem.DEFAULTS, ...descriptor };
    for (let index = 0; index < spec.count; index += 1) {
      const angle = spec.direction + (this._random() - 0.5) * spec.spread;
      this._particles.push({
        x: spec.x ?? 0,
        y: spec.y ?? 0,
        vx: Math.cos(angle) * spec.speed,
        vy: Math.sin(angle) * spec.speed,
        gravity: spec.gravity,
        age: 0,
        life: spec.life,
        size: spec.size,
        color: spec.color,
        layer: spec.layer,
      });
    }

    // Over budget, the oldest go: a burst must never be able to grow the pool
    // without bound, and dropping the newest would hide the effect that fired.
    const excess = this._particles.length - this._budget;
    if (excess > 0) {
      this._particles.splice(0, excess);
    }
    return this;
  }

  /**
   * Advance every particle and drop those whose life ran out.
   * @param {number} dt elapsed milliseconds since the previous frame
   */
  update(dt) {
    if (dt <= 0 || this._particles.length === 0) {
      return;
    }

    const seconds = dt / 1000;
    const alive = [];
    for (const particle of this._particles) {
      particle.age += dt;
      if (particle.age >= particle.life) {
        continue;
      }
      particle.vy += particle.gravity * seconds;
      particle.x += particle.vx * seconds;
      particle.y += particle.vy * seconds;
      alive.push(particle);
    }
    this._particles = alive;
  }

  /**
   * How far through its life a particle is, for fading.
   * @param {Object} particle
   * @returns {number} 0 at birth, 1 at death
   */
  static progressOf(particle) {
    return particle.life > 0 ? Math.min(particle.age / particle.life, 1) : 1;
  }

  /** @returns {Array<Object>} the live particles (not a copy — read, don't mutate) */
  particles() {
    return this._particles;
  }

  /** @returns {number} how many particles are alive */
  count() {
    return this._particles.length;
  }

  /** Drop every particle immediately. */
  clear() {
    this._particles = [];
  }
}
