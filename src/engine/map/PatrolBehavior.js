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

  _traveled = 0;
  _forward = true;
  _running = false;

  constructor(character, { axis = 'horizontal', distance = 200, speed = 4, tickDelay = 60 } = {}) {
    this._character = character;
    this._axis = axis;
    this._distance = distance;
    this._speed = speed;
    this._tickDelay = tickDelay;
  }

  /** Start (or resume) patrolling. */
  start() {
    if (this._running) {
      return;
    }
    this._running = true;
    this._loop();
  }

  /** Stop patrolling; the character stays where it is. */
  stop() {
    this._running = false;
  }

  _loop() {
    if (!this._running) {
      return;
    }
    this._step();
    setTimeout(() => this._loop(), this._tickDelay);
  }

  _step() {
    const character = this._character;
    const horizontal = this._axis === 'horizontal';

    character.setDirection(
      this._forward
        ? (horizontal ? 'right' : 'down')
        : (horizontal ? 'left' : 'up')
    );

    const saved = character.geometry.clone();
    const delta = this._forward ? this._speed : -this._speed;
    if (horizontal) {
      character.x(character.x() + delta);
    } else {
      character.y(character.y() + delta);
    }

    if (this._isBlocked()) {
      character.geometry = saved; // blocked → undo the step and turn around
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
   */
  _isBlocked() {
    const character = this._character;
    if (character.overlaps(character.getBoard())) {
      return true;
    }
    const player = this._player();
    return player != null && player !== character && character.overlaps(player);
  }

  /** The player character, if this NPC is attached to a running viewport. */
  _player() {
    const application = character => character.getApplication && character.getApplication();
    const app = application(this._character);
    const viewport = app && app.getViewport && app.getViewport();
    return viewport && viewport.getCharacter ? viewport.getCharacter() : null;
  }

  _reverse() {
    this._forward = !this._forward;
    this._traveled = 0;
  }
}
