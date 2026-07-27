/**
 * Sparse grid of the road tiles laid between containers, addressed by pixel
 * coordinates.
 *
 * It exists to keep coordinates **numeric**. The previous plain-object version
 * was indexed by `matrix[x][y]`, so `Object.keys()` handed back strings and the
 * neighbour lookup silently concatenated (`"350" + 50 === "35050"`) instead of
 * adding — the rule that keeps trees off the roads never fired once.
 */
export class RoadMatrix {
  /** @type {Map<string, {x: number, y: number, road: object}>} */
  _tiles = new Map();

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string} the map key for a tile
   */
  static key(x, y) {
    return `${x},${y}`;
  }

  /**
   * Record a road tile at (x, y).
   * @param {number} x
   * @param {number} y
   * @param {object} road the engine element drawn there
   */
  add(x, y, road) {
    this._tiles.set(RoadMatrix.key(x, y), {
      x,
      y,
      road,
      networks: new Set(),
    });
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {{x: number, y: number, road: object, networks: Set<string>}|undefined}
   */
  get(x, y) {
    return this._tiles.get(RoadMatrix.key(x, y));
  }

  /**
   * Record that a road tile belongs to a network.
   * @param {number} x
   * @param {number} y
   * @param {string} networkName
   */
  assignNetwork(x, y, networkName) {
    const tile = this.get(x, y);
    if (!tile) {
      return;
    }
    tile.networks.add(networkName);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {string[]} network names attached to the tile
   */
  getNetworks(x, y) {
    const tile = this.get(x, y);
    if (!tile) {
      return [];
    }
    return [...tile.networks];
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {boolean} whether a road tile sits exactly there
   */
  has(x, y) {
    return this._tiles.has(RoadMatrix.key(x, y));
  }

  /**
   * @returns {Array<{x: number, y: number, road: object}>} every recorded tile
   */
  tiles() {
    return [...this._tiles.values()].map(({ x, y, road }) => ({ x, y, road }));
  }

  /**
   * Whether a road tile sits one step to the left or to the right — the test
   * that keeps decoration off a road that continues horizontally.
   * @param {number} x
   * @param {number} y
   * @param {number} step horizontal distance between two tiles (road width)
   * @returns {boolean}
   */
  hasHorizontalNeighbour(x, y, step) {
    return this.has(x + step, y) || this.has(x - step, y);
  }
}
