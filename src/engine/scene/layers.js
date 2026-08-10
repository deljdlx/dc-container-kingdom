/**
 * Collision layers: what a zone **is**, and what a zone can **touch**.
 *
 * Names rather than bits, deliberately. A bitmask would be faster and
 * unreadable; the number of layers a game needs fits on one hand, and being
 * able to read `'enemy'` in a debugger is worth more than nanoseconds no
 * measurement has asked for. The representation can change behind this API the
 * day one does.
 */

/** Layer a zone belongs to when its author did not say. */
export const DEFAULT_LAYER = 'default';

/**
 * Normalise a mask into the form the hot path expects.
 *
 * `null` means **everything**, and it is the default: every host written before
 * layers existed keeps behaving to the letter, and pays nothing for the feature
 * — the test below is one comparison against `null`.
 * @param {?(string[]|Set<string>|string)} mask
 * @returns {?Set<string>} null for «everything»
 */
export function toMask(mask) {
  if (mask === null || mask === undefined) {
    return null;
  }

  return typeof mask === 'string' ? new Set([mask]) : new Set(mask);
}

/**
 * Does a mask accept a single layer?
 * @param {?Set<string>} mask normalised by {@link toMask}
 * @param {string} layer
 * @returns {boolean}
 */
export function maskAccepts(mask, layer) {
  return mask === null || mask.has(layer);
}

/**
 * Does a mask accept **any** of a subtree's layers? This is the broad-phase
 * question: a subtree holding nothing the detector can touch is skipped whole,
 * without descending into it.
 * @param {?Set<string>} mask normalised by {@link toMask}
 * @param {Set<string>} layers union of the layers found under a node
 * @returns {boolean}
 */
export function maskAcceptsAny(mask, layers) {
  if (mask === null) {
    return true;
  }

  for (const layer of layers) {
    if (mask.has(layer)) {
      return true;
    }
  }

  return false;
}
