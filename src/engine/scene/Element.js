import { Application } from '../Application.js';
import { CollisionSystem } from './CollisionSystem.js';
import { EngineEvents, makeEvent } from '../events/EngineEvents.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { Geometry } from './Geometry.js';
import { Renderer } from '../render/Renderer.js';
import { SceneGraph } from './SceneGraph.js';

/**
 * Base node of the map/scene tree. An Element owns its geometry, rendering,
 * scene-graph position and collision state, and delegates each concern to a
 * dedicated subsystem ({@link Geometry}, {@link Renderer}, {@link SceneGraph},
 * {@link CollisionSystem}, {@link EventEmitter}). Most public methods are thin
 * facades over those subsystems so call sites depend only on Element.
 */
export class Element
{
  /** @type {object} arbitrary caller-attached data bag */
  data = {};

  /** @type {Application} */
  _application;

  /** @type {boolean} when true, z-depth is not auto-derived from y */
  manualZ = false;

  /**
   * @type {CollisionSystem}
   */
  collision;


  /**
   * @type {Geometry}
   */
  geometry;

  /**
   * @type {SceneGraph}
   */
  scene = new SceneGraph(this);

  /**
   * @type {Renderer}
   */
  renderer;

  /**
   * @type {Boolean}
   */
  _needUpdate = false;

  /** @type {boolean} whether the DOM has been rendered at least once */
  rendered = false;

  /**
   * @type {boolean}
   */
  _staticPosition = false;

  /** @type {number} current move target, in local coordinates */
  _targetX;

  /** @type {number} current move target, in local coordinates */
  _targetY;

  /** @type {number} arrival tolerance in px around the move target */
  _targetHitZone = 2;

  /** @type {(element: Element) => void} invoked once when a move reaches its target */
  _onMoveEnd = () => null;

  /** @type {boolean} whether the element is currently moving toward its target */
  _moving = false;

  /** @type {number} move step per update, in px */
  _moveSpeed = 100;


  /**
   * @type {EventEmitter}
   */
  _events = new EventEmitter();


  /**
   * Wire up the subsystems and seed geometry, then build the collision box.
   * @param {?number} x
   * @param {?number} y
   * @param {?number} width
   * @param {?number} height
   */
  constructor(x = null, y = null, width = null, height = null,)
  {

    this._application = Application.mainInstance;


    this.geometry = new Geometry();
    this.setRenderer(new Renderer(this));

    // Owns the (empty) collision bounding box; the outer bounding box is built
    // once the geometry below is set.
    this.collision = new CollisionSystem(this);

    this.x(x);
    this.y(y);
    this.width(width);
    this.height(height);

    this.collision.initBoundingBox();
  }

  /**
   * @returns {*} the board of the application's viewport
   */
  getBoard() {
    return this._application.getViewport().getBoard();
  }

  /** Clear this element's rendering and that of its whole subtree. */
  clear() {
    this.getRenderer().clear();
    this.getChildren().forEach(child => {
      child.clear();
    });
  }

  /**
   * Announce the departure, then detach from the parent, reset the scene tree
   * and clear the rendering.
   *
   * The event fires **first**, while the element still has its parent, its
   * position and its children: a listener that has to let go of something
   * attached to this subtree — an FX emitter, a HUD entry — needs to be able to
   * walk it. Emitting after `scene.reset()` would hand it an empty node.
   */
  destroy() {
    this.handle(EngineEvents.ELEMENT_DESTROY, { element: this });

    const parent = this.getParent();
    if(parent) {
      parent.removeChild(this);
    }

    this.scene.reset();

    this.getRenderer().clear();
  }

  /**
   * Remove a direct child from the scene tree.
   * @param {Element} element
   */
  removeChild(element) {
    this.scene.removeChild(element);
    this.recomputeAggregates();
    this.needUpdate(true);
  }



  /**
   * Swap the renderer, cache its DOM node and (re)register DOM events.
   * @param {Renderer} renderer
   * @returns {Element} this
   */
  setRenderer(renderer) {
    this.renderer = renderer;
    this.dom = this.renderer.getDom();
    this.registerEvents();

    return this;
  }

