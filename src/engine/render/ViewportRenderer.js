import { isDebugEnabled } from '../debug.js';

/**
 * Renders a viewport: sizes its container, mounts the board (and the player
 * character on top of it), and applies the camera translation each frame.
 */
export class ViewportRenderer
{
  /**
   * @type {import('../Viewport.js').Viewport}
   */
  _viewport;

  /**
   * @type {DomElement}
   */
  _container;

  /**
   * @type {DomElement}
   */
  domCharacter;

  /**
   * Last transform painted, so the board is only rewritten when it actually
   * changed. Keyed on the produced CSS rather than on the camera position: it
   * catches a scale change too.
   * @type {string|null}
   */
  _lastCss = null;

  /**
   * @param {import('../Viewport.js').Viewport} viewport
   */
  constructor(viewport) {
    this._viewport = viewport;
    this._container = this._viewport.getContainer();
    this._board = this._viewport.getBoard();
  }

  /** Empty the viewport container. */
  clear() {
    this._container.innerHTML = '';
  }

  /**
   * Size the container and mount the board.
   *
   * The player is **not** mounted here any more: it lives on the board's entity
   * layer, so `BoardRenderer.mountPending()` puts it in the board root by the
   * same rules as everything else. It used to be appended by hand precisely
   * because it belonged to no container.
   */
  render() {
    this._container.style.width = this._viewport.getGeometry().width() + 'px';
    this._container.style.height = this._viewport.getGeometry().height() + 'px';
    this._container.append(this._viewport.getBoard().render());
    this.domCharacter = this._viewport.getCharacter()?.getDom() ?? null;
  }

  /** Draw board/character debug overlays; no-op unless debug mode is on. */
  renderDebug() {
    // No-op unless debug mode is on (?debug=1 → body.debug), so callers can
    // invoke it unconditionally.
    if(!isDebugEnabled()) {
      return;
    }
    // getBoard() rather than this._board: the renderer is constructed before the
    // board exists, so the cached field is stale (undefined).
    this._viewport.getBoard().getRenderer().renderDebug();
    if(this._viewport.getCharacter()) {
      this._viewport.getCharacter().getRenderer().renderCollisionZones();
    }
  }

  /** Feed the camera into the transform and wear it, only when it changed. */
  update() {
    const camera = this._viewport.getCamera();

    // `isActive()` says whether the CAMERA feeds the transform — not who owns it.
    // A host driving its own pan/zoom (drag, pinch) writes into the same
    // transform and leaves the camera idle. Depth is world-space, so nothing
    // here touches z-order.
    if(!camera.isActive()) {
      return;
    }

    // The transform stores the CSS translation, hence the negated camera.
    const transform = this._viewport.getTransform();
    transform.setOffset(-camera.x(), -camera.y());

    // update() runs 60×/s: without this guard it would re-emit an identical
    // transform every frame while the camera stands still.
    const css = transform.toCssTransform();
    if(css === this._lastCss) {
      return;
    }
    this._lastCss = css;

    transform.applyTo(this._viewport.getBoard().getRenderer().getDom());
  }
}
