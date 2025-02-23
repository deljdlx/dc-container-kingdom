class Element
{
  data = {};

  _application;

  manualZ = false;
  /**
   * @type {BoundingBox}
   */
  boundingBox;

  _collided = {
    collision: false,
    trigger: false,
  };

  /**
   * @type {Element}
   */
  // collisionZones = [];
  collisionZones = {
    collision: [],
    trigger: [],
  };

  collidedWith = {
    collision: [],
    trigger: [],
  };


  triggerZones = [];



  /**
   * @type {BoundingBox}
   */
   collisionBoundingBox;


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
  _listeners = {};


  constructor(x = null, y = null, width = null, height = null)
  {

    this._application = Application.mainInstance;


    this.geometry = new Geometry();
    this.setRenderer(new Renderer(this));

    // emtpy collision bouding box
    this.collisionBoundingBox = new BoundingBox(this);


    this.x(x);
    this.y(y);
    this.width(width);
    this.height(height);

    this.boundingBox = new BoundingBox(this);
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
    if(typeof(this._listeners[name]) === 'undefined') {
      this._listeners[name] = [];
    }
    this._listeners[name].push(callback);

    return this._listeners[name].length - 1;
  }

  handle(name, data = {}) {
    // console.log('%cElement.js :: 131 =============================', 'color: #f00; font-size: 1rem');
    // console.log(name);
    // console.log(this);
    // console.log(this._listeners);
    if(typeof(this._listeners[name]) !== 'undefined') {
      this._listeners[name].map(callback => {
        callback(data);
      });
    }

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


  update2() {
    if(this.needUpdate()) {
      this.getRenderer().update();

      this.getChildren().forEach(element => {
        element.update();
      });

    }
    this.needUpdate(false);
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

    const zone = new BoundingBox(this);
    zone.x0(x);
    zone.y0(y);
    zone.width(width);
    zone.height(height);

    this.collisionZones[type].push(zone);

    this.collisionBoundingBox.updateWithBoundingBox(zone);

    if(this.parent) {
      this.parent.updateCollisionBoundingBox(this);
    }

    return zone;
  }


  createTriggerZone(x = null, y = null, width = null, height = null) {
    return this.createCollisionZone(x, y, width, height, 'trigger');
  }

  /**
   * @param {Element}
   */
  updateCollisionBoundingBox(element) {
    this.collisionBoundingBox.updateWithRelativeElement(this, element);
    if(this.parent) {
      this.parent.updateCollisionBoundingBox(this);
    }
  }

  /**
   * @param {Element}
   */
  updateBoudingBox(element) {
    const boundingBox = new BoundingBox();
    boundingBox.x0(element.x());
    boundingBox.y0(element.y());

    boundingBox.x1(element.x() + element.getBoundingBox().width());
    boundingBox.y1(element.y() + element.getBoundingBox().height());

    this.boundingBox.updateWithBoundingBox(boundingBox);
    if(this.parent) {
      this.parent.updateBoudingBox(this);
    }
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
    if(value !== null) {
      if(value !== this._collided[type]) {
        this._collided[type] = value;
        if(value === false) {
          this.collisionZones[type].forEach(zone => {
            zone.collided(false, type);
          });
        }

        if(this.parent) {
          this.parent.collided(value, type);
        }
        this.needUpdate(true);
      }
    }

    return this._collided[type];
  }

  getTrigger(element) {
    return this.getCollision(element, 'trigger');
  }


  getCollision(element, type = 'collision') {

    if(element === this) {
      return false;
    }

    const boundingBoxCollided = this.getCollisionBoundingBox().isCollided(
      element.getCollisionBoundingBox()
    );

    if(boundingBoxCollided) {
      const collided = element.collisionZones[type].reduce((collided, zone) => {

        const isCollided = this.getCollisionBoundingBox().isCollided(zone, type);
        if(!collided) {
          collided = isCollided;
        }
        zone.collided(isCollided, type);

        return collided
      }, false);

      if(collided) {

        if(!element.collided(null, type)) {
          this.collidedWith[type].push(element);

          // console.log('%cElement.js :: 403 =============================', 'color: #f00; font-size: 1rem');
          // console.log("ICI");

          this.handle(this._eventPrefix + type, {
            element: this,
            target: element,
          });

          element.handle(this._eventPrefix + type, {
            element: this,
            target: element,
          });
        }

        element.collided(true, type);
        this.collided(true, type);

        return [element];
      }

      const childCollisions = element.getChildren().map(child => {
        const result = this.getCollision(child, type);
        return result;
      }).filter(Boolean).reduce((accumulator, element) => element, []);

      if(childCollisions.length) {
        return childCollisions;
      }
    }
    element.clearCollision(type);

    return false;
  }

  clearCollision(type = 'collision') {

    this.collidedWith[type].forEach(element => {
      this.handle('element.' + type + '.end', {
        element: this,
        target: element,
      });
    });

    this.collidedWith[type].forEach(element => {
      element.handle('element.' + type + '.end', {
        element: element,
        target: this,
      });
    });
    this.collidedWith[type] = [];

    this.collided(false, type);
    this.getCollisionZones(type).forEach(zone => {
      if(zone.dom) {
        zone.collided(false, type);
      }

    });
    this.getChildren().forEach(child => {
      child.clearCollision(type);
    });
  }

  // ===========================

  /**
   * @param {Element} element
   * @returns {Element}
   */
  setParent(element) {
    this.parent = element
    return parent;
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
    return this.collisionZones[type];
  }

  getCollisionBoundingBox() {
    return this.collisionBoundingBox;
  }

  getBoundingBox() {
    return this.boundingBox;
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


