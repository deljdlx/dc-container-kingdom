class Fountain00 extends Element
{
  constructor() {
    super(0, 0 , 80, 64);
    this.createCollisionZone(4, 5, 70, 59);
  }

  render() {
    const dom = super.render();
    this.getRenderer().addShadow();
    this.getRenderer().getSprite().style.backgroundImage = 'url(assets/images/map/map-sprites-01.png)';
    this.getRenderer().getSprite().style.backgroundPosition = `-1170px -2754px`;

    this.getRenderer().getShadow().style.borderRadius = '100%';
    this.getRenderer().getShadow().style.top = '16px';
    this.getRenderer().getShadow().style.height = '54px';
    return dom;
  }
}