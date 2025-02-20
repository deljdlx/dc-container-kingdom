class Area extends Element
{
  /**
   * @type {Board}
   */
  board;


  /**
   * @type {Number}
   */
  mapX;

  /**
   * @type {Number}
   */
  mapY;

  /**
   *
   * @param {Board} board
   * @param {Number} x
   * @param {Number} y
   */
  constructor(board, x, y) {
    super(0, 0, board.width(), board.height());
    this.mapX = x;
    this.mapY = y
    this.board = board;
    this.setApplication(board.getApplication());
    this.setRenderer(new AreaRenderer(this));

    this.dom.addEventListener('click', (event) => {
      this.handle('area.click', {
        area: this,
        areaX: event.offsetX,
        areaY: event.offsetY,
        originalEvent: event,
      });
    })
  }

  getCoordX() {
    return this.mapX;
  }

  getCoordY() {
    return this.mapY;
  }

  /**
   * @returns {Board}
   */
  getBoard() {
    return this.board;
  }


  toJSON() {
    const data = [];

    for(let name in this.childrenByName) {
      const element = this.childrenByName[name]
      const descriptor = {
        name: name,
        x: element.x(),
        y: element.y(),
        element: element.constructor.name,
      };
      data.push(descriptor);
    }

    return data;

  }
}