  /**
   * @returns {HTMLElement} the element's DOM node
   */
  getDom() {
    return this.dom;
  }

  /**
   * Set the DOM node's inner HTML.
   * @param {string} html
   */
  setInnerHTML(html) {
    this.renderer.setInnerHTML(html);
  }

  /**
   * Add a CSS class to the DOM node.
   * @param {string} className
   */
  addClass(className) {
    this.renderer.addClass(className);
  }


  /** Bind DOM listeners that re-dispatch as engine events (e.g. click). */
  registerEvents() {
    this.dom.addEventListener('click', (event) => {
      this.handle(EngineEvents.ELEMENT_CLICK, {
        element: this,
        areaX: event.offsetX,
        areaY: event.offsetY,
        originalEvent: event,
      });
    })
  }


  // ===========================

  /**
   * Subscribe to a local event.
   * @param {string} name one of {@link EngineEvents}
   * @param {(data: object) => void} callback
   * @returns {() => void} unsubscribe
   */
  addEventListener(name, callback) {
    return this._events.on(name, callback);
  }

  /**
   * Stamp the envelope, emit locally, then relay to the application bus.
   *
   * There is **no bubbling through the scene tree** — local, then global, and
   * nothing in between. Assumed: walking the parent chain on every collision
   * event would cost more than the intermediate listeners are worth, and no
   * caller has needed one yet.
   *
   * An element with no application stays **silent rather than throwing**: the
   * catalogue builds elements before attaching them, and so will anything that
   * spawns an entity before it joins the world.
   * @param {string} name one of {@link EngineEvents}
   * @param {object} [data] the event's own payload
   */
  handle(name, data = {}) {
    const event = makeEvent(name, this, data);
    this._events.emit(name, event);
    this.getApplication()?.handle(name, event);
  }

  // ===========================
  /**
   * @returns {Application}
   */
  getApplication() {
    return this._application;
  }

  /**
   * @param {Application} application
   * @returns {Application} the same application
   */
  setApplication(application) {
    this._application = application;
    return application;
  }
  // ===========================

  /**
   * Get or set whether the element keeps a fixed position (ignores scrolling).
   * @param {?boolean} value
   * @returns {boolean}
   */
  staticPosition(value = null) {
    if(value  !== null) {
      this._staticPosition = value;
    }
    return this._staticPosition;
  }

  /**
   * Get or set the move speed (px per update).
   * @param {?number} value
   * @returns {number}
   */
  moveSpeed(value = null) {
    if(value !== null) {
      this._moveSpeed = value;
    }

    return this._moveSpeed;
  }

  /**
   * Get or set the moving flag.
   * @param {?boolean} value
   * @returns {boolean}
   */
  isMoving(value = null) {
    if(value !== null) {
      this._moving = value;
    }

    return this._moving;
  }


  /**
   * Advance one frame: step toward the move target, keep the parent's collision
   * box in sync, fire the move-end callback on arrival, then update the renderer
   * and recurse into children when a redraw is pending.
   */
  update() {
    if(this.isMoving() && this.y() < this._targetY) {
      this.direction = 'down';
      this.y(this.y() + this.moveSpeed());
    }
    else if(this.isMoving() && this.x() < this._targetX) {
      this.direction = 'right';
      this.x(this.x() + this.moveSpeed());
    }

    const parent = this.getParent();
    if(parent) {
      parent.updateCollisionBoundingBox(this);
    }

    const pending = this.needUpdate() || this.isMoving();
    // Cleared **before** the work, not after: anything flagged while this pass
    // runs — a child attaching a sibling, a collision flipping — belongs to the
    // next frame. Clearing afterwards would swallow those requests, since the
    // flag would be wiped the instant after it was raised.
    this.needUpdate(false);

    if(pending) {
      if(
        Math.abs(this._targetX - this.x()) <= this._targetHitZone
        && Math.abs(this._targetY - this.y()) <= this._targetHitZone
        && this.isMoving()
      ) {
        this._moving = false;
        this._onMoveEnd(this);
      }

      this.getRenderer().update();
      this.getChildren().forEach(element => {
        element.update();
      });
    }
  }


