class Fence00V extends Element
{
  constructor() {
    super(0, 0 , 8, 16)
    this.createCollisionZone(0, 0, 8, 16);
  }

  render() {
    const dom = super.render();
    dom.style.backgroundImage = 'url(assets/images/map/map-sprites-01.png)';
    dom.style.backgroundPosition = `-1504px -1504px`;
    this.getRenderer().addShadow();
    return dom;
  }
}
