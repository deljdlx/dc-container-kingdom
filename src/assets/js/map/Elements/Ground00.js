class Ground00 extends Element
{
  constructor() {
    super(0, 0 , 50, 50);
    this.manualZ = true;
  }

  render() {
    const dom = super.render();
    this.getRenderer().getSprite().style.backgroundImage = 'url(assets/images/map/map-sprites-01.png)';
    this.getRenderer().getSprite().style.backgroundPosition = `-1790px -800px`;
    return dom;
  }
}