class AreaRenderer extends Renderer
{

  render() {
    // const dom = super.render();
    const dom = this.getDom();
    dom.style.backgroundImage = 'url(assets/images/map/grass-01.png)';
    dom.classList.add('map-area');
    dom.style.width = this.getElement().width() + 'px';
    dom.style.height = this.getElement().height() + 'px';
    dom.style.left = this.getElement().x() + 'px';
    dom.style.top = this.getElement().y() + 'px';

    return dom;
  }
}
