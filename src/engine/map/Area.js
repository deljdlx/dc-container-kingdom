import { AreaRenderer } from './Renderer/AreaRenderer.js';
import { Element } from './Element.js';
import { EngineEvents } from '../events/EngineEvents.js';

/**
 * A single tile of the world grid: a fixed-size container of game elements,
 * placed on the {@link import('./Board.js').Board} at integer map coordinates
 * (`mapX`, `mapY`). Forwards click events as `area.click`.
 */
export class Area extends Element
{
  /**
   * @type {import('./Board.js').Board}
   */
  board;


  /**
   * @type {Number} area column on the board grid
   */
  mapX;

  /**
   * @type {Number} area row on the board grid
   */
  mapY;

  /**
   * @param {import('./Board.js').Board} board
   * @param {Number} x map column
   * @param {Number} y map row
   */
  constructor(board, x, y) {
    super(0, 0, board.width(), board.height());
    this.mapX = x;
    this.mapY = y
    this.board = board;
    this.setApplication(board.getApplication());
    this.setRenderer(new AreaRenderer(this));

    this.dom.addEventListener('click', (event) => {
      this.handle(EngineEvents.AREA_CLICK, {
        area: this,
        areaX: event.offsetX,
        areaY: event.offsetY,
        originalEvent: event,
      });
    })
  }

  /** @returns {Number} the area's column on the board grid */
  getCoordX() {
    return this.mapX;
  }

  /** @returns {Number} the area's row on the board grid */
  getCoordY() {
    return this.mapY;
  }

  /**
   * @returns {import('./Board.js').Board}
   */
  getBoard() {
    return this.board;
  }


  /**
   * Serialize named children into backend area descriptors.
   * @returns {Array<{name: string, x: number, y: number, element: string}>}
   */
  toJSON() {
    const data = [];

    const childrenByName = this.getChildrenByName();
    for(let name in childrenByName) {
      const element = childrenByName[name]
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
