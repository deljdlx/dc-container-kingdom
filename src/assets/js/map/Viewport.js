class Viewport
{

  /**
   * @type {Application}
   */
  _application;

  /**
   * @type {number}
   */
  direction;

  /**
   * @type {number}
   */
  moving = 0;

  /**
   * @type {number}
   */
  interval = 4;

  /**
   * @type {number}
   */
  _timestamp;


  /**
   * @type {Geometry}
   */
  geometry;

  loop;

  // pixels per second
  speed = 300;

  /**
   * @type {Board}
   */
  board;

  /**
   * @type {ViewportRenderer}
   */
  renderer;

  /**
   * @type {DomElement}
   */
  container;


  /**
   * @type {Character}
   */
  character;

  _listeners = {};


  /**
   * @param {Application} application
   * @param {DomElement} container
   * @param {number} width
   * @param {number} height
   */
  constructor(application, container, width = 500, height = 500) {

    console.log({
      width,
      height
    });


    this._application = application;

    this.container = container;
    this.geometry = new Geometry(0, 0);
    this.geometry.x(0);
    this.geometry.y(0);
    this.geometry.width(width);

    this.geometry.height(height);
    this.renderer = new ViewportRenderer(this);

    this.character = new Character();
    this.character.x(this.width() / 2);
    this.character.y(this.height() / 2);
    this.character.moveSpeed(300);
    this.character.setApplication(this.getApplication());

    this.board = new Board(this);
  }

  clear() {
    this.renderer.clear();
    this.board.clear();
  }

  // ===========================
  addEventListener(name, callback) {
    if(typeof(this._listeners[name]) === 'undefined') {
      this._listeners[name] = [];
    }
    this._listeners[name].push(callback);

    return this._listeners[name].length - 1;
  }

  handle(name, data = {}) {
    if(typeof(this._listeners[name]) !== 'undefined') {
      this._listeners[name].map(callback => {
        callback(data);
      });
    }

    this.getApplication().handle(name, data);
  }

  // ===========================

  /**
   * @returns {Application}
   */
  getApplication() {
    return this._application;
  }

  /**
   * @returns {Character}
   */
  getCharacter(){
    return this.character;
  }

  /**
   * @returns {Board}
   */
  getBoard() {
    return this.board;
  }

  /**
   * @returns {DomElement}
   */
  getContainer() {
    return this.container;
  }

  /**
   * @returns {{x: number, y: number}}
   */
  getCurrentAreaCoordinates() {
    const x = Math.floor(this.character.x() / this.board.width());
    const y = Math.floor((this.character.y() + 48) / this.board.height());
    return {
      x: x,
      y: y
    };
  }

  /**
   * @returns {Area}
   */
  getCurrentArea() {
    const at = this.getCurrentAreaCoordinates();
    return this.board.getAreaAt(at.x, at.y)
  }

  /**
   * @returns {Boolean}
   */
  currentAreaExists() {
    const at = this.getCurrentAreaCoordinates();
    return this.board.areaExistsAt(at.x, at.y);
  }

  loadAreasFromCurrentPosition() {
    const at = this.getCurrentAreaCoordinates();

    this.board.loadArea(at.x - 1, at.y);
    this.board.loadArea(at.x - 1, at.y - 1);
    this.board.loadArea(at.x - 1, at.y + 1);

    this.board.loadArea(at.x + 1, at.y);
    this.board.loadArea(at.x + 1, at.y - 1);
    this.board.loadArea(at.x + 1, at.y + 1);

    this.board.loadArea(at.x, at.y + 1);
    this.board.loadArea(at.x, at.y - 1);
  }

  freeAreasFromCurrentPosision(radius = 2) {
    const at = this.getCurrentAreaCoordinates();

    this.board.freeArea(at.x - 2, at.y - 2);
    this.board.freeArea(at.x - 2, at.y - 1);
    this.board.freeArea(at.x - 2, at.y);
    this.board.freeArea(at.x - 2, at.y + 1);
    this.board.freeArea(at.x - 2, at.y + 2);

    this.board.freeArea(at.x + 2, at.y - 2);
    this.board.freeArea(at.x + 2, at.y - 1);
    this.board.freeArea(at.x + 2, at.y);
    this.board.freeArea(at.x + 2, at.y + 1);
    this.board.freeArea(at.x + 2, at.y + 2);

    this.board.freeArea(at.x - 1, at.y + 2);
    this.board.freeArea(at.x, at.y + 2);
    this.board.freeArea(at.x + 1, at.y + 2);

    this.board.freeArea(at.x - 1, at.y - 2);
    this.board.freeArea(at.x, at.y - 2);
    this.board.freeArea(at.x + 1, at.y - 2);

  }

  // ===========================

  startLoop() {
    this.tick();
  }

  tick() {
    requestAnimationFrame((timestamp) => {
      this.update(timestamp);
      this.tick();
    })
  }

  // ===========================

  update(timestamp) {
    const increment = Math.round((timestamp - this._timestamp) * this.character.moveSpeed() / 1000);

    if(increment < 1) {
      return;
    }

    this._timestamp = timestamp;

    if(this.moving === 0) {
      return;
    }

    this.loadAreasFromCurrentPosition();
    this.freeAreasFromCurrentPosision();

    this.updateCharacter(increment);


    this.getBoard().update();
    this.renderer.update();
    this.character.update();
  }

  updateCharacter(increment) {
    const saveGeometry = this.geometry.clone();

    switch(this.direction) {
      case 'up': { this.geometry.add('y', -increment); break; }
      case 'down': { this.geometry.add('y', increment); break; }
      case 'left': { this.geometry.add('x', -increment); break; }
      case 'right': { this.geometry.add('x', increment); break; }
    }

    this.character.x(this.x() + this.width() / 2);
    this.character.y(this.y() + this.height() / 2);

    let collisions = this.character.getCollision(this.board);

    if(collisions.length) {
      this.geometry = saveGeometry;
      this.character.x(this.x() + this.width() / 2);
      this.character.y(this.y() + this.height() / 2);
    }
    else {
      this.character.clearCollision();
    }

    this.handle("map.update", {
      map: this,
      character: this.character,
    });

    let triggers = this.character.getTrigger(this.board);
    if(!triggers.length) {
      this.character.clearCollision('trigger');
    }
  }

  render() {
    return this.renderer.render();
  }

  renderDebug() {
    return this.renderer.renderDebug();
  }

  // ===========================

  stop() {
    this.moving = 0;
  }

  move(direction) {
    this.direction = direction;
    this.moving = 1;
    this.character.setDirection(this.direction);
  }

  run() {
    document.body.addEventListener('keyup', (event) => {
      this.stop();
      return;
    });

    document.body.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        this.move('left');
      }

      if (event.key === 'ArrowRight') {
        this.move('right');
      }
      if (event.key === 'ArrowUp') {
        this.move('up');
      }
      if (event.key === 'ArrowDown') {
        this.move('down');
      }
    });

    this.startLoop()
  }

  getBoard() {
    return this.board;
  }

  getGeometry() {
    return this.geometry;
  }

  x(value = null) {
    return this.geometry.x(value);
  }

  y(value = null) {
    return this.geometry.y(value);
  }

  width(value = null) {
    return this.geometry.width(value);
  }

  height(value = null) {
    return this.geometry.height(value);
  }
}
