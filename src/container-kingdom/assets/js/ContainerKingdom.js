import { Container } from './Container.js';
import { ContainerView } from './ContainerView.js';
import { ContainerKingdomLayout } from './ContainerKingdomLayout.js';
import { ContainerKingdomRenderer } from './ContainerKingdomRenderer.js';
import { ContainersList } from './ContainersList.js';
import { DockerCompose } from './DockerCompose.js';
import { KingdomHud } from './KingdomHud.js';

export class ContainerKingdom
{
  // Constants
  static LOOP_INTERVAL_MS = 5000;

  consoleContainer;
  /**
   * @type {ContainerKingdomLayout}
   */
  layout;
  viewer;
  console;

  containersList;
  dockerApiClient;

  /**
   * @type {Object<string, Container>}
   */
  containers = {};
  /**
   * @type {Object<string, ContainerView>}
   */
  containerViews = {};
  _previousContainerViews = {};
  containersStats = {};

  _previousContainers = {};
  _loopTimeoutId = null;


  /**
   * @type {Object<string, DockerCompose>}
   */
  composes = {};
  networks = {};

  header;

  /**
   * @type {KingdomHud}
   */
  hud;

  lastContainersChecksum = null;


  constructor(dockerApiClient) {

    this.dockerApiClient = dockerApiClient;
    this.layout = new ContainerKingdomLayout(this);

    // this.containersList = new ContainersList(this);


    this.header = document.querySelector('#header');
    this.hud = new KingdomHud(this, this.header);


    this.init();
  }

  async init() {
    // await this.initConsole();
    this.layout.init();

    this.viewer = new ContainerKingdomRenderer(this, this.layout.getViewport());


    await this.loadContainers();
    this.layout.renderContainersList();
    await this.loadContainersStats();

    await this.viewer.drawContainers(this.containers);
    await this.viewer.drawNetworks(this.containers);
    await this.layout.getViewport().render();
    this.hud.drawNetworksSwitches();

    this.layout.hideLoadingScreen();

    await this.loop();
  }

  getTotalMemoryUsage() {
    return Object.values(this.containers).reduce((acc, container) => {
      const newUsage = acc + container.getMemoryUsage();
      return isNaN(newUsage) ? acc : newUsage;
    }, 0);
  }

  getGlobalCpuUsage() {
    return Object.values(this.containers).reduce((acc, container) => {
      const newUsage =acc + container.getCpuUsage();
      return isNaN(newUsage) ? acc : newUsage;
    }, 0);
  }

  /**
   * @returns {ContainerKingdomLayout}
   */
  getLayout() {
    return this.layout;
  }

  clear() {
    // Stop the loop before clearing
    this.stopLoop();
    Object.values(this.containers).forEach(container => {
      this.containerViews[container.Id]?.stopWatch();
      delete this.containerViews[container.Id];
      delete this.containers[container.Id];
    });
  }

  /**
   * Stop the main loop to prevent memory leaks
   */
  stopLoop() {
    if (this._loopTimeoutId) {
      clearTimeout(this._loopTimeoutId);
      this._loopTimeoutId = null;
    }
  }

  async loadContainersStats() {
    try {
      const stats = await this.dockerApiClient.getAllContainersStats();
      stats.forEach((containerStats) => {
        const containerId = containerStats.id;
        const container = this.containers[containerId];
        if(container) {
          container.setStats(containerStats);
        }
      });

      this.hud.renderClusterInfo();
    } catch (error) {
      console.error('Error loading container stats:', error);
    }
  }

  async loop() {
    const currentChecksum = await this.getChecksum();

    await this.loadContainers();
    await this.loadContainersStats();

    this.layout.renderContainersList();

    const newChecksum = await this.getChecksum();
    if(currentChecksum !== newChecksum) {
      document.location.reload();
    }

    this._loopTimeoutId = setTimeout(() => {
      this.loop();
    }, ContainerKingdom.LOOP_INTERVAL_MS);
  }

  getContainers(toArray = false) {
    if(toArray) {
      return Object.values(this.containers);
    }
    return this.containers;
  }

  /**
   * @param {string} containerId
   * @returns {ContainerView|undefined}
   */
  getContainerView(containerId) {
    return this.containerViews[containerId];
  }

  getCompose(composeName) {
    return this.composes[composeName] || null;
  }

  getComposes() {
    return this.composes;
  }


  getContainerStats(containerId) {
    return this.containersStats[containerId];
  }


  async loadContainers() {
    const containers = await this.dockerApiClient.getContainersDescriptors();

    this._previousContainers = this.containers;
    this._previousContainerViews = this.containerViews;
    this.containers = {};
    this.containerViews = {};

    containers.forEach(containerDescriptor => {
      if(this.containers[containerDescriptor.Id]) {
        return;
      }

      const container = new Container(
        this.dockerApiClient,
        containerDescriptor,
      );
      this.containers[container.Id] = container;
      this.containerViews[container.Id] = new ContainerView(container);

      const networks = container.NetworkSettings.Networks;
      Object.keys(networks).forEach(networkName => {
        if(!this.networks[networkName]) {
          this.networks[networkName] = [];
        }
        this.networks[networkName].push(container);
      });
    });

    const composes = {};

    Object.values(this.containers).forEach(container => {
      const composeName = container.getComposeName();
      if(!composes[composeName]) {
        composes[composeName] = [];
      }
      composes[composeName].push(container);
    });

    const sortedComposes = Object.fromEntries(
      Object.entries(composes)
        .sort(([, containersA], [, containersB]) => containersB.length - containersA.length)
    );
    Object.entries(sortedComposes).forEach(([composeName, composeContainers]) => {
      this.composes[composeName] = new DockerCompose(composeName);
      composeContainers.forEach(container => {
        this.composes[composeName].addContainer(container);
      });
    });

    const descriptor = {
      ids: containers.map(container => container.Id),
      networks: containers.map(container => container.NetworkSettings.Networks),
      labels: containers.map(container => container.Labels),
      status: containers.map(container => container.ImageID),
    };

    const newChecksum = await this.getChecksum(descriptor);
    if(this.lastContainersChecksum === null) {
      this.lastContainersChecksum = newChecksum
    }

    if(this.lastContainersChecksum !== newChecksum) {
      this.cleanContainers();
      this.handleNewContainers();
      return;
    }
    this.lastContainersChecksum = newChecksum;
  }

  handleNewContainers() {
    // Placeholder for future implementation
  }

  cleanContainers() {
    Object.values(this._previousContainers).forEach(container => {
      if(!this.containers[container.Id]) {
        this._previousContainerViews[container.Id]?.stopWatch();
        const element = container.getElement();
        if (element) {
          element.destroy();
        }
      }
    });
  }


  /**
   * @returns {Object<string, Array<Container>>}
   */
  getNetworks() {
    return this.networks;
  }

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

  async getChecksum(object) {
    const json = JSON.stringify(object);

    const encoder = new TextEncoder();
    const data = encoder.encode(json);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    const hash = [...new Uint8Array(hashBuffer)]
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");

    return hash;
  }
}
