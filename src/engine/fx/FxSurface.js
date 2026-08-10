/**
 * A canvas the engine paints on, and **nothing more**: it sizes itself, places
 * itself over the world, applies the camera transform, clears — and hands the
 * context to a list of **painters**.
 *
 * It does not know what a particle is. That knowledge used to live here, which
 * was invisible while particles were the only thing ever drawn; the day
 * projectiles and explosions had to be drawn too, the surface was the one class
 * standing in the way. A painter is anything that answers:
 *
 * ```js
 * painter.hasWork()                    // nothing to draw → the surface stays idle
 * painter.paint(context, transform)
 * painter.attach?.(surface)            // optional, called when it joins
 * ```
 *
 * **Each painter is wrapped in `save()` / `restore()`.** That is the whole
 * reason a second canvas is not needed for isolation: a painter that leaves
 * `globalAlpha` at 0.2 or the matrix rotated cannot corrupt the next one. A
 * dedicated surface per concern would cost a full-screen clear and repaint per
 * frame at the mobile pixel ratio, and would reopen the question of which depth
 * it sits at — which has no good answer.
 *
 * Nothing in the engine reads a surface back: it is write-only and disposable.
 * An effect that must be collidable or clickable belongs in the scene graph.
 */
export class FxSurface
{
  /** @type {number} beyond this, the extra pixels cost more than they show */
  static MAX_PIXEL_RATIO = 2;

  /** @type {Object|null} 2d context, or null when the host cannot provide one */
  _context = null;

  /** @type {boolean} whether the last frame left anything painted */
  _painted = false;

  /** @type {string|null} last placement written, so an idle view writes nothing */
  _placement = null;

  /** @type {Array<Object>} the painters, drawn in order */
  _painters = [];

  /**
   * @param {HTMLCanvasElement|Object} canvas the surface to paint on; duck-typed
   * so tests can pass a recorder instead of a real canvas
   * @param {Object} [options]
   * @param {number} [options.pixelRatio] usually `window.devicePixelRatio`
   */
  constructor(canvas, { pixelRatio = 1 } = {}) {
    this._canvas = canvas;
    this._pixelRatio = Math.max(1, Math.min(pixelRatio, FxSurface.MAX_PIXEL_RATIO));

    // jsdom answers `null` here (the native `canvas` package is deliberately not
    // a dependency), and a host may hand us anything: a missing context must
    // leave the simulation running and paint nothing, never throw.
    this._context = canvas?.getContext?.('2d') ?? null;
  }

  /** @returns {HTMLCanvasElement|Object} the surface being painted on */
  getCanvas() {
    return this._canvas;
  }

  /**
   * Add a painter, drawn after those already registered.
   * @param {Object} painter
   * @returns {Object} the painter, for chaining
   */
  addPainter(painter) {
    if (!this._painters.includes(painter)) {
      this._painters.push(painter);
      painter.attach?.(this);
    }

    return painter;
  }

  /**
   * @param {Object} painter
   * @returns {boolean} whether it was registered
   */
  removePainter(painter) {
    const index = this._painters.indexOf(painter);
    if (index === -1) {
      return false;
    }
    this._painters.splice(index, 1);

    return true;
  }

  /** @returns {Array<Object>} the registered painters, in drawing order */
  getPainters() {
    return this._painters;
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
   * Lay the surface over the view **from inside the board**.
   *
   * A ground surface is a child of the board, so it wears the board's CSS
   * transform: it is positioned in **world** units, and the browser translates
   * and scales it. Its origin is the world point that lands at screen (0, 0),
   * which is exactly what makes {@link ViewportTransform#applyToContext} work
   * unchanged for both surfaces.
   *
   * Nothing is written when nothing moved — the same discipline as the board
   * transform. Resizing in particular **wipes the canvas**, so it must not
   * happen on every frame of a pinch.
   * @param {import('../view/ViewportTransform.js').ViewportTransform} transform
   * @param {number} viewWidth viewport width in CSS pixels
   * @param {number} viewHeight viewport height in CSS pixels
   */
  placeInWorld(transform, viewWidth, viewHeight) {
    const scale = transform.scale();
    const originX = transform.screenToWorldX(0);
    const originY = transform.screenToWorldY(0);
    const worldWidth = viewWidth / scale;
    const worldHeight = viewHeight / scale;

    // The backing store follows scale × ratio, or the surface blurs as soon as
    // the host zooms in.
    const backingWidth = Math.round(viewWidth * this._pixelRatio);
    const backingHeight = Math.round(viewHeight * this._pixelRatio);
    if (this._canvas.width !== backingWidth || this._canvas.height !== backingHeight) {
      this._canvas.width = backingWidth;
      this._canvas.height = backingHeight;
      this._painted = false;   // resizing cleared it
    }

    const style = this._canvas.style;
    if (!style) {
      return;
    }
    const placement = `${originX}|${originY}|${worldWidth}|${worldHeight}`;
    if (placement === this._placement) {
      return;
    }
    this._placement = placement;
    style.left = `${originX}px`;
    style.top = `${originY}px`;
    style.width = `${worldWidth}px`;
    style.height = `${worldHeight}px`;
  }

  /**
   * Clear, then let each painter draw in **world coordinates** — the transform
   * is what puts them where the map is, zoom included.
   * @param {import('../view/ViewportTransform.js').ViewportTransform} [transform]
   */
  render(transform = null) {
    if (!this._context) {
      return;
    }

    const working = this._painters.filter(painter => painter.hasWork());
    // Idle costs nothing: with no painter holding anything and nothing left over
    // from the previous frame, we do not even clear. Same discipline as the
    // camera transform, which is not rewritten while the camera stands still.
    if (working.length === 0 && !this._painted) {
      return;
    }

    const context = this._context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    if (working.length === 0) {
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

    for (const painter of working) {
      context.save?.();
      painter.paint(context, transform);
      context.restore?.();
    }
    this._painted = true;
  }

  /**
   * Borrow an offscreen surface from the host document — what a painter needs to
   * bake a sprite once instead of drawing it per frame.
   * @param {number} width
   * @param {number} [height]
   * @returns {Object|null} a surface, or null when the host cannot provide one
   */
  createOffscreen(width, height = width) {
    const document = this._canvas?.ownerDocument;
    if (!document?.createElement) {
      return null;
    }
    const surface = document.createElement('canvas');
    surface.width = width;
    surface.height = height;

    return surface;
  }
}
