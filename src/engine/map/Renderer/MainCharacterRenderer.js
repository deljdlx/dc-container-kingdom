import { CharacterRenderer } from './CharacterRenderer.js';

/**
 * The player-controlled character. Identical rendering to
 * {@link CharacterRenderer} — it walks the world in world space and the camera
 * keeps it centred — with just an extra CSS class for app-specific styling.
 */
export class MainCharacterRenderer extends CharacterRenderer
{
  constructor(element) {
    super(element);
    this.dom.classList.add('character--main');
  }
}
