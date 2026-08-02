import { Area } from './Area.js';
import { BoardRenderer } from './Renderer/BoardRenderer.js';
import { Element } from './Element.js';

/**
 * The infinite tiled world: a lazily-populated grid of {@link Area}s indexed by
 * integer map coordinates (`areas[x][y]`). Owns creation, streaming (load/free)
 * and rendering of areas around the viewport.
 */
export class Board extends Element
{
  /** @type {Object<number, Object<number, import('./Area.js').Area>>} sparse [x][y] area grid */
  areas = {};

  /**
   * @param {import('./Viewport.js').Viewport} viewport
   */
  constructor(viewport) {
    super(0, 0, viewport.width(), viewport.height());
    this._viewport = viewport;
    this._application = viewport.getApplication();

    this.renderer = new BoardRenderer(this);
  }

  /** Synchronously create the central 7×7 block of areas (offline/mock start). */
  initialize() {
    for(let x = -3 ; x < 4 ; x++) {
      for(let y = -3 ; y < 4 ; y++) {
        this.createAreaAt(x, y);
      }
    }
  }

  /** Clear the board renderer and every loaded area, then re-render. */
  clear() {
    this.getChildren().slice().forEach((area) => {
      area.destroy();
    });
    this.areas = {};
    this.recomputeAggregates();
    this.renderer.clear();
    this.render();
  }

  /**
   * Fetch and populate the central 3×3 block of areas from the backend.
   * @param {(area: import('./Area.js').Area) => void} callback invoked per loaded area
   * @returns {Promise<import('./Area.js').Area[]>}
   */
  async initializeAsync(callback) {
    let promises = []
    for(let x = -1 ; x < 2 ; x++) {
      for(let y = -1 ; y < 2 ; y++) {
        promises.push(this.loadAreaAsync(x, y, callback));
      }
    }

    return Promise.all(promises);
  }

  /**
   * Load one area from the backend, instantiating its elements; no-op if already present.
   * @param {number} x
   * @param {number} y
   * @param {(area: import('./Area.js').Area) => void} callback invoked once the area is populated
   * @returns {Promise<import('./Area.js').Area>|import('./Area.js').Area}
   */
  async loadAreaAsync(x, y, callback) {
    if(!this.areaExistsAt(x, y)) {

      const area = this.createAreaAt(x, y);
      return this._application.fetchArea(x, y).then(data => {
        data.forEach(descriptor => {

          const element = this._application.instanciate(descriptor.element);

          if(element !== false) {
            area.addElement(
              descriptor.x,
              descriptor.y,
              element,
              descriptor.name,
            );
          }
        });
        callback(area);
        return area;
      });
    }
    return this.areas[x][y];
  }


  /**
   * Ensure an area exists at (x, y), creating it if needed; does not render.
   * @param {number} x
   * @param {number} y
   * @returns {import('./Area.js').Area}
   */
  loadArea(x, y) {
    if(!this.areaExistsAt(x, y)) {
      // Rendering of newly-created areas is batched by the caller
      // (Viewport._streamAreas) into a single board update.
      return this.createAreaAt(x, y);
    }

    return this.areas[x][y];
  }

  /**
   * Get the area at (x, y), lazily creating it if absent.
   * @param {number} x
   * @param {number} y
   * @returns {import('./Area.js').Area}
   */
  getAreaAt(x, y) {
    if(!this.areaExistsAt(x, y)) {
      this.loadArea(x, y);
    }

    return this.areas[x][y];
  }

  /**
   * Unload the area at (x, y), clearing its DOM; no-op if absent.
   * @param {number} x
   * @param {number} y
   * @returns {import('./Area.js').Area|false} the removed area, or false if none
   */
  freeArea(x, y) {
    if(!this.areaExistsAt(x, y)) {
      return false;
    }
    const area = this.areas[x][y];
    // `destroy()` announces itself: whoever holds something attached to this
    // area — the FX binder and its emitters, first of all — lets go on the
    // event. The Board has no business knowing they exist.
    area.destroy();
    delete this.areas[x][y];
    if (Object.keys(this.areas[x]).length === 0) {
      delete this.areas[x];
    }

    return area;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {boolean} whether an area is currently loaded at (x, y)
   */
  areaExistsAt(x, y) {
    if(typeof(this.areas[x]) === 'undefined') {
      return false;
    }
    if(typeof(this.areas[x][y]) === 'undefined') {
      return false;
    }
    return true;
  }

  /**
   * Create a fresh area at (x, y) and attach it as a child positioned by map coords.
   * @param {number} x
   * @param {number} y
   * @returns {import('./Area.js').Area}
   */
  createAreaAt(x, y) {
    if(typeof(this.areas[x]) === 'undefined') {
      this.areas[x] = {};
    }
    if(typeof(this.areas[x][y]) === 'undefined') {
      this.areas[x][y] = {};
    }
    const area = new Area(this, x , y);
    this.areas[x][y] = area;
    this.addElement(x * this.width(), y * this.height(), area);
    return this.areas[x][y];
  }

  /** @returns {Object<number, Object<number, import('./Area.js').Area>>} the sparse [x][y] area grid */
  getAreas() {
    return this.areas;
  }
}

