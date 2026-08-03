import { Area } from './Area.js';
import { BoardRenderer } from '../render/BoardRenderer.js';
import { Element } from '../scene/Element.js';

/**
 * The infinite tiled world: a lazily-populated grid of {@link Area}s indexed by
 * integer map coordinates (`areas[x][y]`). Owns creation, streaming (load/free)
 * and rendering of areas around the viewport — and, beside the grid, the
 * **entity layer** where what does not belong to a tile lives.
 */
export class Board extends Element
{
  /** @type {Object<number, Object<number, import('./Area.js').Area>>} sparse [x][y] area grid */
  areas = {};

  /**
   * @type {Element|null} the entity layer, created on first {@link spawn}
   * @see getEntityLayer
   */
  _entities = null;

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
    // The entity layer is a child like the others, so it has just been
    // destroyed: forget it, or the next spawn would attach to a dead node.
    // Wiping the world takes its entities with it — that is the intent.
    this._entities = null;
    this.recomputeAggregates();
    this.renderer.clear();
    this.render();
  }

  // ===========================

  /**
   * The layer holding everything that belongs to the **world** rather than to a
   * tile: projectiles, explosions, dropped loot, anything that outlives the area
   * it appeared over.
   *
   * It sits at the board's origin, so its children are positioned in **world
   * coordinates** — an area's children live in area-local ones, which is exactly
   * what breaks for something that crosses areas.
   *
   * It is deliberately **not** in `this.areas`: {@link freeArea} only ever
   * destroys tracked areas, so streaming never touches it.
   * @returns {Element} the layer, created on first use
   */
  getEntityLayer() {
    if(!this._entities) {
      this._entities = new Element(0, 0, 0, 0);
      // No painter depth of its own: it is a container, not something drawn.
      // Its children carry their own depth from their world Y.
      this._entities.manualZ = true;
      this.addElement(0, 0, this._entities, 'entities');
    }

    return this._entities;
  }

  /**
   * Put an element into the world, in **world coordinates**.
   *
   * The counterpart of {@link despawn}. The engine does **not** cull: a
   * projectile ends its own life, a dropped item is meant to stay. The caller
   * owns the lifetime — see `despawn`, and `meta/documentation/engine.md`.
   * @param {Element} element
   * @param {number} x world
   * @param {number} y world
   * @returns {Element} the element, attached and due to be mounted next frame
   */
  spawn(element, x = 0, y = 0) {
    return this.getEntityLayer().addElement(x, y, element);
  }

  /**
   * Take an element out of the world — off the scene graph and off the page.
   * @param {Element} element
   * @returns {Element} the same element, now detached
   */
  despawn(element) {
    element.destroy();
    return element;
  }

  /** @returns {Element[]} the entities currently in the world */
  getEntities() {
    return this._entities ? this._entities.getChildren() : [];
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

