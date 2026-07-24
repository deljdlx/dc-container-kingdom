import { Renderer } from './Renderer.js';
import { assetUrl } from '../../assets.js';

/**
 * Renders a ground area: a grass-tiled panel positioned in world space. It
 * paints geometry directly rather than via `super.render()` so the area stays
 * at the ground layer (no world-space depth z-index).
 */
export class AreaRenderer extends Renderer
{

  /**
   * Paint the grass background and position/size the area in world space.
   * @returns {DomElement} the area root DOM node
   */
  render() {
    const dom = this.getDom();
    dom.style.backgroundImage = `url(${assetUrl('map/grass-01.png')})`;
    dom.classList.add('map-area');
    dom.style.width = this.getElement().width() + 'px';
    dom.style.height = this.getElement().height() + 'px';
    dom.style.left = this.getElement().x() + 'px';
    dom.style.top = this.getElement().y() + 'px';

    return dom;
  }
}
