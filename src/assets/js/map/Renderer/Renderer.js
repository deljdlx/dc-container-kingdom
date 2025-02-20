class Renderer
{

  /**
   * @type {Element}
   */
  _element;

  /**
   * @type {DomElement}
   */
  dom;

  /**
   * @type {DomElement}
   */
  innerContent;

  /**
   * @type {DomElement}
   */
  domShadow;

  /**
   * @type {DomElement}
   */
  domSprite;

  /**
   * @type {DomElement}
   */
  childDom;

  /**
   * @type {DomElement}
   */
  collisionDom;

  /**
   * @type {DomElement}
   */
  boundingBox;


   /**
   *
   * @param {Element} element
   */
  constructor(element) {
    this._element = element;
    this.dom = document.createElement('div');
    this.dom.classList.add('map-element');

    this.innerContent = document.createElement('div');
    this.innerContent.classList.add('map-element__inner-content');
    this.dom.append(this.innerContent);

    this.domSprite = document.createElement('div');
    this.domSprite.classList.add('map-element__sprite');
    this.dom.append(this.domSprite);
  }

  /**
   * @param {Element|null} referenceElement
   * @returns {DomElement}
   */
  render() {

    const relativeTo = this._element.relativeTo();

    this.dom.style.width = this._element.width() + 'px';
    this.dom.style.height = this._element.height() + 'px';

    let left = this._element.x();
    let top = this._element.y();
    const zIndex = top;

    if(relativeTo) {
      const offsets = relativeTo.getRelativeToOffsets();
      left += offsets.x;
      top += offsets.y;
    }

    this.dom.style.left = left + 'px';
    this.dom.style.top = top + 'px';

    if(!this._element.manualZ) {
      this.dom.style.zIndex = zIndex + this._element.height();
    }

    return this.dom;
  }

  getSprite() {
    return this.domSprite;
  }

  getShadow() {
    return this.domShadow;
  }

  addShadow() {
    this.domShadow = document.createElement('div');
    this.domShadow.classList.add('map-element__shadow');
    this.domShadow.style.width = this.getElement().width() + 'px';
    this.domShadow.style.height = (this.getElement().height() / 3) + 'px';
    this.domShadow.style.top = (this.getElement().height() / 3 * 2)  + 'px';
    this.domShadow.style.left = (4)  + 'px';

    this.dom.prepend(this.domShadow);
    return this.domShadow;
  }

  update() {
    /*
    if(this._element.collided()) {
      this.dom.classList.add('collided');
    }
    else {
      this.dom.classList.remove('collided');
    }
    */
  }

  getDom() {
    return this.dom;
  }

  clear() {
    this.dom.remove();
  }

  getElement() {
    return this._element;
  }

  addClass(className) {
    this.dom.classList.add(className);
  }


  renderBoundingBox() {
    this.boundingBox = document.createElement('div');
    this.boundingBox.classList.add('map-element__bounding-box');
    this.dom.append(this.boundingBox);
  }

  renderCollisionZones() {

    const element = this._element;

    if(this.collisiondDom) {
      return this.collisiondDom;
    }
    this.collisiondDom = document.createElement('div');
    this.collisiondDom.classList.add('map-element__collision-bounding-box');
    this.collisiondDom.style.left = element.getCollisionBoundingBox().x0() + 'px';
    this.collisiondDom.style.top = element.getCollisionBoundingBox().y0() + 'px';
    this.collisiondDom.style.width = element.getCollisionBoundingBox().width() + 'px';
    this.collisiondDom.style.height = element.getCollisionBoundingBox().height() + 'px';

    if(this.dom) {
      this.dom.appendChild(this.collisiondDom);
    }

    element.getCollisionZones().forEach(boundingBox => {
      const collisionDom = document.createElement('div');
      collisionDom.classList.add('map-element__collision-zone');
      collisionDom.style.width = boundingBox.width() + 'px';
      collisionDom.style.height = boundingBox.height() + 'px';
      collisionDom.style.left = boundingBox.x0() + 'px';
      collisionDom.style.top = boundingBox.y0() + 'px';

      boundingBox.dom = collisionDom;

      if(this.dom) {
        this.dom.appendChild(collisionDom);
      }
    });

    element.getChildren().forEach(element => {
      element.renderCollisionZones();
    });

    return this.collisiondDom;
  }

  setInnerHTML(html) {
    this.innerContent.innerHTML = html;
    this.innerContent.style.minWidth = this._element.width() + 'px';
  }
}

