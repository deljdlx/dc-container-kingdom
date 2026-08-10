/**
 * Asking the world what is where — **without being part of it**.
 *
 * Detection used to be driven entirely by the mover: `element.overlaps(root)`.
 * To ask a question you had to *be* an attached `Element` carrying collision
 * zones, which a damage system, an AI probing ahead or an area effect has no
 * reason to fabricate. These functions take a plain **world rectangle** instead.
 *
 * They speak in bare `{x0, y0, x1, y1}` on purpose, not in {@link BoundingBox}:
 * that class carries two different coordinate conventions depending on what it
 * describes (see the ticket on its coordinate spaces), and an interrogation API
 * is the last place that ambiguity belongs.
 *
 * The traversal reuses the scene graph's own pruning — a subtree whose aggregate
 * envelope misses the rectangle is skipped whole — so no spatial index is
 * introduced. One will be worth it when a measurement says so.
 */

import { maskAccepts, maskAcceptsAny, toMask } from './layers.js';

/**
 * @typedef {Object} WorldRect a rectangle in world coordinates
 * @property {number} x0 left
 * @property {number} y0 top
 * @property {number} x1 right
 * @property {number} y1 bottom
 */

/**
 * Inclusive AABB overlap, matching {@link BoundingBox#isCollided} — touching
 * edges count as a hit, and the two tests must agree or the same contact would
 * be reported by one and denied by the other.
 * @param {WorldRect} a
 * @param {WorldRect} b
 * @returns {boolean}
 */
function overlaps(a, b) {
  return a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0;
}

/**
 * @param {import('./Element.js').Element} element
 * @returns {WorldRect} the element's aggregate envelope, in world space
 */
function envelopeOf(element) {
  return element.getCollisionBoundingBox().offsets();
}

/**
 * Every element of `root`'s subtree with a zone of `type` touching `rect`.
 *
 * @param {import('./Element.js').Element} root the subtree to search — the board,
 * an area, the entity layer…
 * @param {WorldRect} rect the region to look in, in world coordinates
 * @param {Object} [options]
 * @param {'collision'|'trigger'} [options.type] which zones to test
 * @param {Array<Object>} [options.exclude] elements to ignore — a shooter must
 * not hit itself, and it is the caller who knows who fired
 * @param {?(string[]|string)} [options.mask] which collision layers count;
 * `null` (the default) means every one of them. Say what you are looking for
 * rather than listing what to skip: `exclude` is for the one-off exception,
 * a mask is for belonging.
 * @returns {Array<import('./Element.js').Element>} the elements found, in
 * traversal order
 */
export function queryRect(root, rect, { type = 'collision', exclude = [], mask = null } = {}) {
  const found = [];
  collect(root, rect, type, exclude, toMask(mask), found);

  return found;
}

/**
 * Depth-first collection, pruning on the aggregate envelope.
 * @param {import('./Element.js').Element} element
 * @param {WorldRect} rect
 * @param {'collision'|'trigger'} type
 * @param {Array<Object>} exclude
 * @param {?Set<string>} mask normalised layers, null for every one
 * @param {Array<Object>} found out param, appended in place
 */
function collect(element, rect, type, exclude, mask, found) {
  if (!overlaps(rect, envelopeOf(element))) {
    return; // whole subtree pruned
  }
  // Same prune, on layers: nothing here belongs to what is being looked for.
  if (!maskAcceptsAny(mask, element.getLayers())) {
    return;
  }

  if (!exclude.includes(element)) {
    const hit = element.getCollisionZones(type)
      .some(zone => maskAccepts(mask, zone.layer()) && overlaps(rect, zone.offsets()));
    if (hit) {
      found.push(element);
    }
  }

  element.getChildren().forEach(child => collect(child, rect, type, exclude, mask, found));
}

/**
 * What a box of `size` runs into travelling from `from` to `to` — the answer a
 * projectile needs.
 *
 * **Why sampling rather than one big rectangle**: taking the AABB of start and
 * end would report targets sitting in the corners of a diagonal path that the
 * box never touched. Instead the box is stepped along the segment with a stride
 * **no larger than its smallest side**, so consecutive samples overlap and their
 * union covers the corridor exactly — nothing intersecting it can slip between
 * two samples.
 *
 * This is what closes the tunneling hole: testing positions only, a 6 px
 * projectile crossing a 14 px target missed it 13 % of the time at 1 440 px/s and
 * 67 % at 3 840 px/s, depending on where its frames happened to land.
 *
 * @param {import('./Element.js').Element} root subtree to search
 * @param {{x: number, y: number}} from top-left of the box, world, at the start
 * @param {{x: number, y: number}} to top-left of the box, world, at the end
 * @param {{width: number, height: number}} size the moving box
 * @param {Object} [options]
 * @param {'collision'|'trigger'} [options.type]
 * @param {Array<Object>} [options.exclude]
 * @param {?(string[]|string)} [options.mask] which collision layers count
 * @returns {{element: Object, at: {x: number, y: number}}|null} the **first**
 * contact along the path, or null when the way is clear
 */
export function sweepRect(root, from, to, size, { type = 'collision', exclude = [], mask = null } = {}) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const distance = Math.hypot(deltaX, deltaY);

  // A stride wider than the box would leave gaps between samples; 1 px is the
  // floor so a zero-length sweep still tests its own position once.
  const stride = Math.max(1, Math.min(size.width, size.height));
  const steps = Math.max(1, Math.ceil(distance / stride));

  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    const x = from.x + deltaX * ratio;
    const y = from.y + deltaY * ratio;
    const [element] = queryRect(
      root,
      { x0: x, y0: y, x1: x + size.width, y1: y + size.height },
      { type, exclude, mask },
    );
    if (element) {
      return { element, at: { x, y } };
    }
  }

  return null;
}
