class Flower00 extends Element
{
  constructor() {
    super(0, 0 , 32, 32)
    this.createTriggerZone(0, 0, 32 ,32);
  }

  render() {
    const dom = super.render();
    this.getRenderer().addShadow();
    this.getRenderer().getSprite().style.backgroundImage = 'url(assets/images/map/flowers-00.png)';
    this.getRenderer().getSprite().style.backgroundPosition = `0px -96px`;
    return dom;
  }
}