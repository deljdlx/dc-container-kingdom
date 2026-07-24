/**
 * Animation clock for a walking character: advances a frame index through the
 * sprite sheet's walk cycle. Extracted from {@link Character} so the node keeps
 * only world/geometry concerns; the character exposes thin delegating methods.
 *
 * The frame only advances every `tickInterval` ticks, so faster characters
 * (larger move speed → smaller interval) animate faster.
 */
export class CharacterAnimator {
  /** @type {number} current frame in the walk cycle */
  _index = 0;

  /** @type {number} ticks elapsed since the last frame change */
  _tick = 0;

  /** @type {number} number of frames in the walk cycle */
  _frameCount;

  /** @param {number} [frameCount] number of frames in the walk cycle */
  constructor(frameCount = 3) {
    this._frameCount = frameCount;
  }

  /**
   * Advance the clock by one tick, cycling to the next frame every
   * `tickInterval` ticks.
   * @param {number} tickInterval ticks between frame changes (min 1)
   */
  advance(tickInterval) {
    const interval = Math.max(1, tickInterval);
    this._tick = (this._tick + 1) % interval;
    if (this._tick === 0) {
      this._index = (this._index + 1) % this._frameCount;
    }
  }

  /** @returns {number} the current walk-cycle frame */
  getIndex() {
    return this._index;
  }

  /** Reset the clock back to the first frame. */
  reset() {
    this._tick = 0;
    this._index = 0;
  }
}
