import { CharacterAnimator } from './CharacterAnimator.js';
import { CharacterBehavior } from './CharacterBehavior.js';
import { CharacterRenderer } from './Renderer/CharacterRenderer.js';
import { Element } from './Element.js';
import { EngineEvents } from '../events/EngineEvents.js';

/**
 * A character in the world: a 48×48 walking sprite. Owns only its world state
 * (geometry via {@link Element}, facing direction, sprite-sheet offset) and
 * delegates the rest — the walk-cycle clock to {@link CharacterAnimator}, the
 * autonomous NPC wander to {@link CharacterBehavior}, and the speech bubble to
 * its {@link CharacterRenderer}.
 */
export class Character extends Element
{
  /** @type {string|null} the direction currently faced/walked ('up'|'down'|'left'|'right'), or null when idle */
  direction;

  /** @type {number} column offset (px) of this character's sprite in the shared sheet */
  spriteSheetOffsetLeft = 0;
  /** @type {number} row offset (px) of this character's sprite in the shared sheet */
  spriteSheetOffsetTop = 0;

  /** @type {CharacterAnimator} */
  _animator = new CharacterAnimator();

  /** @type {CharacterBehavior} */
  _behavior = new CharacterBehavior(this);

  /** @type {ReturnType<typeof setTimeout>|undefined} speech-bubble auto-close timer */
  _reactionTimeout;

  /**
   * @param {number|null} [x] world x, or null to leave unpositioned
   * @param {number|null} [y] world y, or null to leave unpositioned
   * @param {number} [spriteSheetOffsetLeft] column offset (px) into the sprite sheet
   * @param {number} [spriteSheetOffsetTop] row offset (px) into the sprite sheet
   */
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

  /**
   * Bring the character to life as a wandering NPC. @see CharacterBehavior
   * @param {number} actionDuration ms between random direction changes
   */
  live(actionDuration) {
    this._behavior.live(actionDuration);
  }

  /** Halt movement by clearing the current facing direction. */
  stop() {
    this.direction = null;
  }

  /** @returns {number} the sprite-sheet column offset (px) */
  getSpriteSheetOffsetLeft() {
    return this.spriteSheetOffsetLeft;
  }

  /** @returns {number} the sprite-sheet row offset (px) */
  getSpriteSheetOffsetTop() {
    return this.spriteSheetOffsetTop;
  }

  /** @returns {string|null} the direction currently faced, or null when idle */
  getDirection() {
    return this.direction;
  }

  /** @param {string|null} direction the new facing direction, or null for idle */
  setDirection(direction) {
    this.direction = direction;
  }

  /** @returns {number} the current walk-cycle frame index */
  getAnimationIndex() {
    return this._animator.getIndex();
  }

  /**
   * Advance the walk-cycle clock by the distance walked since the previous
   * update, then re-render.
   * @param {number} walkedDistance walked pixels since the previous update
   */
  update(walkedDistance = 0) {
    this._animator.advance(walkedDistance);
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
   * @returns {this}
   */
  quickReaction(content, autoClose = true, closeAfter = 10000) {
    this.getRenderer().showReaction(content);
    this.handle(EngineEvents.ELEMENT_REACTION_SHOW, { character: this, content });
    clearTimeout(this._reactionTimeout);
    if (autoClose) {
      this._reactionTimeout = setTimeout(() => {
        this.clearQuickReaction();
      }, closeAfter);
    }
    return this;
  }

  /** Hide the speech bubble immediately and fire the hide event if one was shown. @returns {this} */
  clearQuickReaction() {
    clearTimeout(this._reactionTimeout);
    const wasReacting = this.isReacting();
    this.getRenderer().clearReaction();
    if (wasReacting) {
      this.handle(EngineEvents.ELEMENT_REACTION_HIDE, { character: this });
    }
    return this;
  }

  /** @returns {boolean} whether a speech bubble is currently displayed */
  isReacting() {
    return this.getRenderer().isReactionVisible();
  }
}
