import { Container } from './Container.js';
import { ContainerKingdomLayout } from './ContainerKingdomLayout.js';
import { ContainerKingdomRenderer } from './ContainerKingdomRenderer.js';
import { ContainersList } from './ContainersList.js';
import { DockerCompose } from './DockerCompose.js';

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
  containersStats = {};

  _previousContainers = {};
  _loopTimeoutId = null;


  /**
   * @type {Object<string, DockerCompose>}
   */
  composes = {};
  networks = {};

  selectedNetworks = {};

  header;

  lastContainersChecksum = null;


  constructor(dockerApiClient) {

    this.dockerApiClient = dockerApiClient;
    this.layout = new ContainerKingdomLayout(this);

    // this.containersList = new ContainersList(this);


    this.header = document.querySelector('#header');


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
    this.drawNetworksSwitches();

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

  renderClusterInfo() {
    let element = document.querySelector('.cluster-info');
    if(!element) {
      element = document.createElement('div');
      element.classList.add('cluster-info');
      this.header.append(element);
    }

    let memoryUsage = this.getTotalMemoryUsage();
    memoryUsage = Math.round(memoryUsage / 1024 / 1024 * 100) / 100 + ' MB';

    element.innerHTML = '';

    let memoryUsageContainer = document.createElement('div');
    memoryUsageContainer.classList.add('memory-usage');
    memoryUsageContainer.innerHTML = 'Memory usage: ' + memoryUsage;
    element.append(memoryUsageContainer);

    let cpuUsage = this.getGlobalCpuUsage();
    cpuUsage = Math.round(cpuUsage * 100) / 100 + '%';

    let cpuUsageContainer = document.createElement('div');
    cpuUsageContainer.classList.add('cpu-usage');
    cpuUsageContainer.innerHTML = 'CPU usage: ' + cpuUsage;
    element.append(cpuUsageContainer);
  }

  clear() {
    // Stop the loop before clearing
    this.stopLoop();
    Object.values(this.containers).forEach(container => {
      container.stopWatch();
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

      this.renderClusterInfo();
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
    this.containers = {};

    containers.forEach(containerDescriptor => {
      if(this.containers[containerDescriptor.Id]) {
        return;
      }

      const container = new Container(
        this.dockerApiClient,
        containerDescriptor,
      );
      this.containers[container.Id] = container;

      const networks = container.NetworkSettings.Networks;
      Object.keys(networks).forEach(networkName => {
        if(!this.networks[networkName]) {
          this.networks[networkName] = [];
        }
        this.selectedNetworks[networkName] = true;
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
        container.stopWatch();
        const element = container.getElement();
        if (element) {
          element.destroy();
        }
      }
    });
  }


  drawNetworksSwitches() {
    let container = document.querySelector('.networks-switches');
    if(!container) {
      container = document.createElement('div');
      container.classList.add('networks-switches');
    }
    container.innerHTML = '';
    const caption = document.createElement('h2');
    caption.innerHTML = 'Networks';
    container.append(caption);


    Object.keys(this.networks).forEach(networkName => {
      const label = document.createElement('label');
      label.classList.add('network-switch');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      label.append(checkbox);
      label.append(networkName);
      container.append(label);

      checkbox.addEventListener('change', (event) => {
        this.handleNetworkSwitch(networkName, event.target.checked);
      });
    });
    this.header.append(container);
  }

  handleNetworkSwitch(networkName, checked) {
    const roads = document.querySelectorAll('.map-element.network.network--' + networkName);
    roads.forEach(road => {
      if(checked) {
        road.classList.remove('hidden');
        this.selectedNetworks[networkName] = true;
      } else {
        road.classList.add('hidden');
        this.selectedNetworks[networkName] = false;
      }
    });

    const containers = document.querySelectorAll('.map-element.container.network--' + networkName);
    containers.forEach(containerElement => {
      let mustBeHidden = true;
      Object.keys(this.selectedNetworks).forEach(netName => {
        if(this.selectedNetworks[netName] && containerElement.classList.contains('network--' + netName)) {
          mustBeHidden = false;
        }
      });
      if(mustBeHidden) {
        containerElement.classList.add('hidden');
      }
      else {
        containerElement.classList.remove('hidden');
      }
    });

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
