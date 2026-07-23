/**
 * Decides where each container's house sits on the map — pure, no DOM.
 *
 * Maps each container to a cell derived from its id hash, then finds a free
 * cell (spiral search) honouring a minimum spacing. Backed by a simple
 * occupancy grid, so the whole placement is deterministic and unit-testable.
 */
export class ContainerPlacement {
  xCells;
  yCells;

  /** @type {Array<Array<Array>>} occupancy grid; a non-empty cell is taken */
  matrix;

  bounds = {
    minX: BigInt(Number.MAX_SAFE_INTEGER),
    minY: BigInt(Number.MAX_SAFE_INTEGER),
    maxX: BigInt(Number.MIN_SAFE_INTEGER),
    maxY: BigInt(Number.MIN_SAFE_INTEGER),
  };

  /**
   * @param {number} xCells number of columns
   * @param {number} yCells number of rows
   */
  constructor(xCells, yCells) {
    this.xCells = xCells;
    this.yCells = yCells;
    this.matrix = this._initMatrix();
  }

  _initMatrix() {
    const matrix = [];
    for (let x = 0; x < this.xCells; x++) {
      matrix[x] = [];
      for (let y = 0; y < this.yCells; y++) {
        matrix[x][y] = [];
      }
    }
    return matrix;
  }

  /**
   * Mark a cell as occupied so later placements avoid it.
   * @param {number} x
   * @param {number} y
   */
  occupy(x, y) {
    this.matrix[x][y].push(true);
  }

  /**
   * Compute the id-hash bounds across all containers; needed to normalise
   * a container's hash into a cell coordinate.
   * @param {Object<string, {Id: string}>|Array<{Id: string}>} containers
   * @returns {object} the bounds
   */
  computeBounds(containers) {
    let minX = BigInt(Number.MAX_SAFE_INTEGER);
    let minY = BigInt(Number.MAX_SAFE_INTEGER);
    let maxX = BigInt(Number.MIN_SAFE_INTEGER);
    let maxY = BigInt(Number.MIN_SAFE_INTEGER);

    Object.values(containers).forEach((container) => {
      const containerId = container.Id;
      const containerLeft = BigInt('0x' + containerId.substring(0, 32));
      const containerRight = BigInt('0x' + containerId.substring(32, 64));
      minX = containerLeft < minX ? containerLeft : minX;
      minY = containerRight < minY ? containerRight : minY;
      maxX = containerLeft > maxX ? containerLeft : maxX;
      maxY = containerRight > maxY ? containerRight : maxY;
    });

    this.bounds.minX = minX;
    this.bounds.minY = minY;
    this.bounds.maxX = maxX;
    this.bounds.maxY = maxY;

    return this.bounds;
  }

  /**
   * Map a container to its "natural" cell from its id hash, before collision
   * resolution.
   * @param {{Id: string}} container
   * @returns {{x: number, y: number}}
   */
  computeContainerCoords(container) {
    const { minX, minY, maxX, maxY } = this.bounds;

    const containerId = container.Id;
    const containerLeft = BigInt('0x' + containerId.substring(0, 32)) - minX;
    const containerTop = BigInt('0x' + containerId.substring(32, 64)) - minY;

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    let x = Number((containerLeft * BigInt(this.xCells)) / rangeX);
    let y = Number((containerTop * BigInt(this.yCells)) / rangeY);

    x = Math.min(x, this.xCells - 1);
    y = Math.min(y, this.yCells - 1);

    return { x, y };
  }

  /**
   * Spiral outward from a start cell to the first free cell that keeps
   * `minDistance` empty cells around it.
   * @returns {{x: number, y: number}|null} null if the grid is full
   */
  getClosestFreeCoords(startX, startY, minDistance = 1) {
    const rows = this.matrix.length;
    const cols = this.matrix[0].length;
    let x = startX, y = startY;
    let step = 1, dir = 0;

    const directions = [
      [1, 0],  // right
      [0, 1],  // down
      [-1, 0], // left
      [0, -1], // up
    ];

    if (this.isPositionValid(x, y, minDistance)) return { x, y };

    while (step < Math.max(rows, cols)) {
      for (let i = 0; i < 2; i++) { // twice per step before growing the spiral
        for (let j = 0; j < step; j++) {
          x += directions[dir][0];
          y += directions[dir][1];

          if (x >= 0 && y >= 0 && x < rows && y < cols && this.isPositionValid(x, y, minDistance)) {
            return { x, y };
          }
        }
        dir = (dir + 1) % 4;
      }
      step++;
    }

    return null;
  }

  /**
   * @returns {boolean} whether the cell is empty and every cell within
   * `minDistance` is empty too.
   */
  isPositionValid(x, y, minDistance) {
    if (x < 0 || y < 0 || x >= this.matrix.length || y >= this.matrix[0].length) {
      return false;
    }

    if (this.matrix[x][y].length !== 0) return false;

    for (let dx = -minDistance; dx <= minDistance; dx++) {
      for (let dy = -minDistance; dy <= minDistance; dy++) {
        let nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < this.matrix.length && ny < this.matrix[0].length) {
          if (this.matrix[nx][ny].length !== 0) {
            return false;
          }
        }
      }
    }
    return true;
  }
}
