/**
 * The catalogue of events the **engine** emits, declared in one place.
 *
 * Names used to be assembled by concatenation at the call site, and the two
 * halves had already drifted apart: a collision *start* was built from a
 * per-element prefix while its matching *end* hard-coded `'element.'`. Declaring
 * them kills that class of bug, makes the surface **discoverable** (a host can
 * list what the engine emits) and gives an observer its categories for free.
 *
 * The values are the strings the engine has always emitted — this catalogue
 * *declares* the API, it does not change it.
 *
 * ## What belongs on the bus
 *
 * **Facts of the game**: an entity was born, was hit, died. **Not simulation
 * steps** — a per-pixel move, a per-frame detection. An event allocated once per
 * frame per entity is expensive and drowns every observer; those stay direct
 * calls. {@link EngineEvents.MAP_UPDATE} predates the rule and sits on the wrong
 * side of it — it fires on every frame the player moves.
 *
 * An application's own events (Container Kingdom's, a game's) do **not** belong
 * here: this is the engine's surface, and the engine ignores its hosts.
 */
export const EngineEvents = Object.freeze({
  /** Fired on an element whose DOM node was clicked. @see ElementEvent */
  ELEMENT_CLICK: 'element.click',

  /** A solid overlap started, fired on **both** elements. @see CollisionEvent */
  ELEMENT_COLLISION: 'element.collision',
  /** A solid overlap ended, fired on both elements. @see CollisionEvent */
  ELEMENT_COLLISION_END: 'element.collision.end',
  /** A trigger zone was entered, fired on both elements. @see CollisionEvent */
  ELEMENT_TRIGGER: 'element.trigger',
  /** A trigger zone was left, fired on both elements. @see CollisionEvent */
  ELEMENT_TRIGGER_END: 'element.trigger.end',

  /**
   * An element is about to leave the world — fired by `Element.destroy()`
   * **before** it detaches, so a listener can still read its parent, its
   * position and its subtree. @see ElementEvent
   */
  ELEMENT_DESTROY: 'element.destroy',

  /** A character showed a speech bubble. @see ReactionEvent */
  ELEMENT_REACTION_SHOW: 'element.reaction.show',
  /** A character's speech bubble was dismissed. @see ElementEvent */
  ELEMENT_REACTION_HIDE: 'element.reaction.hide',

  /** An area's ground was clicked. @see AreaEvent */
  AREA_CLICK: 'area.click',

  /**
   * The player moved. Fired **every frame they walk** — a simulation step, kept
   * for the hosts that depend on it, not a model to copy.
   */
  MAP_UPDATE: 'map.update',
});

/**
 * Start/end event names per collision type — a lookup, so no name is ever built
 * by concatenation.
 * @type {Object<'collision'|'trigger', {start: string, end: string}>}
 */
const COLLISION_EVENTS = Object.freeze({
  collision: Object.freeze({
    start: EngineEvents.ELEMENT_COLLISION,
    end: EngineEvents.ELEMENT_COLLISION_END,
  }),
  trigger: Object.freeze({
    start: EngineEvents.ELEMENT_TRIGGER,
    end: EngineEvents.ELEMENT_TRIGGER_END,
  }),
});

/**
 * @param {'collision'|'trigger'} type
 * @param {'start'|'end'} phase
 * @returns {string} the declared event name for that pair
 * @throws {Error} on an unknown type — a typo must fail loudly, not emit into
 * the void under a name nobody listens to
 */
export function collisionEventName(type, phase) {
  const pair = COLLISION_EVENTS[type];
  if (!pair) {
    throw new Error(`Unknown collision event type: ${type}`);
  }
  return pair[phase];
}

/** @returns {string[]} every event name the engine can emit */
export function engineEventNames() {
  return Object.values(EngineEvents);
}

/**
 * Monotonic when the host provides it: an observer orders and coalesces events,
 * and a wall clock can step backwards.
 * @returns {number} milliseconds since an arbitrary origin
 */
function now() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/**
 * The envelope every engine event carries, over its own payload.
 *
 * The common trunk (`type`, `source`, `at`) is what makes a **generic** observer
 * possible — a console that renders any event without a branch per name.
 *
 * Bubbling must not re-stamp: an event already carrying this trunk for the same
 * name is passed through untouched, so `at` keeps dating the **origin** and
 * `source` keeps naming the emitter rather than the last relay.
 * @param {string} type the event name, from {@link EngineEvents}
 * @param {Object} source what emitted it (an element, the viewport, the application)
 * @param {Object} [data] the event's own payload
 * @returns {Object} the payload, stamped
 */
export function makeEvent(type, source, data = {}) {
  if (data.type === type && typeof data.at === 'number') {
    return data;
  }

  return { ...data, type, source: data.source ?? source, at: now() };
}

/**
 * @typedef {Object} EngineEvent the trunk carried by every engine event
 * @property {string} type the event name, from {@link EngineEvents}
 * @property {Object} source what emitted it
 * @property {number} at milliseconds, monotonic where the host allows it
 */

/**
 * @typedef {EngineEvent & {element: Object}} ElementEvent
 * @property {Object} element the element concerned
 */

/**
 * @typedef {EngineEvent & {element: Object, target: Object}} CollisionEvent
 * @property {Object} element one side of the contact
 * @property {Object} target the other side
 *
 * ⚠️ Legacy quirk, kept for compatibility: on a *start* both sides receive the
 * **detector** as `element`, while on an *end* each side receives itself. Prefer
 * `source` — it always names the element the event was delivered on.
 */

/**
 * @typedef {EngineEvent & {character: Object, content: string}} ReactionEvent
 * @property {Object} character the speaking character
 * @property {string} content the bubble's text
 */

/**
 * @typedef {EngineEvent & {area: Object, areaX: number, areaY: number}} AreaEvent
 * @property {Object} area the area concerned
 * @property {number} areaX click offset within the area, in pixels
 * @property {number} areaY click offset within the area, in pixels
 */
