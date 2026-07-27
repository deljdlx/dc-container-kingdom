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
   * CPU can be computed), create the new ones, then rebuild the derived
   * network/compose indexes.
   *
   * A failed fetch is a strict **no-op**: an unreachable daemon is not an empty
   * cluster, so containers, indexes and checksum are left untouched and the
   * last known kingdom stays on screen. Only an answering daemon may prune.
   * @returns {Promise<boolean>} true when the state was reconciled, false when
   *   the fetch failed and the previous state was kept
   */
  async loadContainers() {
    let descriptors;
    try {
      descriptors = await this.dockerApiClient.getContainersDescriptors();
    } catch (error) {
      console.error('Error loading containers:', error);
      return false;
    }

    const seenIds = new Set(descriptors.map(descriptor => descriptor.Id));

    // Remove containers that disappeared.
    Object.keys(this.containers).forEach(id => {
      if (!seenIds.has(id)) {
        const element = this.containers[id].getElement();
        if (element) {
          element.destroy();
        }
        delete this.containers[id];
        delete this.containerViews[id];
      }
    });

    // Update existing containers, create the new ones (one view per container).
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

    // Fingerprint only fields that change when the *infrastructure* changes.
    // `Status` is deliberately excluded: it is Docker's human-readable label
    // ("Up 4 seconds" → "Up 9 seconds" → "Up About a minute"), so it drifts on
    // its own and would report a change at nearly every poll. `State`
    // ("running", "exited", "paused"…) carries the same information, stably.
    const checksumDescriptor = descriptors
      .map(descriptor => ({
        id: descriptor.Id,
        imageId: descriptor.ImageID,
        state: descriptor.State,
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

    return true;
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
      const runningIds = Object.values(this.containers)
        .filter(container => container.State === 'running')
        .map(container => container.Id);
      const stats = await this.dockerApiClient.getAllContainersStats(runningIds);
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

  /** Drop every container and its view. */
  clear() {
    Object.values(this.containers).forEach(container => {
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

  /**
   * @returns {ContainerView[]} the view of every live container
   */
  getContainerViews() {
    return Object.values(this.containerViews);
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
