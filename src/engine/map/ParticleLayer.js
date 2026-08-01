import { ParticleSystem } from './ParticleSystem.js';

/** Share of the sprite radius painted at full colour before the halo fades out. */
const SOLID_CORE = 0.45;

/**
 * The canvas the particles are painted on: a **screen-space** surface the size
 * of the viewport, mounted as a sibling of the board and above it.
 *
 * Emitters keep speaking **world coordinates** like the rest of the engine; the
 * camera offset is applied here, once per frame, by the canvas transform. Being
 * a sibling of the board keeps it out of the painter's algorithm — but *not* out
 * of the z-order: the board carries a computed depth of its own, so the surface
 * is raised to `FX_DEPTH` when mounted (see {@link Viewport#enableParticles}).
 *
 * Consequence, assumed: a particle **cannot pass behind a tree**. For sparks and
 * smoke that is invisible; the day it matters, a second canvas goes *under* the
 * entities — never one canvas per depth.
 *
 * Nothing in the engine reads this layer back: it is write-only and disposable.
 * An effect that must be collidable or clickable belongs in the scene graph.
 */
export class ParticleLayer
{

  /** @type {number} beyond this, the extra pixels cost more than they show */
  static MAX_PIXEL_RATIO = 2;

  /** @type {Object|null} 2d context, or null when the host cannot provide one */
  _context = null;

  /** @type {boolean} whether the last frame left anything painted */
  _painted = false;

  /** @type {Map<string, Object>} pre-rendered sprite per colour */
  _sprites = new Map();

  /**
   * @param {HTMLCanvasElement|Object} canvas the surface to paint on; duck-typed
   * so tests can pass a recorder instead of a real canvas
   * @param {Object} [options]
   * @param {ParticleSystem} [options.system]
   * @param {number} [options.pixelRatio] usually `window.devicePixelRatio`
   */
  constructor(canvas, { system, pixelRatio = 1 } = {}) {
    this._canvas = canvas;
    this._system = system ?? new ParticleSystem();
    this._pixelRatio = Math.max(1, Math.min(pixelRatio, ParticleLayer.MAX_PIXEL_RATIO));

    // jsdom answers `null` here (the native `canvas` package is deliberately not
    // a dependency), and a host may hand us anything: a missing context must
    // leave the simulation running and paint nothing, never throw.
    this._context = canvas?.getContext?.('2d') ?? null;
  }

  /** @returns {ParticleSystem} the simulation behind the layer */
  getSystem() {
    return this._system;
  }

  /**
   * Spawn particles at a world position — see {@link ParticleSystem.DEFAULTS}.
   * @param {Object} descriptor
   * @returns {this}
   */
  emit(descriptor) {
    this._system.emit(descriptor);
    return this;
  }

  /**
   * Size the surface. The backing store is scaled by the pixel ratio so the
   * result stays crisp; the CSS size stays the viewport size.
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this._width = width;
    this._height = height;
    this._canvas.width = Math.round(width * this._pixelRatio);
    this._canvas.height = Math.round(height * this._pixelRatio);
    if (this._canvas.style) {
      this._canvas.style.width = `${width}px`;
      this._canvas.style.height = `${height}px`;
    }
  }

  /**
   * Advance the simulation. Separate from {@link render} because drawing must
   * happen after the camera has moved, while ageing does not care.
   * @param {number} dt elapsed milliseconds
   */
  update(dt) {
    this._system.update(dt);
  }

  /**
   * Paint the live particles in **world coordinates** — the transform is what
   * puts them where the map is, zoom included.
   * @param {import('./ViewportTransform.js').ViewportTransform} [transform]
   */
  render(transform = null) {
    if (!this._context) {
      return;
    }

    const particles = this._system.particles();
    // Idle costs nothing: with nothing alive and nothing left over from the
    // previous frame, we do not even clear. Same discipline as the camera
    // transform, which is not rewritten while the camera stands still.
    if (particles.length === 0 && !this._painted) {
      return;
    }

    const context = this._context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    if (particles.length === 0) {
      this._painted = false;
      return;
    }

    // The transform owns scale, offset and pixel ratio — applying any of them
    // here as well would count them twice.
    if (transform) {
      transform.applyToContext(context);
    } else {
      const ratio = this._pixelRatio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    for (const particle of particles) {
      const size = particle.size;
      context.globalAlpha = 1 - ParticleSystem.progressOf(particle);
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
    this._painted = true;
  }

  /**
   * A soft dot, rendered once per colour and reused. Building a radial gradient
   * per particle and per frame is the classic way to make a canvas crawl.
   * @param {string} color
   * @param {number} size
   * @returns {Object|null} a drawable surface, or null when none can be created
   */
  _spriteFor(color, size) {
    if (this._sprites.has(color)) {
      return this._sprites.get(color);
    }

    const surface = this._createSurface(Math.max(8, Math.ceil(size) * 4));
    const context = surface?.getContext?.('2d') ?? null;
    if (!context) {
      this._sprites.set(color, null);
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

    this._sprites.set(color, surface);
    return surface;
  }

  /**
   * @param {number} size
   * @returns {Object|null} an offscreen surface borrowed from the host document
   */
  _createSurface(size) {
    const document = this._canvas?.ownerDocument;
    if (!document?.createElement) {
      return null;
    }
    const surface = document.createElement('canvas');
    surface.width = size;
    surface.height = size;
    return surface;
  }
}
