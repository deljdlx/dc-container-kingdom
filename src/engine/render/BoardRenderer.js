import { Renderer } from './Renderer.js';

/**
 * Renders the board: positions the board root, then lazily mounts each area of
 * the area matrix and its (not-yet-rendered) child elements.
 */
export class BoardRenderer extends Renderer
{
  /**
   * @type {import('../Board.js').Board}
   */
  board;

  /**
   * @param {import('../Board.js').Board} board
   */
  constructor(board) {
    super(board);
    this.board = board;
  }

  /**
   * Position the board root and mount any pending areas.
   * @returns {DomElement} the board root DOM node
   */
  render() {
    super.render();
    this.renderAreas();

    return this.dom;
  }

  /** Mount any areas/elements that appeared since the last frame. */
  update() {
    super.update();
    this.renderAreas();
  }

  /** Draw collision-zone and bounding-box overlays for the board and its areas. */
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

  /**
   * Mount every not-yet-rendered area, and each area's not-yet-rendered child
   * elements together with their descendants, into the board root.
   */
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
            const descendants = element.getAllChildren();
            if(descendants.length) {
              elementDom.classList.add('map-element--group');
            }
            this.dom.append(elementDom);


            descendants.forEach(child => {
              this.dom.append(child.render());
            });
          }
        });

      }
    }
  }
}