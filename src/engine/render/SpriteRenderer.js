import { Renderer } from './Renderer.js';
import { assetUrl } from '../assets.js';

/**
 * The single renderer for static sprite elements. It paints purely from the
 * element's declarative descriptor (atlas + frame + optional shadow), so the
 * element stays view-agnostic — no DOM code in the model.
 *
 * @see SpriteElement for the descriptor shape.
 */
export class SpriteRenderer extends Renderer {
  /**
   * Position the element, paint its atlas frame, and add/override its shadow.
   * @returns {DomElement} the element root DOM node
   */
  render() {
    super.render();

    const descriptor = this.getElement().getSpriteDescriptor();
    const sprite = this.getSprite();
    sprite.style.backgroundImage = `url(${assetUrl(descriptor.atlas)})`;
    sprite.style.backgroundPosition = `${descriptor.frame[0]}px ${descriptor.frame[1]}px`;

    if (descriptor.shadow !== false) {
      this.addShadow();
      if (descriptor.shadow && typeof descriptor.shadow === 'object') {
        this._applyShadowOverrides(descriptor.shadow);
      }
    }

    return this.getDom();
  }

  /**
   * Apply per-descriptor shadow style overrides, skipping unset fields.
   * @param {{width?: number, height?: number, top?: number, left?: number, borderRadius?: string}} overrides
   */
  _applyShadowOverrides(overrides) {
    const style = this.getShadow().style;
    if (overrides.width != null) style.width = overrides.width + 'px';
    if (overrides.height != null) style.height = overrides.height + 'px';
    if (overrides.top != null) style.top = overrides.top + 'px';
    if (overrides.left != null) style.left = overrides.left + 'px';
    if (overrides.borderRadius != null) style.borderRadius = overrides.borderRadius;
  }
}
