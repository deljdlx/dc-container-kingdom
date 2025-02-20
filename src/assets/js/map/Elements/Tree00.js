class Tree00 extends Element
{
  constructor() {
    super(0, 0 , 64, 64)
    this.createCollisionZone(24, 34, 16, 24);
  }

  render() {
    super.render();
    this.getRenderer().getSprite().style.backgroundImage = 'url(assets/images/map/map-sprites-01.png)';
    this.getRenderer().getSprite().style.backgroundPosition = '-256px 0';
    this.getRenderer().addShadow();
    this.getRenderer().getShadow().style.width = '48px';
    this.getRenderer().getShadow().style.height = '30px';
    this.getRenderer().getShadow().style.top = '45px';
    this.getRenderer().getShadow().style.left = '10px';
    this.getRenderer().getShadow().style.borderRadius = '100%';
    return this.dom;
  }
}
