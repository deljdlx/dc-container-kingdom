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

  /** @type {Object<string, DockerCompose>} */
  composes = {};
  /** @type {Object<string, Array<Container>>} */
  networks = {};

  lastContainersChecksum = null;

  /** @type {() => void} explicit hook called when descriptors checksum changes */
  onContainersChanged = () => {};

  constructor(dockerApiClient) {
    this.dockerApiClient = dockerApiClient;
  }

  /**
   * Fetch descriptors and reconcile the current state: drop vanished
   * containers, refresh existing ones in place (keeping their stats history so
   * CPU can be computed and their watch timer alive), create the new ones, then
   * rebuild the derived network/compose indexes.
   */
  async loadContainers() {
    const descriptors = await this.dockerApiClient.getContainersDescriptors();
    const seenIds = new Set(descriptors.map(descriptor => descriptor.Id));

    // Remove containers that disappeared.
    Object.keys(this.containers).forEach(id => {
      if (!seenIds.has(id)) {
        this.containerViews[id]?.stopWatch();
        const element = this.containers[id].getElement();
        if (element) {
          element.destroy();
        }
        delete this.containers[id];
        delete this.containerViews[id];
      }
    });

    // Update existing containers, create the new ones (one watch per container).
    descriptors.forEach(descriptor => {
      const existing = this.containers[descriptor.Id];
      if (existing) {
        existing.update(descriptor);
        return;
      }
      const container = new Container(this.dockerApiClient, descriptor);
      this.containers[container.Id] = container;
      this.containerViews[container.Id] = new ContainerView(container);
    });

    this._rebuildNetworks();
    this._rebuildComposes();

    const checksumDescriptor = descriptors
      .map(descriptor => ({
        id: descriptor.Id,
        imageId: descriptor.ImageID,
        state: descriptor.State,
        status: descriptor.Status,
        networks: Object.keys(descriptor.NetworkSettings?.Networks ?? {}).sort(),
        labels: Object.entries(descriptor.Labels ?? {})
          .sort(([left], [right]) => left.localeCompare(right)),
      }))
      .sort((left, right) => left.id.localeCompare(right.id));

    const newChecksum = await sha256(checksumDescriptor);
    const changed = this.lastContainersChecksum !== null
      && this.lastContainersChecksum !== newChecksum;
    this.lastContainersChecksum = newChecksum;
    if (changed) {
      this.handleNewContainers();
    }
  }

  _rebuildNetworks() {
    this.networks = {};
    Object.values(this.containers).forEach(container => {
      Object.keys(container.NetworkSettings.Networks).forEach(networkName => {
        if (!this.networks[networkName]) {
          this.networks[networkName] = [];
        }
        this.networks[networkName].push(container);
      });
    });
  }

  _rebuildComposes() {
    this.composes = {};
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
    this.onContainersChanged();
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
