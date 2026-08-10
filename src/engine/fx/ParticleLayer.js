import { FxSurface } from './FxSurface.js';
import { ParticlePainter } from './ParticlePainter.js';
import { ParticleSystem } from './ParticleSystem.js';

/**
 * The common assembly: an {@link FxSurface} that comes with a
 * {@link ParticlePainter} already mounted.
 *
 * The surface and the particle drawing used to be one class, which meant the
 * owner of the canvas knew what a particle *was*. They are two now — and this
 * class is what keeps the everyday case a one-liner, for emitters and the
 * {@link FxBinder} that speak to «a layer they can emit on».
 *
 * A host that wants to draw something else adds its own painter:
 *
 * ```js
 * viewport.getParticles().addPainter(new SpritePainter());
 * ```
 *
 * Consequence of a canvas sitting at one fixed depth, assumed: a particle
 * **cannot pass behind a tree**. For sparks and smoke that is invisible; hence
 * the two surfaces, one under the entities (`ground`) and one over everything
 * (`above`) — never one canvas per depth.
 */
export class ParticleLayer extends FxSurface
{
  /**
   * @param {HTMLCanvasElement|Object} canvas the surface to paint on; duck-typed
   * so tests can pass a recorder instead of a real canvas
   * @param {Object} [options]
   * @param {ParticleSystem} [options.system] shared between surfaces, so the
   * particle budget stays a single global ceiling
   * @param {number} [options.pixelRatio] usually `window.devicePixelRatio`
   * @param {string} [options.layer] which particles this surface paints
   */
  constructor(canvas, { system, pixelRatio = 1, layer = 'above' } = {}) {
    super(canvas, { pixelRatio });

    this._system = system ?? new ParticleSystem();
    this._painter = this.addPainter(new ParticlePainter(this._system, { layer }));
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
   * Advance the simulation. Separate from {@link render} because drawing must
   * happen after the camera has moved, while ageing does not care.
   *
   * ⚠️ With two surfaces sharing one system, this must be called **once per
   * frame**, not once per surface — ageing twice would halve every lifetime.
   * `Viewport` owns that call.
   * @param {number} dt elapsed milliseconds
   */
  update(dt) {
    this._system.update(dt);
  }
}
