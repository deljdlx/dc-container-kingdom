import { EngineEvents } from '../events/EngineEvents.js';

/** How far outside the view an emitter still counts as visible, in world pixels. */
const CULL_MARGIN = 128;

/**
 * Turns the `fx` entries of element descriptors into live emitters.
 *
 * An element **declares** its effect the way it declares its collision zone or
 * its shadow — data, in coordinates local to itself. It never reaches for the
 * particle layer: the scene graph would then depend on a rendering surface. This
 * binder is what reads the declaration and wires it up.
 *
 * Binding is **explicit and idempotent**: no attach event exists yet, and
 * `_streamAreas` never runs in a host without a character. So a host binds when
 * it is ready, and may bind again — an element already bound is skipped.
 *
 * **Unbinding, on the other hand, is automatic**: the binder listens for
 * {@link EngineEvents.ELEMENT_DESTROY} on the global bus and lets go of the
 * subtree that is leaving. It used to be the Board's job to call `unbind()` by
 * hand before freeing an area — a coupling that only existed because dying
 * announced nothing.
 */
export class FxBinder
{

  /** @type {Map<Object, Array<Object>>} emitters created per element */
  _bound = new Map();

  /** @type {(() => void)|null} undoes the lifecycle subscription */
  _unsubscribe = null;

  /**
   * @param {Object} options
   * @param {import('./ParticleLayer.js').ParticleLayer} options.layer
   * @param {import('../view/Viewport.js').Viewport} options.viewport
   */
  constructor({ layer, viewport, groundLayer = null }) {
    this._layer = layer;
    this._groundLayer = groundLayer;
    this._viewport = viewport;

    // Duck-typed on purpose: a host may drive the binder with a bare viewport
    // stand-in, and losing the automatic unbind must not cost it the rest.
    const application = viewport?.getApplication?.();
    this._unsubscribe = application?.addEventListener?.(
      EngineEvents.ELEMENT_DESTROY,
      event => this.unbind(event.source),
    ) ?? null;
  }

  /**
   * Stop listening for departures. The emitters already bound are left alone —
   * dropping them is {@link unbind}'s job.
   */
  dispose() {
    this._unsubscribe?.();
    this._unsubscribe = null;
  }

  /**
   * @param {string} name 'ground' or 'above'
   * @returns {import('./ParticleLayer.js').ParticleLayer} the surface to spawn on
   */
  _layerFor(name) {
    return name === 'ground' && this._groundLayer ? this._groundLayer : this._layer;
  }

  /**
   * Whether a world point is close enough to the view to be worth emitting for.
   *
   * The margin matters: a fountain droplet lives 1.2s at 90px/s, so it travels
   * ~108px at most. Culling exactly at the edge would keep particles born just
   * off screen from ever entering the frame.
   * @param {number} x world
   * @param {number} y world
   * @returns {boolean}
   */
  isVisible(x, y) {
    const transform = this._viewport.getTransform();
    const screenX = transform.worldToScreenX(x);
    const screenY = transform.worldToScreenY(y);
    return screenX >= -CULL_MARGIN
      && screenY >= -CULL_MARGIN
      && screenX <= this._viewport.width() + CULL_MARGIN
      && screenY <= this._viewport.height() + CULL_MARGIN;
  }

  /**
   * Walk a subtree and wire every declared effect. Safe to call again: an
   * element already bound is left alone, so a reloaded area does not double its
   * output.
   * @param {Object} root an element (an area, the board…)
   * @returns {number} how many emitters were created by this call
   */
  bind(root) {
    let created = 0;
    for (const element of FxBinder.walk(root)) {
      created += this._bindElement(element);
    }
    return created;
  }

  /**
   * Drop every emitter of a subtree. Runs on `element.destroy` — the first of
   * the two belts against emitters outliving their element.
   * @param {Object} root
   * @returns {number} how many emitters were removed
   */
  unbind(root) {
    let removed = 0;
    for (const element of FxBinder.walk(root)) {
      const emitters = this._bound.get(element);
      if (!emitters) {
        continue;
      }
      emitters.forEach(emitter => {
        emitter.stop();
        this._viewport.removeBehavior(emitter);
        removed += 1;
      });
      this._bound.delete(element);
    }
    return removed;
  }

  /** @returns {number} how many emitters are currently bound */
  count() {
    let total = 0;
    this._bound.forEach(emitters => { total += emitters.length; });
    return total;
  }

  /**
   * @param {Object} element
   * @returns {number} emitters created for this element (0 if none or already bound)
   */
  _bindElement(element) {
    if (this._bound.has(element)) {
      return 0;
    }

    const declarations = element.constructor?.descriptor?.fx;
    if (!Array.isArray(declarations) || declarations.length === 0) {
      return 0;
    }

    const emitters = declarations.map(({ emitter: EmitterClass, at = null, layer = null, ...options }) => {
      // The effect knows where it belongs — dust on the ground, a jet above — so
      // a declaration that says nothing must not overrule it. Defaulting to
      // 'above' here silently lifted declared footstep dust over the scenery it
      // was meant to settle under; only a declaration that states a layer wins.
      const surface = layer ?? EmitterClass.descriptor?.layer ?? 'above';

      return new EmitterClass(this._layerFor(surface), {
        ...options,
        // After the spread, so a declaration carrying its own `descriptor` still
        // gets the layer tag the particles are sorted by.
        descriptor: { ...(options.descriptor ?? {}), layer: surface },
        follow: element,
        // `at` is local to the element — that is what makes the effect travel
        // with it, and what lets the same class be dropped anywhere.
        offset: at ?? { x: 0, y: 0 },
        isVisible: (x, y) => this.isVisible(x, y),
      });
    });

    emitters.forEach(emitter => this._viewport.addBehavior(emitter));
    this._bound.set(element, emitters);
    return emitters.length;
  }

  /**
   * Depth-first walk over an element subtree, root included.
   * @param {Object} root
   * @returns {Array<Object>}
   */
  static walk(root) {
    if (!root) {
      return [];
    }
    const found = [root];
    const children = typeof root.getChildren === 'function' ? root.getChildren() : [];
    const list = Array.isArray(children) ? children : Object.values(children ?? {});
    list.forEach(child => found.push(...FxBinder.walk(child)));
    return found;
  }
}
