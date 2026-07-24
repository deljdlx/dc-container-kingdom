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
    const hits = [];
    this._detect(element, type, hits);
    this._reconcile(hits, type);
    return hits.length ? hits : false;
  }

  /**
   * Broad + narrow phase: prune any subtree whose aggregate box doesn't
   * overlap, then collect elements whose collision zones actually intersect.
   * Pure — no events, no state diffing (only the per-zone hit flag used for
   * debug rendering).
   */
  _detect(element, type, hits) {
    if (element === this._element) {
      return;
    }
    if (!this._collisionBoundingBox.isCollided(element.getCollisionBoundingBox())) {
      return; // whole subtree pruned
    }

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
      return;
    }

    element.getChildren().forEach(child => this._detect(child, type, hits));
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
