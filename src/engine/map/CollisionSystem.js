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

  /** @type {{collision: BoundingBox[], trigger: BoundingBox[]}} the element's own zones per type */
  _zones = { collision: [], trigger: [] };

  /** @type {{collision: import('./Element.js').Element[], trigger: import('./Element.js').Element[]}} last frame's hits per type */
  _collidedWith = { collision: [], trigger: [] };

  /** @type {{collision: boolean, trigger: boolean}} whether currently hitting anything per type */
  _collided = { collision: false, trigger: false };

  /**
   * @param {import('./Element.js').Element} element the owning node
   */
  constructor(element) {
    this._element = element;
    // Starts genuinely empty: the collision envelope bounds the collision and
    // trigger zones (own and inherited from children), never the element's own
    // rectangle — the narrow phase only ever tests zones. Seeding it from the
    // element used to leave a half-defined box (the geometry is not set yet, so
    // `x0` was null while `x1` took the default width), which inflated every
    // ancestor's envelope with phantom edges.
    this._collisionBoundingBox = new BoundingBox(element, false);
  }

  /** Build the outer bounding box once the element geometry is known. */
  initBoundingBox() {
    this._boundingBox = new BoundingBox(this._element);
  }

  /**
   * @returns {BoundingBox} the outer (rendering) bounding box
   */
  getBoundingBox() {
    return this._boundingBox;
  }

  /**
   * @returns {BoundingBox} the aggregate collision bounding box (broad phase)
   */
  getCollisionBoundingBox() {
    return this._collisionBoundingBox;
  }

  /**
   * @param {'collision'|'trigger'} type
   * @returns {BoundingBox[]} this element's own zones of that type
   */
  getCollisionZones(type = 'collision') {
    return this._zones[type];
  }

  /**
   * Add a zone of `type`, grow the aggregate box, and propagate up the tree.
   * @param {?number} x
   * @param {?number} y
   * @param {?number} width
   * @param {?number} height
   * @param {'collision'|'trigger'} type
   * @returns {BoundingBox} the created zone
   */
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

  /**
   * Convenience wrapper: add a zone of type `trigger`.
   * @param {?number} x
   * @param {?number} y
   * @param {?number} width
   * @param {?number} height
   * @returns {BoundingBox} the created zone
   */
  createTriggerZone(x = null, y = null, width = null, height = null) {
    return this.createCollisionZone(x, y, width, height, 'trigger');
  }

  /**
   * Grow the aggregate collision box to enclose a child, then propagate up.
   * @param {import('./Element.js').Element} element the child that changed
   */
  updateCollisionBoundingBox(element) {
    this._collisionBoundingBox.updateWithRelativeElement(element);
    const parent = this._element.getParent();
    if (parent) {
      parent.updateCollisionBoundingBox(this._element);
    }
  }

  /**
   * Grow the outer bounding box to enclose a child, then propagate up.
   * @param {import('./Element.js').Element} element the child that changed
   */
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

  /**
   * Rebuild both aggregate boxes from the element's current zones and children.
   * Used when a child is detached, because incremental updates only ever grow.
   *
   * The two boxes seed differently, on purpose — mirroring the incremental path:
   * the collision box starts **empty**, so it bounds the collision/trigger zones
   * and nothing else (the narrow phase only ever tests zones, so widening the
   * envelope to the element's rectangle would weaken pruning for no gain); the
   * rendering box starts from the element's own rectangle, which it is meant to
   * cover.
   */
  recomputeAggregates() {
    const collisionBoundingBox = new BoundingBox(this._element, false);
    this._zones.collision.forEach((zone) => {
      collisionBoundingBox.updateWithBoundingBox(zone);
    });
    this._zones.trigger.forEach((zone) => {
      collisionBoundingBox.updateWithBoundingBox(zone);
    });

    this._element.getChildren().forEach((child) => {
      collisionBoundingBox.updateWithRelativeElement(child);
    });
    this._collisionBoundingBox = collisionBoundingBox;

    const boundingBox = new BoundingBox(this._element);
    this._element.getChildren().forEach((child) => {
      const childBoundingBox = new BoundingBox();
      childBoundingBox.x0(child.x());
      childBoundingBox.y0(child.y());
      childBoundingBox.x1(child.x() + child.getBoundingBox().width());
      childBoundingBox.y1(child.y() + child.getBoundingBox().height());
      boundingBox.updateWithBoundingBox(childBoundingBox);
    });
    this._boundingBox = boundingBox;
  }

  /**
   * Get or set the collided flag for `type`; on change, reset zones when
   * clearing, propagate up the tree, and request a redraw.
   * @param {?boolean} value
   * @param {'collision'|'trigger'} type
   * @returns {boolean}
   */
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

  /**
   * Convenience wrapper: {@link getCollision} for type `trigger`.
   * @param {import('./Element.js').Element} element subtree root to test against
   * @returns {Array|false}
   */
  getTrigger(element) {
    return this.getCollision(element, 'trigger');
  }

  /**
   * Detect what this element collides with in `element`'s subtree, then
   * reconcile events/state against the previous frame.
   * @param {import('./Element.js').Element} element subtree root to test against
   * @param {'collision'|'trigger'} type
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
   * @param {import('./Element.js').Element} element subtree root to test against
   * @returns {{collision: Array, trigger: Array}}
   */
  detectCollisionAndTrigger(element) {
    const collision = [];
    const trigger = [];
    this._detect(element, true, true, collision, trigger);
    this._reconcile(collision, 'collision');
    return { collision, trigger };
  }

  /**
   * Reconcile trigger hits against the previous frame.
   * @param {import('./Element.js').Element[]} hits
   * @see _reconcile
   */
  reconcileTrigger(hits) {
    this._reconcile(hits, 'trigger');
  }

  /**
   * Pure overlap test against `element`'s subtree: does this element's collision
   * (or trigger) zones intersect anything there? Fires no events and touches no
   * state — meant for AI probing a would-be move, unlike {@link getCollision}.
   * @param {import('./Element.js').Element} element subtree root to test against
   * @param {'collision'|'trigger'} type
   * @returns {boolean}
   */
  overlaps(element, type = 'collision') {
    const collisionHits = [];
    const triggerHits = [];
    this._detect(
      element,
      type === 'collision',
      type === 'trigger',
      collisionHits,
      triggerHits,
    );
    return (type === 'collision' ? collisionHits : triggerHits).length > 0;
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
   * @param {import('./Element.js').Element} element subtree root to test against
   * @param {boolean} seekCollision whether to collect collision hits
   * @param {boolean} seekTrigger whether to collect trigger hits
   * @param {import('./Element.js').Element[]} collisionHits out param, appended in place
   * @param {import('./Element.js').Element[]} triggerHits out param, appended in place
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
   * @param {import('./Element.js').Element} element the element being tested
   * @param {'collision'|'trigger'} type which of the target's zones to test
   * @param {import('./Element.js').Element[]} hits out param, appended in place
   * @returns {boolean} whether the element hit for this type.
   */
  _hitZones(element, type, hits) {
    // Narrow phase: test the DETECTOR's own collision zones (its body) against
    // the target's zone — NOT the aggregate box. The aggregate also covers the
    // detector's trigger zones, so a character with a large trigger radius would
    // otherwise "collide" with everything within that radius. The aggregate
    // stays for broad-phase pruning only.
    const body = this._element.getCollisionZones('collision');
    let hit = false;
    element.getCollisionZones(type).forEach(zone => {
      const zoneHit = body.some(bodyZone => bodyZone.isCollided(zone));
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
   * @param {import('./Element.js').Element[]} hits elements touching this frame
   * @param {'collision'|'trigger'} type
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

  /**
   * Drop all current collisions (fires end events for each), via reconcile.
   * @param {'collision'|'trigger'} type
   */
  clearCollision(type = 'collision') {
    this._reconcile([], type);
  }
}
