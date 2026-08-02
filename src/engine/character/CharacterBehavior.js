/**
 * Autonomous "brain" for an NPC {@link Character}: makes it wander the board on
 * its own, picking a new random direction every so often and turning away when
 * it bumps into something. Extracted from Character so the node itself carries
 * no AI — a controllable player character simply never gets a behavior.
 *
 * Driven by the viewport's game loop (via {@link update}) rather than its own
 * timer, so it shares the single rAF clock — and the frame's `dt` — with the
 * player and every other behavior.
 */
export class CharacterBehavior {
  /** @type {import('./Character.js').Character} */
  _character;

  /** whether the character is currently wandering */
  _alive = false;

  /** ms between direction re-decisions */
  _actionDuration = 5000;

  /** probability gate (0..1): a re-decision only happens when random() exceeds this */
  _newActionThreshold = 0.5;

  /** pixels moved per tick */
  _pixelsPerTick = 6;

  /** ms between ticks */
  _tickDelay = 100;

  /** ms accumulated toward the next tick */
  _elapsed = 0;

  /** ms accumulated since the last direction decision */
  _sinceAction = 0;

  /** @param {import('./Character.js').Character} character the NPC this brain drives */
  constructor(character) {
    this._character = character;
  }

  /**
   * Bring the character to life: it wanders and re-decides its direction every
   * `actionDuration` ms. Registers with the viewport's game loop.
   * @param {number} actionDuration
   */
  live(actionDuration) {
    this._actionDuration = actionDuration;
    this._alive = true;
    this._sinceAction = 0;
    const viewport = this._viewport();
    if (viewport) {
      viewport.addBehavior(this);
    }
  }

  /** Stop wandering; the character stays where it is. */
  stop() {
    this._alive = false;
    const viewport = this._viewport();
    if (viewport) {
      viewport.removeBehavior(this);
    }
  }

  /**
   * Ticked by the game loop at the behavior's cadence, catching up if several
   * `tickDelay` windows elapsed in one (slow) frame.
   * @param {number} dt milliseconds since the last frame
   */
  update(dt) {
    this._elapsed += dt;
    while (this._elapsed >= this._tickDelay) {
      this._elapsed -= this._tickDelay;
      this._sinceAction += this._tickDelay;
      this._step();
    }
  }

  /** One wander tick: ensure a direction, occasionally re-decide, move, and turn away on collision. */
  _step() {
    const character = this._character;

    if (this._alive && !character.getDirection()) {
      character.setDirection(this._randomDirection());
    }

    if (
      this._sinceAction >= this._actionDuration
      && Math.random() > this._newActionThreshold
    ) {
      this._sinceAction = 0;
      character.setDirection(this._randomDirection());
    }

    const [dx, dy] = this._delta(character.getDirection());
    const blocked = character.moveBlocked(
      dx,
      dy,
      () => character.getCollision(character.getBoard()).length > 0,
    );
    if (blocked) {
      character.setDirection(this._randomDirection());
    }

    character.update(blocked ? 0 : Math.max(Math.abs(dx), Math.abs(dy)));
  }

  /**
   * @param {string} direction
   * @returns {[number, number]} the (dx, dy) step for a direction
   */
  _delta(direction) {
    switch (direction) {
      case 'up': return [0, -this._pixelsPerTick];
      case 'down': return [0, this._pixelsPerTick];
      case 'left': return [-this._pixelsPerTick, 0];
      case 'right': return [this._pixelsPerTick, 0];
      default: return [0, 0];
    }
  }

  /** @returns {string} a uniformly random cardinal direction */
  _randomDirection() {
    const directions = ['up', 'down', 'left', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
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
