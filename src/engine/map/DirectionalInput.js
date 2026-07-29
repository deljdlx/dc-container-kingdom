/**
 * The set of directions currently held down, kept **in press order**.
 *
 * Knows nothing about keys, the DOM or the game loop: a host maps its own input
 * source (keyboard, touch D-pad, gamepad) onto {@link press}/{@link release},
 * then reads a movement vector and a facing direction from it. That is what
 * makes it testable without a DOM and reusable for another input source.
 *
 * The order matters: holding Right then pressing Up faces the character up, and
 * releasing Up must send it back to facing right — a `Set` could not say which
 * of the remaining directions came last.
 */
export class DirectionalInput
{

  /** @type {Object<string, {x: number, y: number}>} the four unit directions */
  static VECTORS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  /** @type {string[]} held directions, oldest press first */
  _held = [];

  /**
   * Mark a direction as held. Re-pressing one already held moves it back to the
   * most recent position, so it becomes the facing direction again.
   * @param {string} direction one of 'up' | 'down' | 'left' | 'right'
   * @returns {boolean} whether it was a direction at all (anything else is ignored)
   */
  press(direction) {
    if (!DirectionalInput.VECTORS[direction]) {
      return false;
    }
    this.release(direction);
    this._held.push(direction);
    return true;
  }

  /**
   * Mark a direction as released. Releasing something that is not held — or not
   * a direction — is a no-op, which is what makes a stray keyup harmless.
   * @param {string} direction
   * @returns {boolean} whether that direction was actually held
   */
  release(direction) {
    const index = this._held.indexOf(direction);
    if (index === -1) {
      return false;
    }
    this._held.splice(index, 1);
    return true;
  }

  /** Release everything (blur, explicit stop…). */
  releaseAll() {
    this._held = [];
  }

  /**
   * @returns {boolean} whether the held directions add up to an actual move.
   * Holding two opposite directions cancels out: something is pressed, yet
   * nothing moves.
   */
  isMoving() {
    const vector = this.getVector();
    return vector.x !== 0 || vector.y !== 0;
  }

  /**
   * The resulting direction of travel, as a **unit** vector: a diagonal is
   * (±0.7071, ±0.7071), not (±1, ±1), so walking sideways is not ~1.41× faster.
   * @returns {{x: number, y: number}} zero when nothing is held or when opposite
   * directions cancel out
   */
  getVector() {
    let x = 0;
    let y = 0;
    this._held.forEach(direction => {
      const vector = DirectionalInput.VECTORS[direction];
      x += vector.x;
      y += vector.y;
    });

    const length = Math.hypot(x, y);
    if (length === 0) {
      return { x: 0, y: 0 };
    }
    return { x: x / length, y: y / length };
  }

  /**
   * The direction the sprite should face: the **last one pressed that is still
   * held**. On a diagonal it picks the newest input, and releasing that one
   * falls back to the previous — no special case needed.
   * @returns {string|null} null when nothing is held
   */
  getFacing() {
    return this._held.length > 0 ? this._held[this._held.length - 1] : null;
  }
}
