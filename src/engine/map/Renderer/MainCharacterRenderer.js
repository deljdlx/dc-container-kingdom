import { CharacterRenderer } from './CharacterRenderer.js';

/**
 * The player-controlled character. Same sprite rendering as
 * {@link CharacterRenderer}, but its on-screen position is driven by the camera
 * (see {@link ViewportRenderer}), so `update()` only refreshes the sprite frame
 * and never re-renders the board position.
 */
export class MainCharacterRenderer extends CharacterRenderer
{
  constructor(element) {
    super(element);
    this.dom.classList.add('character--main');
  }

  update() {
    this.applySpriteFrame(this.getElement().getDirection(), this.getElement().getAnimationIndex());
  }
}
