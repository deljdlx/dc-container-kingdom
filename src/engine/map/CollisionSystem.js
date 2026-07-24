import { BoundingBox } from './BoundingBox.js';

/**
 * Collision & bounding-box subsystem of an {@link Element}.
 *
 * Extracted so the base node keeps only scene-graph, geometry and rendering
 * concerns. Owns the collision/trigger zones, the aggregate bounding boxes and
 * the (recursive) hit detection; reaches back to the owning element for tree
 * traversal (parent/children) and event dispatch. Element exposes thin
 * delegating methods, so every existing call site keeps working unchanged.
 */
export class CollisionSystem {
  /** @type {import('./Element.js').Element} */
  _element;

  /** @type {BoundingBox} */
  _boundingBox;

  /** @type {BoundingBox} */
  _collisionBoundingBox;

  _zones = { collision: [], trigger: [] };
  _collidedWith = { collision: [], trigger: [] };
  _collided = { collision: false, trigger: false };

  constructor(element) {
    this._element = element;
    // Created before the element's geometry is set (mirrors the original
    // Element constructor ordering): an "undefined" box until zones are added.
    this._collisionBoundingBox = new BoundingBox(element);
  }

  /** Build the outer bounding box once the element geometry is known. */
  initBoundingBox() {
    this._boundingBox = new BoundingBox(this._element);
  }

  getBoundingBox() {
    return this._boundingBox;
  }

  getCollisionBoundingBox() {
    return this._collisionBoundingBox;
  }

  getCollisionZones(type = 'collision') {
    return this._zones[type];
  }

  createCollisionZone(x = null, y = null, width = null, height = null, type = 'collision') {
    const zone = new BoundingBox(this._element);
    zone.x0(x);
    zone.y0(y);
    zone.width(width);
    zone.height(height);

    this._zones[type].push(zone);
    this._collisionBoundingBox.updateWithBoundingBox(zone);

    const parent = this._element.getParent();
    if (parent) {
      parent.updateCollisionBoundingBox(this._element);
    }

    return zone;
  }

  createTriggerZone(x = null, y = null, width = null, height = null) {
    return this.createCollisionZone(x, y, width, height, 'trigger');
  }

  updateCollisionBoundingBox(element) {
    this._collisionBoundingBox.updateWithRelativeElement(this._element, element);
    const parent = this._element.getParent();
    if (parent) {
      parent.updateCollisionBoundingBox(this._element);
    }
  }

  updateBoudingBox(element) {
    const boundingBox = new BoundingBox();
    boundingBox.x0(element.x());
    boundingBox.y0(element.y());

    boundingBox.x1(element.x() + element.getBoundingBox().width());
    boundingBox.y1(element.y() + element.getBoundingBox().height());

    this._boundingBox.updateWithBoundingBox(boundingBox);
    const parent = this._element.getParent();
    if (parent) {
      parent.updateBoudingBox(this._element);
    }
  }

  collided(value = null, type = 'collision') {
    if (value !== null) {
      if (value !== this._collided[type]) {
        this._collided[type] = value;
        if (value === false) {
          this._zones[type].forEach(zone => {
            zone.collided(false, type);
          });
        }

        const parent = this._element.getParent();
        if (parent) {
          parent.collided(value, type);
        }
        this._element.needUpdate(true);
      }
    }

    return this._collided[type];
  }

  getTrigger(element) {
    return this.getCollision(element, 'trigger');
  }

  /**
   * Detect what this element collides with in `element`'s subtree, then
   * reconcile events/state against the previous frame.
   * @returns {Array|false} the hits, or `false` when there are none.
   */
  getCollision(element, type = 'collision') {
    const collisionHits = [];
    const triggerHits = [];
    this._detect(
      element,
      type === 'collision',
      type === 'trigger',
      collisionHits,
      triggerHits,
    );
    const hits = type === 'collision' ? collisionHits : triggerHits;
    this._reconcile(hits, type);
    return hits.length ? hits : false;
  }

