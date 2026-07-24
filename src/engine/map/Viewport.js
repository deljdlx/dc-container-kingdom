import { Application } from './Application.js';
import { Area } from './Area.js';
import { Board } from './Board.js';
import { Camera } from './Camera.js';
import { Character } from './Character.js';
import { EventEmitter } from './EventEmitter.js';
import { Geometry } from './Geometry.js';
import { MainCharacterRenderer } from './Renderer/MainCharacterRenderer.js';
import { ViewportRenderer } from './Renderer/ViewportRenderer.js';

export class Viewport
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

  /**
   * @type {Camera}
   */
  _camera;

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

  /**
   * @type {EventEmitter}
   */
  _events = new EventEmitter();


  /**
   * @param {Application} application
   * @param {DomElement} container
   * @param {number} width
   * @param {number} height
   */
  constructor(
    application,
    container,
    width = 500,
    height = 500,
    mainCharacterX = null,
    mainCharacterY = null

  ) {
    this._application = application;

    this.container = container;
    this.geometry = new Geometry(0, 0);
    this.geometry.x(0);
    this.geometry.y(0);
    this.geometry.width(width);

    this.geometry.height(height);
    this._camera = new Camera(width, height);
    this.renderer = new ViewportRenderer(this);

    this.board = new Board(this);
  }

  /**
   * @returns {Camera}
   */
  getCamera() {
    return this._camera;
  }

  enableMainCharacter(mainCharacterX, mainCharacterY) {
    this.character = new Character();
    this.character.setRenderer(new MainCharacterRenderer(this.character));
    if(mainCharacterX === null) {
      mainCharacterX = this.width() / 2;
    }
    if(mainCharacterY === null) {
      mainCharacterY = this.height() / 2;
    }
    this.character.x(mainCharacterX);
    this.character.y(mainCharacterY);
    this.character.moveSpeed(300);
    this.character.setApplication(this.getApplication());

    // The camera keeps the player centred.
    this._camera.follow(this.character);
  }

  clear() {
    this.renderer.clear();
    this.board.clear();
  }

  // ===========================
  addEventListener(name, callback) {
    return this._events.on(name, callback);
  }

  handle(name, data = {}) {
    this._events.emit(name, data);
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
    // Clamp dt so the first frame after a pause doesn't teleport the character.
    const dt = this._timestamp ? Math.min(timestamp - this._timestamp, 100) : 0;
    this._timestamp = timestamp;

    if(this.character && this.moving) {
      const increment = Math.round(dt * this.character.moveSpeed() / 1000);
      if(increment >= 1) {
        this.loadAreasFromCurrentPosition();
        this.freeAreasFromCurrentPosision();
        this.moveCharacter(increment);
        this.getBoard().update();
        this.character.update();
      }
    }

    // The camera follows its target; the viewport renderer applies the offset.
    this._camera.update();
    this.renderer.update();
  }

  /**
   * Move the player through the world by `increment`, reverting on collision.
   * The camera follows separately, so the player is no longer glued to centre.
   */
  moveCharacter(increment) {
    if(!this.character) {
      return;
    }

    const savedX = this.character.x();
    const savedY = this.character.y();

    switch(this.direction) {
      case 'up': { this.character.y(this.character.y() - increment); break; }
      case 'down': { this.character.y(this.character.y() + increment); break; }
      case 'left': { this.character.x(this.character.x() - increment); break; }
      case 'right': { this.character.x(this.character.x() + increment); break; }
    }

    const collisions = this.character.getCollision(this.board);

    if(collisions.length) {
      this.character.x(savedX);
      this.character.y(savedY);
    }
    else {
      this.character.clearCollision();
    }

    this.handle("map.update", {
      map: this,
      character: this.character,
    });

    const triggers = this.character.getTrigger(this.board);
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
    if(this.character) {
      document.body.addEventListener('keyup', () => {
        this.stop();
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
    }

    // Nothing to drive (e.g. the host translates the board itself) → no loop.
    if(this.character || this._camera.isActive()) {
      this.startLoop();
    }
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
