import { Application } from './Application.js';
import { CollisionSystem } from './CollisionSystem.js';
import { EventEmitter } from './EventEmitter.js';
import { Geometry } from './Geometry.js';
import { Renderer } from './Renderer/Renderer.js';

export class Element
{
  data = {};

  _application;

  manualZ = false;

  /**
   * @type {CollisionSystem}
   */
  collision;


  /**
   * @type {Geometry}
   */
  geometry;


  /**
   * @type {Element}
   */
  parent;

  /**
   * @type {Element[]}
   */
  children = [];

  childrenByName = {};

  /**
   * @type {Renderer}
   */
  renderer;

  /**
   * @type {Boolean}
   */
  _needUpdate = false;

  rendered = false;

  _relativeTo = null;

  /**
   * @type {boolean}
   */
  _staticPosition = false;
  _targetX;
  _targetY;
  _targetHitZone = 2;
  _onMoveEnd = () => null;
  _moving = false;
  _moveSpeed = 100;


  _eventPrefix = 'element.';

  /**
   * @type {EventEmitter}
   */
  _events = new EventEmitter();


  constructor(x = null, y = null, width = null, height = null,)
  {

    this._application = Application.mainInstance;


    this.geometry = new Geometry();
    this.setRenderer(new Renderer(this));

    // Owns the (empty) collision bounding box; the outer bounding box is built
    // once the geometry below is set.
    this.collision = new CollisionSystem(this);

    this.x(x);
    this.y(y);
    this.width(width);
    this.height(height);

    this.collision.initBoundingBox();
  }

  getBoard() {
    return this._application.getViewport().getBoard();
  }

  clear() {
    this.getRenderer().clear();
    this.children.forEach(child => {
      child.clear();
    });
  }

  destroy() {
    if(this.parent) {
      this.parent.removeChild(this);
    }

    this.children = [];
    this.childrenByName = {};

    this.getRenderer().clear();
  }

  removeChild(element) {
    this.children = this.children.filter(child => child !== element);
    this.childrenByName = Object.keys(this.childrenByName).reduce((accumulator, name) => {
      if(this.childrenByName[name] !== element) {
        accumulator[name] = this.childrenByName[name];
      }
      return accumulator;
    }, {});
  }



  setRenderer(renderer) {
    this.renderer = renderer;
    this.dom = this.renderer.getDom();
    this.registerEvents();

    return this;
  }

  getDom() {
    return this.dom;
  }

  setInnerHTML(html) {
    this.renderer.setInnerHTML(html);
  }

  addClass(className) {
    this.renderer.addClass(className);
  }


