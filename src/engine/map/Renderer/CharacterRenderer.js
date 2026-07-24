import { Renderer } from './Renderer.js';
import { assetUrl } from '../../assets.js';

/**
 * Renders a walking character: a sprite sheet whose visible frame is picked
 * from the element's current direction and animation index. NPC characters
 * re-render their board position on update; {@link MainCharacterRenderer}
 * overrides that since the camera moves it instead.
 */
export class CharacterRenderer extends Renderer
{
  spriteWidth = 48;
  spriteHeight = 48;

  _domQuickReaction;

  spriteDirectionOffsets = {
    up: this.spriteHeight * -3,
    down: this.spriteHeight * 0,
    left: this.spriteHeight * -1,
    right: this.spriteHeight * -2,
  }

  constructor(element) {
    super(element);
    this.dom.classList.add('character');
    this.domSprite.style.backgroundImage = `url(${assetUrl('characters/characters-00.png')})`;
    this.applySpriteFrame('down', 1);

    this._domQuickReaction = document.createElement('div');
    this._domQuickReaction.classList.add('quickReaction');
    this.dom.append(this._domQuickReaction);

    this.addShadow();
  }

  /**
   * Point the sprite sheet at the frame for a given direction / animation step.
   * @param {string} direction
   * @param {number} animationIndex
   */
  applySpriteFrame(direction, animationIndex) {
    const left = animationIndex * -this.getElement().width() - this.getElement().getSpriteSheetOffsetLeft();
    const top = this.spriteDirectionOffsets[direction] - this.getElement().getSpriteSheetOffsetTop();
    this.domSprite.style.backgroundPosition = `${left}px ${top}px`;
  }

  update() {
    this.applySpriteFrame(this.getElement().getDirection(), this.getElement().getAnimationIndex());
    super.render();
  }
}
