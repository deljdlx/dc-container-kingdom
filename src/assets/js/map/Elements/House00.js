class House00 extends Element
{
  constructor() {
    super(0, 0 , 130, 130)
    this.createCollisionZone(10, 50, 110, 70);

  }

  render() {
    super.render();
    this.getRenderer().addShadow();
    this.getRenderer().getSprite().style.backgroundImage = 'url(assets/images/map/map-sprites-02.png)';
    this.getRenderer().getSprite().style.backgroundPosition = '-1734px -2390px';
    return this.dom;
  }
}