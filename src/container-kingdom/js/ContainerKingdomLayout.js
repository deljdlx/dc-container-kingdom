import {
  Application,
  Fence00H,
  Fence00V,
  FenceGroup00,
  Flower00,
  Fountain00,
  GameConsole,
  Ground00,
  House00,
  House01,
  Man00,
  Man01,
  Man02,
  Man03,
  Man04,
  Sunflower00,
  Tree00,
  Woman00,
  Woman01,
  Woman02,
} from '../../engine/index.js';
import { ContainersList } from './ContainersList.js';
import { Log } from './Log.js';

export class ContainerKingdomLayout
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

  /**
   * Pan and zoom live in the engine's {@link ViewportTransform} — the single
   * owner of world ↔ screen. Holding a second copy here is what let the FX
   * canvas paint at the wrong place: it followed the camera while the map
   * followed this pan.
   * @type {ViewportTransform|null} resolved lazily, once the engine exists
   */
  _viewportTransform = null;

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
    this.drawRandomFlowers(100);
    this.makeViewportZoomable();
    this.makeViewportDraggable();
  }

  /**
   * @returns {ViewportTransform} the shared world ↔ screen transform
   */
  getTransform() {
    if (!this._viewportTransform) {
      this._viewportTransform = this.getViewport().getTransform();
    }
    return this._viewportTransform;
  }

  hideLoadingScreen() {
    document.querySelector('#loading-screen').classList.add('hidden');
  }

  async focusOnContainer(container) {
    const absoluteX = container.getElement().x();
    const absoluteY = container.getElement().y();
    const board = document.querySelector('#viewport').firstElementChild;
    if (!board) return;

    const transform = this.getTransform();
    transform.scale(1.5);
    transform.setOffset(
      window.innerWidth / 2 - transform.scale() * absoluteX,
      window.innerHeight / 2 - transform.scale() * absoluteY - container.getElement().height(),
    );
    this._applyTransform(board);
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

    const view = this.application.getContainerView(container.getId());
    this.containerInfoContainer.appendChild(view.getHtmlInfo());

    this.showConsole();
    this.console.scrollToBottom();
  }

  drawRandomFlowers(quantity) {
    const board = this.getViewport().getBoard();
    for(let i = 0; i < quantity ; i++) {
      const x = Math.random() * window.innerWidth * 2;
      const y = Math.random() * window.innerHeight * 3;

      const area = board.getAreaAt(0, 0);
      area.addElement(x, y, new Sunflower00());
    }
  }

  renderContainersList() {
    this.containersList.clear();
    this.containersList.load(this.application.getComposes());
  }

  zoom(zoom) {
    const board = document.querySelector('#viewport').firstElementChild;
    if (!board) return;

    this.getTransform().scale(zoom);
    this._applyTransform(board);
  }

  /**
   * Apply the current pan/scale state as a single CSS transform on the board.
   * The origin and the CSS string come from the shared transform; clearing
   * left/top stays here — it undoes what the element renderer may have written.
   *
   * @param {HTMLElement} board
   */
  _applyTransform(board) {
    this.getTransform().applyTo(board);
    board.style.left = '';
    board.style.top = '';
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
    this.rpgEngine.registerElement('Woman02', Woman02);
    this.rpgEngine.registerElement('Man00', Man00);
    this.rpgEngine.registerElement('Man01', Man01);
    this.rpgEngine.registerElement('Man02', Man02);
    this.rpgEngine.registerElement('Man03', Man03);
    this.rpgEngine.registerElement('Man04', Man04);

    this.rpgEngine.registerElement('Flower00', Flower00);
    this.rpgEngine.registerElement('Tree00', Tree00);
    this.rpgEngine.registerElement('Sunflower00', Sunflower00);
    this.rpgEngine.registerElement('Ground00', Ground00);

    this.rpgEngine.addEventListener('map.update', () => {

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
    const viewport = document.querySelector('#viewport');
    /** @type {Map<number, {x: number, y: number}>} Active pointer positions, keyed by pointerId. */
    const activePointers = new Map();
    /** @type {{x: number, y: number, panX: number, panY: number} | null} */
    let panStart = null;
    /** @type {{dist: number, midX: number, midY: number, panX: number, panY: number, scale: number} | null} */
    let pinchStart = null;
    let gestureHasMoved = false;

    viewport.addEventListener('pointerdown', (e) => {
      viewport.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const transform = this.getTransform();
      if (activePointers.size === 1) {
        panStart = { x: e.clientX, y: e.clientY, panX: transform.offsetX(), panY: transform.offsetY() };
        gestureHasMoved = false;
      } else if (activePointers.size === 2) {
        const pts = [...activePointers.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        // Frozen: the anchor is converted against the state the fingers landed
        // on, while the live transform keeps moving under them.
        pinchStart = { dist, midX, midY, at: transform.clone() };
        panStart = null;
      }
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const board = viewport.firstElementChild;
      if (!board) return;

      const transform = this.getTransform();
      if (activePointers.size >= 2 && pinchStart) {
        const pts = [...activePointers.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const newScale = Math.min(3, Math.max(0.1, pinchStart.at.scale() * (dist / pinchStart.dist)));
        // Keep the pinch midpoint fixed in world space while scaling.
        const worldMid = pinchStart.at.screenToWorld(pinchStart.midX, pinchStart.midY);
        transform.scale(newScale);
        transform.setOffset(midX - worldMid.x * newScale, midY - worldMid.y * newScale);
        this._applyTransform(board);
        gestureHasMoved = true;
      } else if (activePointers.size === 1 && panStart) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        if (!gestureHasMoved && Math.hypot(dx, dy) > 5) {
          gestureHasMoved = true;
        }
        if (gestureHasMoved) {
          transform.setOffset(panStart.panX + dx, panStart.panY + dy);
          this._applyTransform(board);
        }
      }
    });

    const onPointerEnd = (e) => {
      if (gestureHasMoved) {
        // Suppress the click that would fire after a drag gesture
        viewport.addEventListener('click', (ce) => ce.stopPropagation(), { capture: true, once: true });
      }
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchStart = null;
      if (activePointers.size === 0) {
        panStart = null;
        gestureHasMoved = false;
      }
    };

    viewport.addEventListener('pointerup', onPointerEnd);
    viewport.addEventListener('pointercancel', onPointerEnd);
  }


  makeViewportZoomable() {
    const viewport = document.querySelector('#viewport');
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const board = viewport.firstElementChild;
      if (!board) return;

      const transform = this.getTransform();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.min(3, Math.max(0.1, transform.scale() + delta));

      // Zoom centred on the cursor. `clientX` is treated as viewport space,
      // which holds only because #viewport starts at the page origin — an
      // inherited assumption, preserved deliberately.
      const world = transform.screenToWorld(e.clientX, e.clientY);
      transform.scale(newScale);
      transform.setOffset(e.clientX - world.x * newScale, e.clientY - world.y * newScale);

      this._applyTransform(board);
    }, { passive: false });
  }
}
