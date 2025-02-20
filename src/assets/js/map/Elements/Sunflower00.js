class Sunflower00 extends Element
{
  constructor() {
    super(0, 0 , 16, 24)
  }

  render() {
    const dom = super.render();
    this.getRenderer().addShadow();
    this.getRenderer().getSprite().style.backgroundImage = 'url(assets/images/map/map-sprites-01.png)';
    this.getRenderer().getSprite().style.backgroundPosition = `-1760px -1256px`;
    return dom;
  }
}