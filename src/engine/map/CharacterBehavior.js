/**
 * Autonomous "brain" for an NPC {@link Character}: makes it wander the board on
 * its own, picking a new random direction every so often and turning away when
 * it bumps into something. Extracted from Character so the node itself carries
 * no AI — a controllable player character simply never gets a behavior.
 *
 * NOTE: the loop drives movement + collision itself (mirroring the original
 * Character.loop), duplicating Viewport.moveCharacter. Unifying the two onto the
 * game loop is a separate, deliberate step; this extraction preserves the
 * original behaviour verbatim, including the self-rescheduling timer.
 */
export class CharacterBehavior {
  /** @type {import('./Character.js').Character} */
  _character;

  _alive = false;
  _lastActionTime = null;
  _actionDuration = 5000;
  _newActionThreshold = 0.5;

  /** pixels moved per behavior tick */
  _pixelsPerTick = 6;

  /** ms between behavior ticks */
  _tickDelay = 100;

  constructor(character) {
    this._character = character;
  }

  /**
   * Bring the character to life: it starts wandering and re-deciding its
   * direction every `actionDuration` ms.
   * @param {number} actionDuration
   */
  live(actionDuration) {
    this._actionDuration = actionDuration;
    this._alive = true;
    this._lastActionTime = this._now();
    this.loop();
  }

  loop() {
    const character = this._character;

    if (this._alive && !character.getDirection()) {
      character.setDirection(this._randomDirection());
    }

    if (
      this._timeSinceLastAction() >= this._actionDuration
      && Math.random() > this._newActionThreshold
    ) {
      this._lastActionTime = this._now();
      character.setDirection(this._randomDirection());
    }

    const savedGeometry = character.geometry.clone();

    switch (character.getDirection()) {
      case 'up': character.y(character.y() - this._pixelsPerTick); break;
      case 'down': character.y(character.y() + this._pixelsPerTick); break;
      case 'left': character.x(character.x() - this._pixelsPerTick); break;
      case 'right': character.x(character.x() + this._pixelsPerTick); break;
    }

    const collisions = character.getCollision(character.getBoard());
    if (collisions.length > 0) {
      character.setDirection(this._randomDirection());
      character.geometry = savedGeometry;
    }

    character.update();

    setTimeout(() => this.loop(), this._tickDelay);
  }

  _randomDirection() {
    const directions = ['up', 'down', 'left', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  _timeSinceLastAction() {
    return this._now() - this._lastActionTime;
  }

  _now() {
    return new Date().getTime();
  }
}
