import { isDebugEnabled } from '../../debug.js';

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
   * Last camera position painted, so the board transform is only rewritten when
   * the camera actually moved.
   * @type {number|null}
   */
  _lastCameraX = null;

  /**
   * @type {number|null}
   */
  _lastCameraY = null;

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

  /** Size the container, mount the board, then mount the character over it. */
  render() {
    this._container.style.width = this._viewport.getGeometry().width() + 'px';
    this._container.style.height = this._viewport.getGeometry().height() + 'px';
    this._container.append(this._viewport.getBoard().render());


    if(this._viewport.getCharacter()) {
      this.domCharacter = this._viewport.getCharacter().getRenderer().render();
      this._viewport.getBoard().getRenderer().getDom().append(this.domCharacter);
    }

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

  /** Translate the board to follow the camera, only when it moved this frame. */
  update() {
    const camera = this._viewport.getCamera();

    // The camera stays out of the way unless it is actually driving the view
    // (a host that translates the board itself — e.g. drag/zoom — keeps it
    // inactive). Depth is world-space, so nothing here touches z-order.
    if(!camera.isActive()) {
      return;
    }

    // Only rewrite the board transform when the camera actually moved. Left
    // untouched, update() runs 60×/s and would otherwise re-emit an identical
    // transform every frame while the camera is idle.
    const x = camera.x();
    const y = camera.y();
    if(x === this._lastCameraX && y === this._lastCameraY) {
      return;
    }
    this._lastCameraX = x;
    this._lastCameraY = y;

    this._viewport.getBoard().getRenderer().getDom().style.transform =
      `translate(${-x}px, ${-y}px)`;
  }
}
