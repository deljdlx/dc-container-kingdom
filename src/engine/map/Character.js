import { CharacterAnimator } from './CharacterAnimator.js';
import { CharacterBehavior } from './CharacterBehavior.js';
import { CharacterRenderer } from './Renderer/CharacterRenderer.js';
import { Element } from './Element.js';

/**
 * A character in the world: a 48×48 walking sprite. Owns only its world state
 * (geometry via {@link Element}, facing direction, sprite-sheet offset) and
 * delegates the rest — the walk-cycle clock to {@link CharacterAnimator}, the
 * autonomous NPC wander to {@link CharacterBehavior}, and the speech bubble to
 * its {@link CharacterRenderer}.
 */
export class Character extends Element
{
  direction;

  spriteSheetOffsetLeft = 0;
  spriteSheetOffsetTop = 0;

  /** @type {CharacterAnimator} */
  _animator = new CharacterAnimator();

  /** @type {CharacterBehavior} */
  _behavior = new CharacterBehavior(this);

  constructor(
    x = null,
    y = null,
    spriteSheetOffsetLeft = 0,
    spriteSheetOffsetTop = 0
  ) {
    super(x, y, 48, 48);

    this.spriteSheetOffsetLeft = spriteSheetOffsetLeft;
    this.spriteSheetOffsetTop = spriteSheetOffsetTop;

    this.createCollisionZone(16, 24, 14, 12);
    this.setRenderer(new CharacterRenderer(this));
  }

  /** Bring the character to life as a wandering NPC. @see CharacterBehavior */
  live(actionDuration) {
    this._behavior.live(actionDuration);
  }

  stop() {
    this.direction = null;
  }

  getSpriteSheetOffsetLeft() {
    return this.spriteSheetOffsetLeft;
  }

  getSpriteSheetOffsetTop() {
    return this.spriteSheetOffsetTop;
  }

  getDirection() {
    return this.direction;
  }

  setDirection(direction) {
    this.direction = direction;
  }

  getAnimationIndex() {
    return this._animator.getIndex();
  }

  /** Advance the walk-cycle clock and re-render. Called each moved frame. */
  update() {
    this._animator.advance(Math.round(this.moveSpeed() / 80));
    this.getRenderer().update();
  }

  /**
   * Move by (dx, dy) then revert to the starting position if `isBlocked()`
   * reports a collision. The predicate decides what "blocked" means (which
   * roots to test, whether triggers matter), so the player and NPC behaviors
   * share this move+revert dance without sharing their collision policy.
   * @param {number} dx
   * @param {number} dy
   * @param {() => boolean} isBlocked evaluated at the tentative position
   * @returns {boolean} whether the move was blocked (and thus reverted)
   */
  moveBlocked(dx, dy, isBlocked) {
    const savedX = this.x();
    const savedY = this.y();
    this.x(savedX + dx);
    this.y(savedY + dy);
    if (isBlocked()) {
      this.x(savedX);
      this.y(savedY);
      return true;
    }
    return false;
  }

  /**
   * Show a transient speech bubble above the character.
   * @param {string} content
   * @param {boolean} [autoClose]
   * @param {number} [closeAfter] ms before auto-closing
   */
  quickReaction(content, autoClose = true, closeAfter = 10000) {
    this.getRenderer().showReaction(content);
    if (autoClose) {
      setTimeout(() => {
        this.clearQuickReaction();
      }, closeAfter);
    }
    return this;
  }

  clearQuickReaction() {
    this.getRenderer().clearReaction();
    return this;
  }
}
