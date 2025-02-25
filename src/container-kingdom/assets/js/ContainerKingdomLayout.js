class ContainerKingdomLayout
{

  /**
   * @type {ContainerKingdom}
   */
  application = null;

  /**
   * @type {HTMLElement}
   */
  iframeContainer = null;

  /**
   * @type {HTMLElement}
   */
  containerInfoContainer = null;


  /**
   * @type {HTMLElement}
   */
  consoleContainer = null;

  /**
   * @type {ContainersList}
   */
  containersList = null;

  /**
   * @type {Application}
   */
  rpgEngine = null;

  /**
   * @type {GameConsole}
   */
  console = null;

  constructor(application) {
    this.application = application;
    this.containersList = new ContainersList(this.application);
    // this.init();
  }

  async init() {
    this.containerInfoContainer = document.querySelector('.console-container .container-info');
    this.iframeContainer = document.querySelector('#iframe-container');
    this.initRpgEngine();
    this.initConsole();
    this.makeViewportZoomable();
    this.makeViewportDraggable()
  }

  async focusOnContainer(container) {
    const absoluteX = container.getElement().x();
    const absoluteY = container.getElement().y();

    const board = document.querySelector('#viewport').firstElementChild;

    let moveX = (window.innerWidth / 2 - absoluteX) * 1.5;
    let moveY = (window.innerHeight / 2 - absoluteY) * 1.5 - container.getElement().height();

    board.style.left = moveX + 'px';
    board.style.top = moveY + 'px';

    board.style.transform = 'scale(1.5)';
  }


  initConsole() {
    this.console = new GameConsole(this.getRpgEngine(), '#game-console');
    this.console.addEntry('<em>Hello my friend, what can I do for you ?</em>');

    this.consoleContainer = document.querySelector('.console-container')

    const closeTrigger = document.querySelector('#close-console-container');
    closeTrigger.addEventListener('click', () => {
      this.consoleContainer.classList.add('hidden');
    });
  }

  showConsole() {
    this.consoleContainer.classList.remove('hidden');
  }

  async handleClickOnContainer(container) {
    this.console.clear();
    const buffer = await this.application.getContainerLogs(container);
    const log = new Log(buffer)
    const entries = log.getEntries();

    entries.map(logEntry => {
      this.console.addEntry(logEntry.getElement());
    });

    this.containerInfoContainer.innerHTML = '';

    this.containerInfoContainer.innerHTML = container.getHtmlInfo();

    this.showConsole();
    this.console.scrollToBottom();
  }

  drawRandomFlowers(quantity) {
    const board = this.application.rpgEngine.getViewport().getBoard();
    for(let i = 0; i < quantity ; i++) {
      const x = Math.random() * 1800;
      const y = Math.random() * window.innerHeight;

      const area = board.getAreaAt(0, 0);
      area.addElement(x, y, new Sunflower00());
    }
  }

  renderContainersList() {
    this.containersList.clear();
    this.containersList.load(this.application.composes);
  }

  zoom(zoom) {
    const board = document.querySelector('#viewport').firstElementChild;
    if(!board) {
      return;
    }

    board.style.transform = `scale(${zoom})`;
  }

  showIframe(url) {
    this.iframeContainer.classList.remove('hidden');
    document.querySelector('#iframe-preview').src = '//' + url;
  }

  hideIframe() {
    this.iframeContainer.classList.add('hidden');
  }

  getRpgEngine() {
    return this.rpgEngine;
  }

  getViewport() {
    return this.rpgEngine.getViewport();
  }

  async initRpgEngine() {
    const MAP_CONFIGURATION = {
      width: window.innerWidth,
      height: window.innerHeight - 50,
    }

    this.rpgEngine = new Application(
      '#viewport',
      MAP_CONFIGURATION.width,
      MAP_CONFIGURATION.height,
      MAP_CONFIGURATION.width,
      MAP_CONFIGURATION.height,
      // MAP_CONFIGURATION.width / 2,
      // MAP_CONFIGURATION.height / 2,
    );

    this.rpgEngine.registerElement('FenceGroup00', FenceGroup00);
    this.rpgEngine.registerElement('Fence00H', Fence00H);
    this.rpgEngine.registerElement('Fence00V', Fence00V);

    this.rpgEngine.registerElement('House00', House00);
    this.rpgEngine.registerElement('House01', House01);
    this.rpgEngine.registerElement('Fountain00', Fountain00);

    this.rpgEngine.registerElement('Woman00', Woman00);
    this.rpgEngine.registerElement('Woman01', Woman01);
    this.rpgEngine.registerElement('Woman01', Woman02);
    this.rpgEngine.registerElement('Man00', Man00);

    this.rpgEngine.registerElement('Flower00', Flower00);
    this.rpgEngine.registerElement('Tree00', Tree00);
    this.rpgEngine.registerElement('Sunflower00', Sunflower00);
    this.rpgEngine.registerElement('Ground00', Ground00);

    this.rpgEngine.addEventListener('map.update', (event) => {

    });

    document.querySelector('#close-iframe-container').addEventListener('click', () => {
      document.querySelector('#iframe-container').classList.add('hidden');
    });


    // collision are disabled ; maybe later
    // this.rpgEngine.addEventListener('element.collision', (event) => {
    //   event.target.getRenderer().getDom().classList.add('collided');
    //   event.target.getRenderer().getDom().classList.add('shake');
    //   setTimeout(() => {
    //     event.target.getRenderer().getDom().classList.remove('shake');
    //   }, 500);
    // });


    this.rpgEngine.addEventListener('element.click', async (event) => {

      if(!event.element.data.container) {
        return;
      }
      await this.handleClickOnContainer(event.element.data.container);
    });

    this.rpgEngine.addEventListener('element.collision.end', (event) => {
      event.target.getRenderer().getDom().classList.remove('collided');
    });

    this.rpgEngine.addEventListener('element.trigger', (event) => {
      event.target.getRenderer().getDom().classList.add('collided');
    });

    this.rpgEngine.addEventListener('element.trigger.end', (event) => {
      event.target.getRenderer().getDom().classList.remove('collided');
    });

    const viewport = this.rpgEngine.getViewport();
    const board = viewport.getBoard();

    board.initialize();

    viewport.render();
    viewport.run();
  }

  makeViewportDraggable() {
    document.querySelector('#viewport').addEventListener('mousedown', (event) => {
      const firstChild = document.querySelector('#viewport').firstElementChild;
      if (!firstChild) {
          return;
      }

      const offsetX = event.clientX - firstChild.offsetLeft;
      const offsetY = event.clientY - firstChild.offsetTop;

      function onMouseMove(event) {
          firstChild.style.left = (event.clientX - offsetX) + 'px';
          firstChild.style.top = (event.clientY - offsetY) + 'px';
      }

      document.body.addEventListener('mousemove', onMouseMove);

      document.body.addEventListener('mouseup', () => {
          document.body.removeEventListener('mousemove', onMouseMove);
      }, { once: true });
    });
  }


  makeViewportZoomable() {
    document.querySelector('#viewport').addEventListener('wheel', (event) => {
      const board = document.querySelector('#viewport').firstElementChild;
      if(!board) {
        return;
      }

      // JDLX_TODO : Fix zoom origin
      // const clientX = event.clientX;
      // const clientY = event.clientY;
      // const offsetX = board.offsetLeft;
      // const offsetY = board.offsetTop;
      // const savedTransformOrigin = board.style.transform;
      // board.style.transformOrigin = `${clientX - offsetX}px ${clientY - offsetY}px`;

      const scale = board.style.transform.match(/scale\((.*)\)/);
      let currentScale = 1;

      if(scale) {
        currentScale = parseFloat(scale[1]);
      }

      if(event.deltaY > 0) {
        if(currentScale <= 0.1) {
          return;
        }
        board.style.transform = `scale(${parseFloat(currentScale) - 0.05})`;
      } else {
        if(currentScale >= 3) {
          return;
        }
        board.style.transform = `scale(${parseFloat(currentScale) + 0.05})`;
      }

      // JDLX_TODO : Fix zoom origin
      // board.style.transformOrigin = savedTransformOrigin;

    });
  }
}
