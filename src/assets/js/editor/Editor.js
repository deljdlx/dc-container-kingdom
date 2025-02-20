class Editor
{


  selectedSprite = 'Tree00';
  application;

  spritePanel;

  spriteContainers = [];

  currentArea;

  constructor(application) {

    this.application = application;


    this.spritePanel = document.querySelector('#sprite-panel');

    this.initializeSpritePanel();
    this.initializeAreaEvents();
    this.initializeMap();

  }

  initializeSpritePanel() {
    this.application.getRegisteredElements().forEach(elementName => {
      console.log('%cEditor.js :: 29 =============================', 'color: #f00; font-size: 1rem');
      console.log(elementName);
      this.registerSprite(elementName);
    });
  }

  registerSprite(spriteName) {
    const spriteContainer = document.createElement('div');
    spriteContainer.classList.add('editor-sprite-container');

    const sprite = this.application.instanciate(spriteName);
    const element = sprite.render();
    spriteContainer.style.width = sprite.getBoundingBox().width() + 'px';
    spriteContainer.style.height = sprite.getBoundingBox().height() + 'px';
    spriteContainer.append(element);

    sprite.getAllChildren().forEach(child => {
      element.append(child.render());
      // this.dom.append(child.getDom());
    });

    spriteContainer.addEventListener('click', () => {
      this.selectedSprite = spriteName;
      this.spriteContainers.forEach(spriteContainer => {
        spriteContainer.classList.remove('selected');
      });
      spriteContainer.classList.add('selected');
    });

    this.spriteContainers.push(spriteContainer);
    this.spritePanel.append(spriteContainer);

  }

  generateUUID() {
    let uuid = "";
    for (let i = 0; i < 32; i++) {
      uuid += Math.floor(Math.random() * 16).toString(16);
    }
    uuid =
      uuid.substr(0, 8) +
      "-" +
      uuid.substr(8, 4) +
      "-" +
      uuid.substr(12, 4) +
      "-" +
      uuid.substr(16, 4) +
      "-" +
      uuid.substr(20, 12);
    return uuid;
  }



  initializeAreaEvents() {

    this.application.addEventListener('area.click', (event) => {
      console.log('%ceditor-bootstrap.js :: 52 =============================', 'color: #f00; font-size: 1rem');
      const area = event.area;
      this.currentArea = area;


      const sprite = this.application.instanciate(this.selectedSprite);

      const x = event.areaX - sprite.width() / 2;
      const y = event.areaY - sprite.height() / 2;

      const element = area.addElement(
        x,
        y,
        sprite,
        this.generateUUID(),
      );

      area.getBoard().getRenderer().update();
      this.makeElementEditable(element);
      this.saveArea(area);
    });
  }

  initializeMap() {
    const viewport = this.application.getViewport();
    const board = viewport.getBoard();

    const areas = board.getAreas();

    for(let x in areas) {
      for(let y in areas[x]) {
        const area = areas[x][y];
        console.log(area);

        const elements = area.getChildren();
        elements.forEach(element => {
          this.makeElementEditable(element);
        });
      }
    }
  }

  makeElementEditable(element) {

    const draggable = new DraggableElement(element);
    draggable.addEventListener('mouseUp', data => {
      console.log('%cEditor.js :: 106 =============================', 'color: #f00; font-size: 1rem');
      // console.log(data);
      console.log(element.getParent());
      this.saveArea(element.getParent());
    });

    draggable.addEventListener('contextmenu', (data) => {
      console.log('%cEditor.js :: 128 =============================', 'color: #f0f; font-size: 1rem');
      console.log("contextmenu");
      console.log(data);
      data.event.preventDefault();
      data.element.destroy();
      this.saveArea(element.getParent());
    });

  }

  async saveArea(area) {

    const url = './backend/save.php';
    const data = {
      data: area.toJSON(),
      x: area.getCoordX(),
      y: area.getCoordY(),
    };

    console.log(data);


    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });


    // return response.json(); // parses JSON response into native JavaScript objects
  }


}