  /**
   * @returns {Element|null} the parent node
   */
  getParent() {
    return this.scene.getParent();
  }


  // ===========================

  /**
   * Get or set the element this node is positioned relative to.
   * @param {Element|null} element
   * @returns {Element|null}
   */
  relativeTo(element = null) {
    return this.scene.relativeTo(element);
  }

  /**
   * @returns {{x: number, y: number}} accumulated offset from the relativeTo chain
   */
  getRelativeToOffsets() {
    return this.scene.getRelativeToOffsets();
  }


  /**
   * Get or set the width.
   * @param {?number} value
   * @returns {number}
   */
  width(value = null) {
    return this.geometry.width(value);
  }

  /**
   * Get or set the height.
   * @param {?number} value
   * @returns {number}
   */
  height(value = null) {
    return this.geometry.height(value);
  }

  /**
   * Get or set the local x coordinate.
   * @param {?number} value
   * @returns {number}
   */
  x(value = null) {
    return this.geometry.x(value);
  }

  /**
   * Get or set the local y coordinate.
   * @param {?number} value
   * @returns {number}
   */
  y(value = null) {
    return this.geometry.y(value);
  }

  /**
   * @returns {number} world-space x (own x plus every ancestor's)
   */
  offsetX() {
    return this.scene.offsetX();
  }

  /**
   * @returns {number} world-space y (own y plus every ancestor's)
   */
  offsetY() {
    return this.scene.offsetY();
  }

  /**
   * Create, attach and return a fresh empty child element.
   * @returns {Element}
   */
  createElement() {
    return this.scene.createChild();
  }

  /**
   * Attach an existing element at (x, y), refresh bounding boxes and flag a redraw.
   * @param {number} x
   * @param {number} y
   * @param {Element} element
   * @param {string} name index key for name lookups
   * @returns {Element} the attached element
   */
  addElement(x = 0, y = 0, element, name) {
    this.scene.addChild(x, y, element, name);

    this.updateCollisionBoundingBox(element);
    this.updateBoundingBox(element);

    const parent = this.getParent();
    if(parent) {
      parent.updateCollisionBoundingBox(this);
    }

    this.needUpdate(true);
    return element;
  }

  /**
   * Add a collision zone of the given type.
   * @param {?number} x
   * @param {?number} y
   * @param {?number} width
   * @param {?number} height
   * @param {'collision'|'trigger'} type
   * @returns {import('./BoundingBox.js').BoundingBox} the created zone
   */
  createCollisionZone(x = null, y = null, width = null, height = null, type = 'collision') {
    return this.collision.createCollisionZone(x, y, width, height, type);
  }

  /**
   * Add a trigger zone.
   * @param {?number} x
   * @param {?number} y
   * @param {?number} width
   * @param {?number} height
   * @returns {import('./BoundingBox.js').BoundingBox} the created zone
   */
  createTriggerZone(x = null, y = null, width = null, height = null) {
    return this.collision.createTriggerZone(x, y, width, height);
  }

  /**
   * Grow the aggregate collision box to enclose a changed child.
   * @param {Element} element
   */
  updateCollisionBoundingBox(element) {
    this.collision.updateCollisionBoundingBox(element);
  }

  /**
   * Grow the outer bounding box to enclose a changed child.
   * @param {Element} element
   */
  updateBoundingBox(element) {
    this.collision.updateBoundingBox(element);
  }

  /**
   * Recompute aggregate bounding boxes from current children and propagate up.
   */
  recomputeAggregates() {
    this.collision.recomputeAggregates();

    const parent = this.getParent();
    if (parent) {
      parent.recomputeAggregates();
    }
  }

  // ===========================
  /**
   * Get or set the redraw-pending flag.
   *
   * **Raising it climbs, clearing it does not.** `true` marks the whole path up
   * to the root, which is what lets {@link update} prune: an ancestor that is
   * not flagged has nothing dirty below it, so the walk stops there. `false`
   * speaks **only for this node** — a node has no business declaring on behalf
   * of its ancestors, and doing so used to lose redraws: a child finishing its
   * update cleared its parent, so a sibling that had just asked to be redrawn
   * was never visited again.
   * @param {?boolean} value
   * @returns {boolean}
   */
  needUpdate(value = null) {
    if(value === true) {
      this._needUpdate = true;
      this.getParent()?.needUpdate(true);
    }
    else if(value === false) {
      this._needUpdate = false;
    }

    return this._needUpdate;
  }

