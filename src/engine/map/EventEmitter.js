/**
 * Minimal name→callbacks event registry. Extracted from {@link Element} so the
 * base node keeps only scene-graph, geometry and collision concerns; Element
 * owns one and adds application-level bubbling on top of it.
 */
export class EventEmitter {
  _listeners = {};

  /**
   * @param {string} name
   * @param {(data: object) => void} callback
   * @returns {number} the listener index within its name bucket
   */
  on(name, callback) {
    if (typeof this._listeners[name] === 'undefined') {
      this._listeners[name] = [];
    }
    this._listeners[name].push(callback);

    return this._listeners[name].length - 1;
  }

  /**
   * @param {string} name
   * @param {object} [data]
   */
  emit(name, data = {}) {
    if (typeof this._listeners[name] !== 'undefined') {
      this._listeners[name].map(callback => {
        callback(data);
      });
    }
  }
}
