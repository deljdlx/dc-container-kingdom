import { ParticleSystem } from './ParticleSystem.js';

/** Share of the sprite radius painted at full colour before the halo fades out. */
const SOLID_CORE = 0.45;

/**
 * Paints the particles of one layer onto an {@link FxSurface}.
 *
 * All of this used to live in the surface itself. Splitting it changes nothing
 * for particles and everything for the rest: the surface can now carry a
 * projectile or an explosion without knowing what either is.
 */
export class ParticlePainter
{
  /** @type {Map<string, Object>} pre-rendered sprite per colour **and** size */
  _sprites = new Map();

  /** @type {?import('./FxSurface.js').FxSurface} the surface it draws on */
  _surface = null;

  /**
   * @param {ParticleSystem} system the simulation to read from
   * @param {Object} [options]
   * @param {string} [options.layer] which particles this painter is responsible for
   */
  constructor(system, { layer = 'above' } = {}) {
    this._system = system;
    this._layer = layer;
  }

  /**
   * @param {import('./FxSurface.js').FxSurface} surface
   */
  attach(surface) {
    this._surface = surface;
  }

  /** @returns {Array<Object>} the particles this painter is responsible for */
  _mine() {
    return this._system.particles().filter(particle => particle.layer === this._layer);
  }

  /** @returns {boolean} whether anything of this layer is alive */
  hasWork() {
    return this._mine().length > 0;
  }

  /**
   * @param {Object} context 2d context, already transformed into world space
   */
  paint(context) {
    for (const particle of this._mine()) {
      const size = particle.size;
      // `fade` shapes the decay: 1 is the plain linear fade, higher keeps a
      // particle opaque longer and drops it late, lower dissolves it at once.
      const progress = ParticleSystem.progressOf(particle);
      const fade = particle.fade ?? 1;
      context.globalAlpha = fade === 1 ? 1 - progress : Math.max(0, 1 - progress ** fade);
      const sprite = this._spriteFor(particle.color, size);
      if (sprite) {
        context.drawImage(sprite, particle.x - size / 2, particle.y - size / 2, size, size);
      } else {
        // No offscreen surface available (a bare host, or a test double): draw
        // squares rather than an `arc()` per particle per frame.
        context.fillStyle = particle.color;
        context.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
      }
    }
    context.globalAlpha = 1;
  }

  /**
   * A soft dot, rendered once per colour and reused. Building a radial gradient
   * per particle and per frame is the classic way to make a canvas crawl.
   * @param {string} color
   * @param {number} size
   * @returns {Object|null} a drawable surface, or null when none can be created
   */
  _spriteFor(color, size) {
    // Keyed on colour **and** size: the sprite is baked at one resolution, so
    // two effects sharing a colour but not a size would otherwise share the one
    // baked first and get it stretched — blurry. Harmless while every effect had
    // its own colour; not once palettes are encouraged.
    const key = `${color}@${Math.ceil(size)}`;
    if (this._sprites.has(key)) {
      return this._sprites.get(key);
    }

    const surface = this._surface?.createOffscreen(Math.max(8, Math.ceil(size) * 4)) ?? null;
    const context = surface?.getContext?.('2d') ?? null;
    if (!context) {
      this._sprites.set(key, null);
      return null;
    }

    const half = surface.width / 2;
    const gradient = context.createRadialGradient(half, half, 0, half, half, half);
    // A solid core before the falloff. Fading from the very centre measured at 83
    // non-transparent pixels for 40 particles — a dot one pixel wide, invisible.
    gradient.addColorStop(0, color);
    gradient.addColorStop(SOLID_CORE, color);
    gradient.addColorStop(1, 'transparent');
    context.fillStyle = gradient;
    context.fillRect(0, 0, surface.width, surface.height);

    this._sprites.set(key, surface);

    return surface;
  }
}
