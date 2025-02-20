class DraggableElement
{

  element;
  draggable;

  _listeners = {};


  constructor(element)
  {
    this.element = element

    const dom = this.element.getDom();

    dom.style.width = element.getBoundingBox().width() + 'px';
    dom.style.height = element.getBoundingBox().height() + 'px';

    this.draggable = new Draggable(dom);


    this.draggable.addEventListener('mouseMove', (data) => {

      if(!this.element.getAllChildren().length && ! this.element.manualZ) {
        const zIndex = parseInt(this.element.getDom().style.top);
        this.element.getDom().style.zIndex = zIndex + this.element.height();
      }


      this.element.getAllChildren().forEach(element => {
        element.getDom().style.left = parseInt(this.element.getDom().style.left) + element.x() + 'px';
        element.getDom().style.top =  parseInt(this.element.getDom().style.top) + element.y() + 'px';

        if(!element.manualZ) {
          element.getDom().style.zIndex = parseInt(element.getDom().style.top) + element.height();
        }
      });
    });



    this.draggable.addEventListener('mouseUp', (data) => {
      this.element.x(
        parseInt(this.element.getDom().style.left)
      );

      this.element.y(
        parseInt(this.element.getDom().style.top)
      );

      this.handle('mouseUp', {
        element: element
      });
    });

    this.draggable.addEventListener('contextmenu', (event) => {
      console.log('%cDraggableElement.js :: 57 =============================', 'color: #f00; font-size: 1rem');
  ;
      this.handle('contextmenu', {
        event: event,
        element: element
      });

    });
  }


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
  }
}
