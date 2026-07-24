/**
 * A simple back-and-forth patrol for an NPC {@link Character}: it walks along
 * one axis until it either travels `distance` pixels or bumps into something,
 * then turns around. Because the character is collidable, hitting a wall — or
 * the player — makes it reverse instead of pushing through.
 *
 * Sibling to {@link CharacterBehavior} (random wander): a character is driven by
 * whichever behavior you attach, and carries no AI of its own.
 */
export class PatrolBehavior {
  /** @type {import('./Character.js').Character} */
  _character;

  /** @type {'horizontal'|'vertical'} */
  _axis;

  /** pixels to travel before turning back */
  _distance;

  /** pixels moved per tick */
  _speed;

  /** ms between ticks */
  _tickDelay;

  /** pixels travelled on the current leg */
  _traveled = 0;

  /** true while heading right/down, false while heading left/up */
  _forward = true;

  /** ms accumulated toward the next tick */
  _elapsed = 0;

  /**
   * @param {import('./Character.js').Character} character the NPC to patrol
   * @param {object} [options]
   * @param {'horizontal'|'vertical'} [options.axis] axis to patrol along
   * @param {number} [options.distance] pixels to travel before turning back
   * @param {number} [options.speed] pixels moved per tick
   * @param {number} [options.tickDelay] ms between ticks
   */
  constructor(character, { axis = 'horizontal', distance = 200, speed = 4, tickDelay = 60 } = {}) {
    this._character = character;
    this._axis = axis;
    this._distance = distance;
    this._speed = speed;
    this._tickDelay = tickDelay;
  }

  /** Start (or resume) patrolling: register with the viewport's game loop. */
  start() {
    const viewport = this._viewport();
    if (viewport) {
      viewport.addBehavior(this);
    }
  }

  /** Stop patrolling; the character stays where it is. */
  stop() {
    const viewport = this._viewport();
    if (viewport) {
      viewport.removeBehavior(this);
    }
  }

  /**
   * Ticked by the game loop: run the patrol step at the behavior's cadence,
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

  /** One patrol tick: face the current leg, move, and reverse on collision or at the leg's end. */
  _step() {
    const character = this._character;
    const horizontal = this._axis === 'horizontal';

    character.setDirection(
      this._forward
        ? (horizontal ? 'right' : 'down')
        : (horizontal ? 'left' : 'up')
    );

    const delta = this._forward ? this._speed : -this._speed;
    const blocked = character.moveBlocked(
      horizontal ? delta : 0,
      horizontal ? 0 : delta,
      () => this._isBlocked(),
    );

    if (blocked) {
      this._reverse();
    } else {
      this._traveled += this._speed;
      if (this._traveled >= this._distance) {
        this._reverse();
      }
    }

    character.update();
  }

  /**
   * Would the character's current position collide with anything solid? Checks
   * the static board AND the player, which lives outside the board tree — so an
   * NPC turns around at the player instead of walking through it.
   * @returns {boolean}
   */
  _isBlocked() {
    const character = this._character;
    if (character.overlaps(character.getBoard())) {
      return true;
    }
    const player = this._player();
    return player != null && player !== character && character.overlaps(player);
  }

  /**
   * @returns {import('./Character.js').Character|null} the player character, if
   * this NPC is attached to a running viewport
   */
  _player() {
    const viewport = this._viewport();
    return viewport && viewport.getCharacter ? viewport.getCharacter() : null;
  }

  /**
   * @returns {import('./Viewport.js').Viewport|null} the viewport this NPC is
   * attached to, or null if it isn't in a world yet
   */
  _viewport() {
    const app = this._character.getApplication && this._character.getApplication();
    return app && app.getViewport ? app.getViewport() : null;
  }

  /** Flip patrol direction and start a fresh leg. */
  _reverse() {
    this._forward = !this._forward;
    this._traveled = 0;
  }
}