  // ===========================

  /**
   * Get or set the collided flag for `type`.
   * @param {?boolean} value
   * @param {'collision'|'trigger'} type
   * @returns {boolean}
   */
  collided(value = null, type = 'collision') {
    return this.collision.collided(value, type);
  }

  /**
   * Detect trigger hits in `element`'s subtree and reconcile them.
   * @param {Element} element
   * @returns {Array|false}
   */
  getTrigger(element) {
    return this.collision.getTrigger(element);
  }

  /**
   * Detect hits of `type` in `element`'s subtree and reconcile them.
   * @param {Element} element
   * @param {'collision'|'trigger'} type
   * @returns {Array|false}
   */
  getCollision(element, type = 'collision') {
    return this.collision.getCollision(element, type);
  }

  /**
   * Detect collision and trigger hits in a single traversal (collision reconciled).
   * @param {Element} element
   * @returns {{collision: Array, trigger: Array}}
   */
  detectCollisionAndTrigger(element) {
    return this.collision.detectCollisionAndTrigger(element);
  }

  /**
   * Reconcile trigger hits against the previous frame.
   * @param {Element[]} hits
   */
  reconcileTrigger(hits) {
    return this.collision.reconcileTrigger(hits);
  }

  /**
   * Pure overlap test against `element`'s subtree (no events, no state).
   * @param {Element} element
   * @param {'collision'|'trigger'} type
   * @returns {boolean}
   */
  overlaps(element, type = 'collision') {
    return this.collision.overlaps(element, type);
  }

  /**
   * Drop all current collisions of `type` (fires end events).
   * @param {'collision'|'trigger'} type
   */
  clearCollision(type = 'collision') {
    return this.collision.clearCollision(type);
  }

  // ===========================

  /**
   * @param {Element} element
   * @returns {Element}
   */
  setParent(element) {
    return this.scene.setParent(element);
  }

  /**
   * @returns {Element[]} direct children
   */
  getChildren() {
    return this.scene.getChildren();
  }

  /**
   * @returns {Object<string, Element>} named children index
   */
  getChildrenByName() {
    return this.scene.getChildrenByName();
  }

  /**
   * Look up a direct child by name.
   * @param {string} name
   * @returns {Element}
   */
  getChildByName(name) {
    return this.scene.getChildByName(name);
  }

  /**
   * @returns {Element[]} the whole subtree, flattened
   */
  getAllChildren() {
    return this.scene.getAllChildren();
  }

  /**
   * @param {'collision'|'trigger'} type
   * @returns {import('./BoundingBox.js').BoundingBox[]} own zones of that type
   */
  getCollisionZones(type = 'collision') {
    return this.collision.getCollisionZones(type);
  }

  /**
   * @returns {import('./BoundingBox.js').BoundingBox} the aggregate collision box
   */
  getCollisionBoundingBox() {
    return this.collision.getCollisionBoundingBox();
  }

  /**
   * @returns {import('./BoundingBox.js').BoundingBox} the outer bounding box
   */
  getBoundingBox() {
    return this.collision.getBoundingBox();
  }


  // ===========================

  /**
   * @returns {Renderer}
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * @returns {Boolean}
   */
  isRendered() {
    return this.rendered;
  }

  /**
   * Render the element's DOM.
   * @returns {*} the renderer's render result
   */
  render() {
    this.rendered = true;
    return this.renderer.render();
  }

  /** Render this element's debug bounding box, then recurse into children. */
  renderBoundingBox() {
    this.renderer.renderBoundingBox();

    this.getChildren().forEach(element => {
      element.renderBoundingBox()
    });
  }

  /**
   * Render the debug overlay for this element's collision zones.
   * @returns {*} the renderer's result
   */
  renderCollisionZones() {
    return this.renderer.renderCollisionZones();
  }
}
