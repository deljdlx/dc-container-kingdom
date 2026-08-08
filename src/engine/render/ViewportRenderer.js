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

  /** Last clock state pushed to the CSS, so it is only written when it changes. @type {?string} */
  _lastClockState = null;

  /**
   * How long a character's CSS transition lasts at scale 1, in ms — kept in
   * step with `character.css`.
   */
  static STEP_TRANSITION = 200;

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
  /**
   * Hand the clock's state to the stylesheet.
   *
   * NPCs step 4 px every 60 ms — a sixth of the frames — and a CSS transition
   * smooths that cadence. It is the one piece of animation the engine does not
   * tick itself, so it must be told what the clock is doing, or it runs on wall
   * time: a paused NPC would keep gliding, and in slow motion the browser would
   * still spend 200 real milliseconds easing a step the engine now takes four
   * times slower.
   *
   * Written only when the state changes — this runs every frame.
   * @param {import('../time/Clock.js').Clock} clock
   */
  applyClockState(clock) {
    const scale = clock.scale();
    const frozen = clock.isPaused() || scale === 0;
    const state = `${frozen}:${scale}`;
    if (state === this._lastClockState) {
      return;
    }
    this._lastClockState = state;

    this._container.classList.toggle('engine--frozen', frozen);
    this._container.style.setProperty(
      '--engine-step-duration',
      `${frozen ? 0 : ViewportRenderer.STEP_TRANSITION / scale}ms`,
    );
  }

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
