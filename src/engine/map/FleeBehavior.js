/**
 * A shy NPC {@link Character} that flees whatever enters its detection radius —
 * typically the player. The radius is a **trigger zone** around the character:
 * when something walks into it, the engine fires `element.trigger` on the
 * character, which is what wakes the flee up. So the behaviour is genuinely
 * trigger-driven — remove the trigger and it never reacts.
 *
 * Sibling to {@link PatrolBehavior} / {@link CharacterBehavior}: driven by the
 * viewport's game loop via {@link update}, and moving through the shared
 * {@link Character#moveBlocked} primitive.
 *
 * Note: trigger detection is driven by the *threat's* movement (it is the mover
 * running the trigger pass), so `element.trigger.end` may not fire if the threat
 * stops still inside the radius. A distance backstop in {@link _step} clears the
 * threat once it is comfortably out of range, so the NPC never flees forever.
 */
export class FleeBehavior {
  /** @type {import('./Character.js').Character} */
  _character;

  /** detection radius (px) around the character */
  _radius;

  /** pixels moved per tick */
  _speed;

  /** ms between ticks */
  _tickDelay;

  /** ms accumulated toward the next tick */
  _elapsed = 0;

  /** the element to flee from while it is in range, or null */
  _threat = null;

  /** whether {@link start} has already wired the trigger zone (guards against re-arming) */
  _started = false;

  /**
   * @param {import('./Character.js').Character} character the shy NPC to drive
   * @param {object} [options]
   * @param {number} [options.radius] detection radius (px) around the character
   * @param {number} [options.speed] pixels moved per tick
   * @param {number} [options.tickDelay] ms between ticks
   */
  constructor(character, { radius = 120, speed = 4, tickDelay = 60 } = {}) {
    this._character = character;
    this._radius = radius;
    this._speed = speed;
    this._tickDelay = tickDelay;
  }

  /**
   * Give the character its detection trigger zone, wire the trigger events, and
   * register with the viewport's game loop.
   */
  start() {
    if (this._started) {
      return;
    }
    this._started = true;

    const character = this._character;
    // A trigger square extending `radius` beyond the character on every side.
    character.createTriggerZone(
      -this._radius,
      -this._radius,
      character.width() + this._radius * 2,
      character.height() + this._radius * 2,
    );
    character.addEventListener('element.trigger', event => {
      this._threat = event.element; // the intruder (the mover that entered)
    });
    character.addEventListener('element.trigger.end', () => {
      this._threat = null;
    });

    const viewport = this._viewport();
    if (viewport) {
      viewport.addBehavior(this);
    }
  }

  /** Stop fleeing and unregister. */
  stop() {
    const viewport = this._viewport();
    if (viewport) {
      viewport.removeBehavior(this);
    }
  }

  /**
   * Ticked by the game loop: run the flee step at the behavior's cadence,
   * catching up if several `tickDelay` windows elapsed in one (slow) frame.
   * @param {number} dt milliseconds since the last frame
   */
  update(dt) {
    this._elapsed += dt;
    while (this._elapsed >= this._tickDelay) {
      this._elapsed -= this._tickDelay;
      this._step();
    }
  }

  /** One flee tick: drop an out-of-range threat, else step away from it along the dominant axis. */
  _step() {
    if (!this._threat) {
      return; // nobody in range → stand still
    }

    const character = this._character;
    const dx = character.offsetX() - this._threat.offsetX();
    const dy = character.offsetY() - this._threat.offsetY();

    // Backstop: forget a threat that is well out of range (its trigger.end may
    // never fire if it stopped moving), so the NPC doesn't flee forever.
    if (Math.hypot(dx, dy) > this._radius * 1.4) {
      this._threat = null;
      return;
    }

    // Flee along the dominant axis, away from the threat.
    let stepX = 0;
    let stepY = 0;
    if (Math.abs(dx) >= Math.abs(dy)) {
      stepX = (dx >= 0 ? 1 : -1) * this._speed;
      character.setDirection(stepX >= 0 ? 'right' : 'left');
    } else {
      stepY = (dy >= 0 ? 1 : -1) * this._speed;
      character.setDirection(stepY >= 0 ? 'down' : 'up');
    }

    character.moveBlocked(stepX, stepY, () => this._isBlocked());
    character.update();
  }

  /**
   * Blocked by the static world, another NPC, or the threat itself.
   * @returns {boolean}
   */
  _isBlocked() {
    const character = this._character;
    if (character.overlaps(character.getBoard())) {
      return true;
    }
    return this._threat != null && character.overlaps(this._threat);
  }

  /**
   * @returns {import('./Viewport.js').Viewport|null} the viewport this NPC is
   * attached to, or null if it isn't in a world yet
   */
  _viewport() {
    const app = this._character.getApplication && this._character.getApplication();
    return app && app.getViewport ? app.getViewport() : null;
  }
}
