import { Element } from '../Element.js';
import { assetUrl } from '../../assets.js';

export class Fence00H extends Element
{
  constructor() {
    super(0, 0 , 16, 16)
    this.createCollisionZone(0, 0, 16, 16);
  }

  render() {
    const dom = super.render();
    this.getRenderer().addShadow();
    dom.style.backgroundImage = `url(${assetUrl('map/map-sprites-01.png')})`;
    dom.style.backgroundPosition = `-1520px -1520px`;
    return dom;
  }
}