  /**
   * Detect collision AND trigger hits in a SINGLE traversal, then reconcile
   * collision only. Trigger hits are returned raw so the caller can reconcile
   * them at the *final* position (after any collision revert) — preserving the
   * guarantee that a trigger sitting on a wall doesn't fire when the character
   * merely bumps into (but is blocked by) that wall.
   *
   * This is the per-frame fast path: the common case (character not blocked)
   * needs one traversal instead of the two a separate getCollision + getTrigger
   * would cost.
   * @returns {{collision: Array, trigger: Array}}
   */
  detectCollisionAndTrigger(element) {
    const collision = [];
    const trigger = [];
    this._detect(element, true, true, collision, trigger);
    this._reconcile(collision, 'collision');
    return { collision, trigger };
  }

  /** Reconcile trigger hits against the previous frame. @see _reconcile */
  reconcileTrigger(hits) {
    this._reconcile(hits, 'trigger');
  }

  /**
   * Broad + narrow phase over `element`'s subtree: prune any subtree whose
   * aggregate box doesn't overlap, then collect the elements whose collision
   * and/or trigger zones actually intersect (per the `seekCollision` /
   * `seekTrigger` flags). Pure — no events, no state diffing (only the per-zone
   * hit flag used for debug rendering).
   *
   * The early-return is *per type*: once an element's own zones of a type hit,
   * that type stops descending into its children — but the other type keeps
   * going. Running both types in one traversal is therefore equivalent to two
   * separate single-type traversals, minus the duplicated prune/self checks.
   */
  _detect(element, seekCollision, seekTrigger, collisionHits, triggerHits) {
    if (element === this._element) {
      return;
    }
    if (!seekCollision && !seekTrigger) {
      return;
    }
    if (!this._collisionBoundingBox.isCollided(element.getCollisionBoundingBox())) {
      return; // whole subtree pruned
    }

    const collisionHit = seekCollision && this._hitZones(element, 'collision', collisionHits);
    const triggerHit = seekTrigger && this._hitZones(element, 'trigger', triggerHits);

    const childSeekCollision = seekCollision && !collisionHit;
    const childSeekTrigger = seekTrigger && !triggerHit;
    if (childSeekCollision || childSeekTrigger) {
      element.getChildren().forEach(child => this._detect(
        child,
        childSeekCollision,
        childSeekTrigger,
        collisionHits,
        triggerHits,
      ));
    }
  }

  /**
   * Narrow-phase test of one element's zones of `type`: flag each zone's hit
   * state (for debug rendering) and push the element into `hits` on any
   * overlap.
   * @returns {boolean} whether the element hit for this type.
   */
  _hitZones(element, type, hits) {
    let hit = false;
    element.getCollisionZones(type).forEach(zone => {
      const zoneHit = this._collisionBoundingBox.isCollided(zone, type);
      zone.collided(zoneHit, type);
      if (zoneHit) {
        hit = true;
      }
    });
    if (hit) {
      hits.push(element);
    }
    return hit;
  }

  /**
   * Diff the hits against the previous frame: fire start events for newly
   * touching elements, end events for those no longer touching, and only touch
   * the changed elements — no clearing the whole tree every frame.
   */
  _reconcile(hits, type) {
    const previous = this._collidedWith[type];
    const hitSet = new Set(hits);
    const previousSet = new Set(previous);

    hits.forEach(element => {
      if (!previousSet.has(element)) {
        this._element.handle(this._element._eventPrefix + type, {
          element: this._element,
          target: element,
        });
        element.handle(this._element._eventPrefix + type, {
          element: this._element,
          target: element,
        });
        element.collided(true, type);
      }
    });

    previous.forEach(element => {
      if (!hitSet.has(element)) {
        this._element.handle('element.' + type + '.end', {
          element: this._element,
          target: element,
        });
        element.handle('element.' + type + '.end', {
          element: element,
          target: this._element,
        });
        element.collided(false, type);
      }
    });

    this._collidedWith[type] = hits;
    this.collided(hits.length > 0, type);
  }

  /** Drop all current collisions (fires end events for each), via reconcile. */
  clearCollision(type = 'collision') {
    this._reconcile([], type);
  }
}
