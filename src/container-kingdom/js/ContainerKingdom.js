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


  constructor(dockerApiClient) {
    this.dockerApiClient = dockerApiClient;
    this.repository = new ContainerRepository(dockerApiClient);
    this.repository.onContainersChanged = () => {
      document.location.reload();
    };
    this.layout = new ContainerKingdomLayout(this);

    this.header = document.querySelector('#header');
    this.hud = new KingdomHud(this, this.header);

    this.init();
  }

  async init() {
    this.layout.init();

    this.viewer = new ContainerKingdomRenderer(this, this.layout.getViewport());

    await this.repository.loadContainers();
    this.layout.renderContainersList();
    await this.loadContainersStats();

    await this.viewer.drawContainers();
    this.viewer.drawNetworks();
    await this.layout.getViewport().render();
    this.layout.getViewport().renderDebug(); // draws zone boxes only when ?debug=1
    this.hud.drawNetworksSwitches();

    this.layout.hideLoadingScreen();

    await this.loop();
  }

  /**
   * @returns {ContainerKingdomLayout}
   */
  getLayout() {
    return this.layout;
  }

  async loadContainersStats() {
    const loaded = await this.repository.loadContainersStats();
    if (loaded) {
      this.hud.renderClusterInfo();
      // Push the fresh figures onto the map. Stats only move when this load
      // lands, so there is nothing for the views to poll in between.
      this.repository.getContainerViews().forEach(view => view.refresh());
    }
  }

  async loop() {
    if (!this._loopEnabled) {
      return;
    }

    try {
      await this.repository.loadContainers();
      await this.loadContainersStats();
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
