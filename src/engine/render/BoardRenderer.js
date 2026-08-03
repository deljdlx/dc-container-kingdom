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
    this.mountPending();

    return this.dom;
  }

  /** Mount any areas/elements that appeared since the last frame. */
  update() {
    super.update();
    this.mountPending();
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
   * Mount everything that has joined the board and is not on the page yet: the
   * areas of the grid with their elements, then the **entity layer** with its
   * own.
   *
   * Every node lands in the **board root**, never nested inside its container's
   * node — the board is a stacking context, so nesting would lock an element
   * into its container's context and break painter ordering between areas.
   * `relativeTo` is what carries the container's offset instead.
   */
  mountPending() {
    const matrix = this.board.getAreas();
    for(let x in matrix) {
      const areas = matrix[x];
      for(let y in areas) {
        const area = areas[y];
        if(!area.isRendered()) {
          this.dom.append(area.render());
        }

        this.mountChildrenOf(area);
      }
    }

    // Entities are mounted by the same rules as an area's elements — that is
    // what keeps their depth comparable with the scenery around them.
    const entities = this.board._entities;
    if(entities) {
      this.mountChildrenOf(entities);
    }
  }

  /**
   * Mount a container's not-yet-rendered children, descendants included.
   * @param {import('../scene/Element.js').Element} container an area, the entity layer…
   */
  mountChildrenOf(container) {
    container.getChildren().forEach(element => {
      if(element.isRendered()) {
        return;
      }
      element.relativeTo(container);

      const elementDom = element.render();
      const descendants = element.getAllChildren();
      if(descendants.length) {
        elementDom.classList.add('map-element--group');
      }
      this.dom.append(elementDom);

      descendants.forEach(child => {
        this.dom.append(child.render());
      });
    });
  }
}