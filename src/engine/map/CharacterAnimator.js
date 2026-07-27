/**
 * Animation clock for a walking character: advances a frame index through the
 * sprite sheet's walk cycle. Extracted from {@link Character} so the node keeps
 * only world/geometry concerns; the character exposes thin delegating methods.
 *
 * The cadence is driven by traveled distance, not by how often update() is
 * called: the same walked distance yields the same animation state at 60/120/240 Hz.
 */
export class CharacterAnimator {
  /** @type {number} current frame in the walk cycle */
  _index = 0;

  /** @type {number} walked distance accumulated toward the next frame */
  _distance = 0;

  /** @type {number} number of frames in the walk cycle */
  _frameCount;

  /** @type {number} walked pixels required to advance one animation frame */
  _distancePerFrame;

  /**
   * @param {number} [frameCount] number of frames in the walk cycle
   * @param {number} [distancePerFrame] walked pixels between frame changes
   */
  constructor(frameCount = 3, distancePerFrame = 4) {
    this._frameCount = frameCount;
    this._distancePerFrame = Math.max(0.0001, distancePerFrame);
  }

  /**
   * Advance the clock by the distance walked this frame.
   * @param {number} walkedDistance walked pixels since the previous update
   */
  advance(walkedDistance = 0) {
    const delta = Number.isFinite(walkedDistance) ? Math.max(0, walkedDistance) : 0;
    const EPSILON = 1e-9;
    this._distance += delta;
    while (this._distance + EPSILON >= this._distancePerFrame) {
      this._distance = Math.max(0, this._distance - this._distancePerFrame);
      this._index = (this._index + 1) % this._frameCount;
    }
  }

  /** @returns {number} the current walk-cycle frame */
  getIndex() {
    return this._index;
  }

  /** Reset the clock back to the first frame. */
  reset() {
    this._distance = 0;
    this._index = 0;
  }
}
