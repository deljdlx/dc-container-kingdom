import { Container } from './Container.js';
import { ContainerView } from './ContainerView.js';
import { DockerCompose } from './DockerCompose.js';
import { sha256 } from './sha256.js';

/**
 * Owns the Docker-derived state of the kingdom and keeps it in sync.
 *
 * Fetches container descriptors and stats through the Docker client, builds the
 * {@link Container} models (+ their {@link ContainerView}) and derived indexes
 * (per-network, per-compose), and detects container-set changes via a checksum.
 * No DOM — {@link ContainerKingdom} orchestrates rendering around it.
 */
export class ContainerRepository {
  dockerApiClient;

  /** @type {Object<string, Container>} */
  containers = {};
  /** @type {Object<string, ContainerView>} */
  containerViews = {};
  _previousContainers = {};
  _previousContainerViews = {};

  /** @type {Object<string, DockerCompose>} */
  composes = {};
  /** @type {Object<string, Array<Container>>} */
  networks = {};

  lastContainersChecksum = null;

  constructor(dockerApiClient) {
    this.dockerApiClient = dockerApiClient;
  }

  /**
   * Fetch descriptors and rebuild the container/view/network/compose indexes.
   * When the set of containers changed, prune the vanished ones.
   */
  async loadContainers() {
    const containers = await this.dockerApiClient.getContainersDescriptors();

    this._previousContainers = this.containers;
    this._previousContainerViews = this.containerViews;
    this.containers = {};
    this.containerViews = {};

    containers.forEach(containerDescriptor => {
      if (this.containers[containerDescriptor.Id]) {
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
        if (!this.networks[networkName]) {
          this.networks[networkName] = [];
        }
        this.networks[networkName].push(container);
      });
    });

    this._rebuildComposes();

    const descriptor = {
      ids: containers.map(container => container.Id),
      networks: containers.map(container => container.NetworkSettings.Networks),
      labels: containers.map(container => container.Labels),
      status: containers.map(container => container.ImageID),
    };

    const newChecksum = await sha256(descriptor);
    if (this.lastContainersChecksum === null) {
      this.lastContainersChecksum = newChecksum;
    }

    if (this.lastContainersChecksum !== newChecksum) {
      this.cleanContainers();
      this.handleNewContainers();
      return;
    }
    this.lastContainersChecksum = newChecksum;
  }

  _rebuildComposes() {
    const grouped = {};
    Object.values(this.containers).forEach(container => {
      const composeName = container.getComposeName();
      if (!grouped[composeName]) {
        grouped[composeName] = [];
      }
      grouped[composeName].push(container);
    });

    const sorted = Object.fromEntries(
      Object.entries(grouped)
        .sort(([, containersA], [, containersB]) => containersB.length - containersA.length)
    );

    Object.entries(sorted).forEach(([composeName, composeContainers]) => {
      this.composes[composeName] = new DockerCompose(composeName);
      composeContainers.forEach(container => {
        this.composes[composeName].addContainer(container);
      });
    });
  }

  /**
   * Load per-container stats into the models.
   * @returns {Promise<boolean>} true if stats were fetched successfully
   */
  async loadContainersStats() {
    try {
      const stats = await this.dockerApiClient.getAllContainersStats();
      stats.forEach((containerStats) => {
        const container = this.containers[containerStats.id];
        if (container) {
          container.setStats(containerStats);
        }
      });
      return true;
    } catch (error) {
      console.error('Error loading container stats:', error);
      return false;
    }
  }

  handleNewContainers() {
    // Placeholder for future implementation
  }

  /** Stop watching and destroy the map elements of containers that vanished. */
  cleanContainers() {
    Object.values(this._previousContainers).forEach(container => {
      if (!this.containers[container.Id]) {
        this._previousContainerViews[container.Id]?.stopWatch();
        const element = container.getElement();
        if (element) {
          element.destroy();
        }
      }
    });
  }

  /** Stop every watch loop and drop all containers. */
  clear() {
    Object.values(this.containers).forEach(container => {
      this.containerViews[container.Id]?.stopWatch();
      delete this.containerViews[container.Id];
      delete this.containers[container.Id];
    });
  }

  getContainers(toArray = false) {
    if (toArray) {
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

  /**
   * @returns {Object<string, Array<Container>>}
   */
  getNetworks() {
    return this.networks;
  }

  getTotalMemoryUsage() {
    return Object.values(this.containers).reduce((acc, container) => {
      const newUsage = acc + container.getMemoryUsage();
      return isNaN(newUsage) ? acc : newUsage;
    }, 0);
  }

  getGlobalCpuUsage() {
    return Object.values(this.containers).reduce((acc, container) => {
      const newUsage = acc + container.getCpuUsage();
      return isNaN(newUsage) ? acc : newUsage;
    }, 0);
  }
}
