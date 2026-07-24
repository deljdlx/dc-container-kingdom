import { Viewport } from '../Viewport.js';

export class ViewportRenderer
{
  /**
   * @type {Viewport}
   */
  _viewport;

  /**
   * @type {DomElement}
   */
  _container;

  /**
   * @param {Viewport} viewport
   */

  /**
   * @type {DomElement}
   */
  domCharacter;

  /**
   * @type {number|null}
   */
  _lastCameraX = null;

  /**
   * @type {number|null}
   */
  _lastCameraY = null;

  constructor(viewport) {
    this._viewport = viewport;
    this._container = this._viewport.getContainer();
    this._board = this._viewport.getBoard();
  }

  clear() {
    this._container.innerHTML = '';
  }

  /**
   * @param {DomElement} container
   */
  render() {
    this._container.style.width = this._viewport.getGeometry().width() + 'px';
    this._container.style.height = this._viewport.getGeometry().height() + 'px';
    this._container.append(this._viewport.getBoard().render());


    if(this._viewport.getCharacter()) {
      this.domCharacter = this._viewport.getCharacter().getRenderer().render();
      this._viewport.getBoard().getRenderer().getDom().append(this.domCharacter);
    }

  }

  renderDebug() {
    this._board.getRenderer().renderDebug();
    if(this._viewport.getCharacter()) {
      this._viewport.getCharacter().getRenderer().renderCollisionZones();
    }
  }

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
