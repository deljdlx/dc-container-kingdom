import { EventEmitter } from './EventEmitter.js';
import { Viewport } from './Viewport.js';

/**
 * Top-level entry point of the engine: owns the single {@link Viewport}, the
 * registry of instantiable element classes, the global event bus and the
 * backend endpoint. `Application.mainInstance` holds the last-created instance.
 */
export class Application
{

  /** @type {Object<string, Function>} name → element constructor, for {@link instanciate} */
  _elementsClasses = {};
  _viewport;
  _container;
  _width;
  _height;

  _viewportWidth;
  _viewportHeight;


  /**
   * @type {EventEmitter}
   */
  _events = new EventEmitter();

  apiGetAreaUrl = './backend/index.php';


  /**
   * @param {String} selector CSS selector of the host container
   * @param {int} width world width
   * @param {int} height world height
   * @param {int|null} [viewportWidth] defaults to `width`
   * @param {int|null} [viewportHeight] defaults to `height`
   */
  constructor(
    selector,
    width,
    height,
    viewportWidth = null,
    viewportHeight = null,
  ) {
    this._container = document.querySelector(selector);
    this._width = width;
    this._height = height;

    if(viewportWidth === null) {
      viewportWidth = width;
    }
    if(viewportHeight === null) {
      viewportHeight = height;
    }

    this._viewportWidth = viewportWidth;
    this._viewportHeight = viewportHeight;

    Application.mainInstance = this;
    this._viewport = new Viewport(
      this,
      this._container,
      this._viewportWidth,
      this._viewportHeight,
    );
  }

  /** Clear the viewport (renderer and board). */
  clear() {
    this._viewport.clear();
  }

  /**
   * Subscribe to an application-level event.
   * @param {string} name
   * @param {Function} callback
   * @returns {*} the subscription handle returned by the emitter
   */
  addEventListener(name, callback) {
    return this._events.on(name, callback);
  }

  /**
   * Emit an application-level event.
   * @param {string} name
   * @param {Object} [data]
   */
  handle(name, data = {}) {
    this._events.emit(name, data);
  }

  /**
   * Register an element class under a name so areas can instantiate it by name.
   * @param {string} name
   * @param {Function} constructorName element constructor
   */
  registerElement(name, constructorName) {
    this._elementsClasses[name] = constructorName;
  }

  /** @returns {string[]} the registered element names */
  getRegisteredElements() {
    return Object.keys(this._elementsClasses);
  }

  /**
   * Instantiate a registered element by name.
   * @param {string} name
   * @returns {Object|false} a new element instance, or false if the name is unknown
   */
  instanciate(name) {
    if(typeof(this._elementsClasses[name]) === 'undefined') {
      console.error('Element with name ' + name + ' does no exists');
      return false;
    }
    return new this._elementsClasses[name];
  }

  /** Start the viewport loop, then render the world and debug overlay. */
  async run() {
    await this._viewport.run();
    this._viewport.render();
    this._viewport.renderDebug();
  }

  /** @returns {Viewport} the application's viewport */
  getViewport() {
    return this._viewport;
  }


  /**
   * Fetch an area's element descriptors from the backend.
   * @param {number} x
   * @param {number} y
   * @returns {Promise<Array<{name: string, x: number, y: number, element: string}>>}
   */
  async fetchArea(x, y) {
    const data = `&x=${x}&y=${y}`;
    return fetch(this.apiGetAreaUrl + '?' + data).then(response => response.json());
  }
}


