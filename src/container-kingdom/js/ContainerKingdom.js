import { ContainerKingdomLayout } from './ContainerKingdomLayout.js';
import { ContainerKingdomRenderer } from './ContainerKingdomRenderer.js';
import { ContainerRepository } from './ContainerRepository.js';
import { KingdomHud } from './KingdomHud.js';

/**
 * Top-level orchestrator: wires the data layer ({@link ContainerRepository}),
 * the map renderer, the layout and the header HUD together, and runs the
 * refresh loop. Holds no Docker state itself — it delegates reads to the
 * repository so the renderer/layout/HUD keep calling `application.getX()`.
 */
export class ContainerKingdom
{
  static LOOP_INTERVAL_MS = 5000;

  /**
   * @type {ContainerKingdomLayout}
   */
  layout;
  viewer;
  dockerApiClient;

  /**
   * @type {ContainerRepository}
   */
  repository;

  header;

  /**
   * @type {KingdomHud}
   */
  hud;

  _loopTimeoutId = null;
  _loopEnabled = true;

  /** @type {boolean} whether the last poll reached the Docker daemon */
  _dockerReachable = true;


  constructor(dockerApiClient) {
    this.dockerApiClient = dockerApiClient;
    this.repository = new ContainerRepository(dockerApiClient);
    this.repository.onContainersChanged = () => {
      this.refreshKingdom();
    };
    this.layout = new ContainerKingdomLayout(this);

    this.header = document.querySelector('#header');
    this.hud = new KingdomHud(this, this.header);

    this.init();
  }

  async init() {
    this.layout.init();

    this.viewer = new ContainerKingdomRenderer(this, this.layout.getViewport());

    // A daemon that is already down must not block the boot: the kingdom comes
    // up empty but usable, and the HUD says why.
    const reconciled = await this.repository.loadContainers();
    this.layout.renderContainersList();
    const statsLoaded = await this.loadContainersStats();
    this._setDockerReachable(reconciled && statsLoaded);

    await this.viewer.drawContainers();
    this.viewer.drawNetworks();
    await this.layout.getViewport().render();
    this.layout.getViewport().renderDebug(); // draws zone boxes only when ?debug=1
    this.hud.drawNetworksSwitches();

    this.layout.hideLoadingScreen();

    await this.loop();
  }

  /**
   * Bring the map back in line with the container set, in place — no page
   * reload, so zoom, panning and the open console survive.
   */
  async refreshKingdom() {
    await this.viewer.syncContainers();
    // Elements added after start-up live in the scene graph but have no DOM
    // until the viewport paints them — the first draw is rendered by `init`,
    // every later one needs this.
    await this.layout.getViewport().render();
    this.hud.drawNetworksSwitches();
  }

  /**
   * @returns {ContainerKingdomLayout}
   */
  getLayout() {
    return this.layout;
  }

  /**
   * @returns {Promise<boolean>} true when fresh stats landed
   */
  async loadContainersStats() {
    const loaded = await this.repository.loadContainersStats();
    if (loaded) {
      this.hud.renderClusterInfo();
      // Push the fresh figures onto the map. Stats only move when this load
      // lands, so there is nothing for the views to poll in between.
      this.repository.getContainerViews().forEach(view => view.refresh());
    }
    return loaded;
  }

  /**
   * Track whether the daemon answers, and surface it in the HUD.
   *
   * While it does not, the map holds its last known state — frozen figures read
   * as live ones unless something says otherwise. Only redraws on a change, as
   * the loop calls this on every tick.
   * @param {boolean} reachable
   */
  _setDockerReachable(reachable) {
    if (this._dockerReachable === reachable) {
      return;
    }
    this._dockerReachable = reachable;
    this.hud.renderConnectionStatus(reachable);
  }

  async loop() {
    if (!this._loopEnabled) {
      return;
    }

    try {
      // A failed reconciliation left the previous state in place: skip the rest
      // of the tick rather than paint half-refreshed data over it.
      const reconciled = await this.repository.loadContainers();
      if (!reconciled) {
        this._setDockerReachable(false);
        return;
      }

      const statsLoaded = await this.loadContainersStats();
      this._setDockerReachable(statsLoaded);
      this.layout.renderContainersList();
    } catch (error) {
      console.error('Container refresh loop failed:', error);
    } finally {
      if (this._loopEnabled) {
        this._loopTimeoutId = setTimeout(() => {
          this.loop();
        }, ContainerKingdom.LOOP_INTERVAL_MS);
      }
    }
  }

  /**
   * Stop the main loop to prevent memory leaks.
   */
  stopLoop() {
    this._loopEnabled = false;
    if (this._loopTimeoutId) {
      clearTimeout(this._loopTimeoutId);
      this._loopTimeoutId = null;
    }
  }

  clear() {
    this.stopLoop();
    this.repository.clear();
  }

  // --- data facade (read by the renderer, layout and HUD) ---

  getContainers(toArray = false) {
    return this.repository.getContainers(toArray);
  }

  /**
   * @param {string} containerId
   * @returns {import('./ContainerView.js').ContainerView|undefined}
   */
  getContainerView(containerId) {
    return this.repository.getContainerView(containerId);
  }

  getCompose(composeName) {
    return this.repository.getCompose(composeName);
  }

  getComposes() {
    return this.repository.getComposes();
  }

  getNetworks() {
    return this.repository.getNetworks();
  }

  getTotalMemoryUsage() {
    return this.repository.getTotalMemoryUsage();
  }

  getGlobalCpuUsage() {
    return this.repository.getGlobalCpuUsage();
  }

  // --- view / navigation facade ---

  async gotoContainerUrl(container) {
    const demoUrl = container.getDemoUrl();
    if (demoUrl) {
      document.querySelector('#iframe-container').classList.remove('hidden');
      document.querySelector('#iframe-preview').src = '//' + demoUrl;
    }
  }

  async focusOnContainer(container) {
    this.layout.focusOnContainer(container);
  }

  drawRandomFlowers(quantity) {
    this.layout.drawRandomFlowers(quantity);
  }

  getContainerLogs(container) {
    return this.dockerApiClient.getContainerLogs(container.Id);
  }

  zoom(zoomLevel) {
    this.layout.zoom(zoomLevel);
  }
}
