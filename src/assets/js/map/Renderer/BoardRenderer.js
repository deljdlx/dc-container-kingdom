class BoardRenderer extends Renderer
{
  /**
   * @type {Board}
   */
  board;

  /**
   *
   * @param {Board} board
   */
  constructor(board) {
    super(board);
    this.board = board;
  }

  render() {
    super.render();
    this.renderAreas();

    return this.dom;
  }

  update() {
    super.update();
    this.renderAreas();
  }

  renderDebug() {
    this.board.renderCollisionZones();

    const matrix = this.board.getAreas();
    for(let x in matrix) {
      const areas = matrix[x];
      for(let y in areas) {
        const area = areas[y];
        if(!area.isRendered()) {

          area.renderCollisionZones();
          area.renderBoundingBox();
        }
      }
    }
  }

  renderAreas() {
    const matrix = this.board.getAreas();
    for(let x in matrix) {
      const areas = matrix[x];
      for(let y in areas) {
        const area = areas[y];
        if(!area.isRendered()) {
          this.dom.append(area.render());
        }

        const areaElements = area.getChildren();
        areaElements.forEach(element => {
          if(!element.isRendered()) {
            element.relativeTo(area);

            const elementDom = element.render();
            if(element.getAllChildren().length) {
              elementDom.classList.add('map-element--group');
            }
            this.dom.append(elementDom);


            element.getAllChildren().forEach(child => {
              this.dom.append(child.render());
              // this.dom.append(child.getDom());
            });
          }
        });

      }
    }
  }
}