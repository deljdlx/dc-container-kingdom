import { Renderer } from './Renderer.js';
import { assetUrl } from '../assets.js';

/**
 * Renders a walking character: a sprite sheet whose visible frame is picked
 * from the element's current direction and animation index. NPC characters
 * re-render their board position on update; {@link MainCharacterRenderer}
 * overrides that since the camera moves it instead.
 */
export class CharacterRenderer extends Renderer
{
  /** Sprite-sheet cell size, in pixels. */
  spriteWidth = 48;
  spriteHeight = 48;

  /**
   * Speech-bubble node, created on the first {@link showReaction} — characters
   * that never speak never pay for it.
   * @type {DomElement|undefined}
   */
  _domQuickReaction;

  /** Last painted frame, cached to skip redundant background-position writes. */
  _lastDirection = null;
  _lastAnimationIndex = null;

  /** Vertical sprite-sheet offset (px) for each facing direction. */
  spriteDirectionOffsets = {
    up: this.spriteHeight * -3,
    down: this.spriteHeight * 0,
    left: this.spriteHeight * -1,
    right: this.spriteHeight * -2,
  }

  /**
   * Set up the character node: sprite sheet, initial frame and drop shadow.
   * @param {import('../Character.js').Character} element
   */
  constructor(element) {
    super(element);
    this.dom.classList.add('character');
    this.domSprite.style.backgroundImage = `url(${assetUrl('characters/characters-00.png')})`;
    this.applySpriteFrame('down', 1);

    this.addShadow();
  }

  /**
   * Point the sprite sheet at the frame for a given direction / animation step.
   * @param {string} direction
   * @param {number} animationIndex
   */
  applySpriteFrame(direction, animationIndex) {
    if(direction === this._lastDirection && animationIndex === this._lastAnimationIndex) {
      return;
    }
    this._lastDirection = direction;
    this._lastAnimationIndex = animationIndex;

    const left = animationIndex * -this.getElement().width() - this.getElement().getSpriteSheetOffsetLeft();
    const top = this.spriteDirectionOffsets[direction] - this.getElement().getSpriteSheetOffsetTop();
    this.domSprite.style.backgroundPosition = `${left}px ${top}px`;
  }

  /** Refresh the sprite frame from the model and re-render the board position. */
  update() {
    this.applySpriteFrame(this.getElement().getDirection(), this.getElement().getAnimationIndex());
    super.render();
  }

  /**
   * Create the speech-bubble node on first use (idempotent).
   * @returns {DomElement} the bubble node
   */
  _ensureQuickReaction() {
    if(this._domQuickReaction) {
      return this._domQuickReaction;
    }
    this._domQuickReaction = document.createElement('div');
    this._domQuickReaction.classList.add('quickReaction');
    this.dom.append(this._domQuickReaction);
    return this._domQuickReaction;
  }

  /**
   * Show a speech bubble with the given HTML content.
   * @param {string} content
   */
  showReaction(content) {
    const bubble = this._ensureQuickReaction();
    bubble.innerHTML = content;
    bubble.classList.add('quickReaction--enable');
  }

  /** Hide and empty the speech bubble. No-op while it has never been shown. */
  clearReaction() {
    if(!this._domQuickReaction) {
      return;
    }
    this._domQuickReaction.innerHTML = '';
    this._domQuickReaction.classList.remove('quickReaction--enable');
  }

  /** @returns {boolean} whether the speech bubble is currently shown */
  isReactionVisible() {
    return this._domQuickReaction?.classList.contains('quickReaction--enable') ?? false;
  }
}
