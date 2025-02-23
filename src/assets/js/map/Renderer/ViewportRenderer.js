class ViewportRenderer
{
  /**
   * @type {Viewport}
   */
  _viewport;

  /**
   * @type {DomElement}
   */
  _container;

  /**
   * @param {Viewport} viewport
   */

  /**
   * @type {DomElement}
   */
  domCharacter;

  constructor(viewport) {
    this._viewport = viewport;
    this._container = this._viewport.getContainer();
    this._board = this._viewport.getBoard();
  }

  clear() {
    this._container.innerHTML = '';
  }

  /**
   * @param {DomElement} container
   */
  render() {
    this._container.style.width = this._viewport.getGeometry().width() + 'px';
    this._container.style.height = this._viewport.getGeometry().height() + 'px';
    this._container.append(this._viewport.getBoard().render());


    if(this._viewport.getCharacter()) {
      this.domCharacter = this._viewport.getCharacter().getRenderer().render();
      this._viewport.getBoard().getRenderer().getDom().append(this.domCharacter);
    }

  }

  renderDebug() {
    this._board.getRenderer().renderDebug();
    if(this._viewport.getCharacter()) {
      this._viewport.getCharacter().getRenderer().renderCollisionZones();
    }
  }

  update() {

    if(!this._viewport.getCharacter()) {
      return;
    }

    this._board = this._viewport.getBoard();
    const left = -this._viewport.x();
    const top = -this._viewport.y();

    // -1 : zindex fine tuning
    const zIndex =
      (
        this._board.height() +
        (
          (this._viewport.getCharacter().y()) % this._board.height() + (this._viewport.getCharacter().height() - 1)
        )
      ) % this._board.height()
    ;

    this._viewport.getCharacter().getRenderer().getDom().style.zIndex = zIndex;

    const characterTop = -top;
    const characterLeft = -left;

    this._viewport.getCharacter().getRenderer().getDom().style.transform =
      `translateZ(${-zIndex}px) translateX(${characterLeft}px) translateY(${characterTop}px)`;

    this._board.getRenderer().getDom().style.transform = `translateX(${left}px) translateY(${top}px)`;

  }
}