  registerEvents() {
    this.dom.addEventListener('click', (event) => {
      this.handle('element.click', {
        element: this,
        areaX: event.offsetX,
        areaY: event.offsetY,
        originalEvent: event,
      });
    })
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
  getApplication() {
    return this._application;
  }

  setApplication(application) {
    this._application = application;
    return application;
  }
  // ===========================

  /**
   *
   * @param {?boolean} value
   * @returns {boolean}
   */
  staticPosition(value = null) {
    if(value  !== null) {
      this._staticPosition = value;
    }
    return this._staticPosition;
  }

  moveSpeed(value = null) {
    if(value !== null) {
      this._moveSpeed = value;
    }

    return this._moveSpeed;
  }

  isMoving(value = null) {
    if(value !== null) {
      this._moving = value;
    }

    return this._moving;
  }


  update() {
    if(this.isMoving() && this.y() < this._targetY) {
      this.direction = 'down';
      this.y(this.y() + this.moveSpeed());
    }
    else if(this.isMoving() && this.x() < this._targetX) {
      this.direction = 'right';
      this.x(this.x() + this.moveSpeed());
    }

    if(this.parent) {
      this.parent.updateCollisionBoundingBox(this);
    }

    if(this.needUpdate() || this.isMoving()) {
      if(
        Math.abs(this._targetX - this.x()) <= this._targetHitZone
        && Math.abs(this._targetY - this.y()) <= this._targetHitZone
        && this.isMoving()
      ) {
        this._moving = false;
        this._onMoveEnd(this);
      }

      this.getRenderer().update();
      this.getChildren().forEach(element => {
        element.update();
      });
    }
    this.needUpdate(false);
  }


  getParent() {
    return this.parent;
  }


  // ===========================

  relativeTo(element = null) {
    if(element !== null) {
      this._relativeTo = element;
    }

    return this._relativeTo;
  }

  getRelativeToOffsets() {
    if(!this._relativeTo) {
      return {
        x: 0,
        y: 0,
      }
    }

    const offsets = this._relativeTo.getRelativeToOffsets();
    return {
      x: offsets.x  + this.x(),
      y: offsets.y  + this.y(),
    };
  }


  width(value = null) {
    return this.geometry.width(value);
  }

  height(value = null) {
    return this.geometry.height(value);
  }

  x(value = null) {
    return this.geometry.x(value);
  }

  y(value = null) {
    return this.geometry.y(value);
  }

  offsetX() {
    if(this.parent) {
      return this.x() + this.parent.offsetX();
    }

    return this.x();
  }

  offsetY() {
    if(this.parent) {
      return this.y() + this.parent.offsetY();
    }

    return this.y();
  }

  createElement() {
    const element = new Element();
    element.setApplication(this.getApplication());
    this.children.push(element);
    // JDLX_TODO handle childrenByName

    element.setParent(this);
    element.relativeTo(this);

    return element;
  }

  addElement(x = 0, y = 0, element, name) {
    element.setApplication(this.getApplication());
    this.children.push(element);
    this.childrenByName[name] = element;

    element.setParent(this);
    element.relativeTo(this);

    element.x(x);
    element.y(y);

    this.updateCollisionBoundingBox(element);
    this.updateBoudingBox(element);

    if(this.parent) {
      this.parent.updateCollisionBoundingBox(this);
    }

    this.needUpdate(true);
    return element;
  }

  createCollisionZone(x = null, y = null, width = null, height = null, type = 'collision') {
    return this.collision.createCollisionZone(x, y, width, height, type);
  }

  createTriggerZone(x = null, y = null, width = null, height = null) {
    return this.collision.createTriggerZone(x, y, width, height);
  }

  updateCollisionBoundingBox(element) {
    this.collision.updateCollisionBoundingBox(element);
  }

  updateBoudingBox(element) {
    this.collision.updateBoudingBox(element);
  }

  // ===========================
  needUpdate(value = null) {
    if(value !== null) {
      this._needUpdate = value;
      if(this.parent) {
        this.parent.needUpdate(value);
      }
    }

    return this._needUpdate;
  }

  // ===========================

  collided(value = null, type = 'collision') {
    return this.collision.collided(value, type);
  }

  getTrigger(element) {
    return this.collision.getTrigger(element);
  }

  getCollision(element, type = 'collision') {
    return this.collision.getCollision(element, type);
  }

  clearCollision(type = 'collision') {
    return this.collision.clearCollision(type);
  }

  // ===========================

  /**
   * @param {Element} element
   * @returns {Element}
   */
  setParent(element) {
    this.parent = element
    return this.parent;
  }

  getChildren() {
    return this.children;
  }

  getChildByName(name) {
    if(typeof(this.childrenByName[name]) ==='undefined') {
      throw new Error('No element with name ' + name);
    }
    return this.childrenByName[name];
  }

  getAllChildren() {
    const children = [];
    this.getChildren().forEach(parent => {
      children.push(parent);
      // parent.relativeTo(this);

      parent.getAllChildren().forEach(child => {
        // child.relativeTo(parent);
        children.push(child);
      });
    });
    return children;
  }

  getCollisionZones(type = 'collision') {
    return this.collision.getCollisionZones(type);
  }

  getCollisionBoundingBox() {
    return this.collision.getCollisionBoundingBox();
  }

  getBoundingBox() {
    return this.collision.getBoundingBox();
  }


  // ===========================

  /**
   * @returns {Renderer}
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * @returns {Boolean}
   */
  isRendered() {
    return this.rendered;
  }

  render() {
    this.rendered = true;
    // this.renderBoundingBox();
    return this.renderer.render();
  }

  renderBoundingBox() {
    this.renderer.renderBoundingBox();

    this.getChildren().forEach(element => {
      element.renderBoundingBox()
    });
  }

  renderCollisionZones() {
    return this.renderer.renderCollisionZones();
  }
}


