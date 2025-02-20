class Application
{

  _elementsClasses = {};
  _viewport;
  _container;
  _width;
  _height;


  listeners = {};

  apiGetAreaUrl = './backend/index.php';


  /**
   * @param {String} selector
   * @param {int} width
   * @param {int} height
   */
  constructor(selector, width, height) {
    this._container = document.querySelector(selector);
    this._width = width;
    this._height = height;

    console.log('%cApplication.js :: 26 =============================', 'color: #f00; font-size: 1rem');
    console.log(this._width);
    console.log(this._height);


    Application.mainInstance = this;
    this._viewport = new Viewport(
      this,
      this._container,
      this._width,
      this._height,
    );
  }

  clear() {
    this._viewport.clear();
  }

  addEventListener(name, callback) {
    if(typeof(this.listeners[name]) === 'undefined') {
      this.listeners[name] = [];
    }
    this.listeners[name].push(callback);

    return this.listeners[name].length - 1;
  }

  handle(name, data = {}) {
    if(typeof(this.listeners[name]) !== 'undefined') {
      this.listeners[name].map(callback => {
        callback(data);
      });
    }
  }

  registerElement(name, constructorName) {
    this._elementsClasses[name] = constructorName;
  }

  getRegisteredElements() {
    return Object.keys(this._elementsClasses);
  }

  instanciate(name) {
    if(typeof(this._elementsClasses[name]) === 'undefined') {
      console.error('Element with name ' + name + ' does no exists');
      return false;
    }
    return new this._elementsClasses[name];
  }

  async run() {
    await this._viewport.run();
    this._viewport.render();
    this._viewport.renderDebug();
  }

  getViewport() {
    return this._viewport;
  }


  async fetchArea(x, y) {
    // JDLX_TODO

    const data = `&x=${x}&y=${y}`;
    return fetch(this.apiGetAreaUrl + '?' + data).then(response => response.json());
  }
}


