/**
 * Blueprints: the **shared** half of what an entity is.
 *
 * An entity carries two kinds of data, and confusing them is the classic bug of
 * this domain:
 *
 * - the **blueprint** — what a *goblin* is: 12 hit points, 3 damage. One object
 *   for the whole class, read by two hundred instances, never written to;
 * - the **state** — what *this* goblin is: 7 hit points left. One object per
 *   instance, written to constantly (`element.data`).
 *
 * Without the split, a goblin taking a hit writes into the shared definition and
 * the other 199 lose their maximum hit points too. It only shows up in play, and
 * late. Hence: the blueprint is **frozen**, and writes only ever reach the state.
 *
 * The engine defines **no key**. It resolves, merges and freezes; the game says
 * what `hp` means. The engine must keep running with an empty blueprint.
 */

/** @type {WeakMap<Function, Object>} resolved blueprint per class */
const RESOLVED = new WeakMap();

/**
 * The blueprint of a class, merged along its prototype chain and deep-frozen.
 *
 * **Merging is deliberate, and diverges from `SpriteElement.descriptor`, which
 * does not merge.** The two look alike and mean different things: a descriptor
 * describes *one sprite*, so inheriting a parent's `frame` would be nonsense — a
 * derived sprite is a different sprite. A blueprint describes *traits*, and
 * merging is exactly what subclassing means: an orc is a goblin with more hit
 * points, not a goblin whose every trait must be retyped.
 *
 * Resolved once per class and cached: the walk and the freeze are paid at the
 * first instance, never per instance.
 * @param {Function} constructor the entity's class
 * @returns {Object} the frozen, merged blueprint — `{}` when the class declares none
 */
export function resolveBlueprint(constructor) {
  if (!constructor) {
    return EMPTY;
  }
  const cached = RESOLVED.get(constructor);
  if (cached) {
    return cached;
  }

  // Walk up first, then merge downwards: the most derived class must win.
  const chain = [];
  for (let current = constructor; current; current = Object.getPrototypeOf(current)) {
    if (Object.prototype.hasOwnProperty.call(current, 'blueprint')) {
      chain.unshift(current.blueprint);
    }
  }

  const resolved = deepFreeze(Object.assign({}, ...chain));
  RESOLVED.set(constructor, resolved);

  return resolved;
}

/** Shared empty blueprint, so a class without one costs nothing and stays frozen. */
const EMPTY = Object.freeze({});

/**
 * Freeze an object and everything it holds.
 *
 * Shallow freezing would leave `blueprint.loot.gold = 0` reachable from any
 * instance — the very bug this file exists to prevent, one level down.
 * @param {Object} value
 * @param {WeakSet} [seen] guards against a blueprint that refers to itself
 * @returns {Object} the same object, frozen
 */
function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return value;
  }
  seen.add(value);

  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze(value[key], seen);
  }

  return Object.freeze(value);
}
