
export class DockerApiClient
{
  /** @type {number} max concurrent per-container stats requests */
  static STATS_CONCURRENCY_LIMIT = 8;

  /**
   * Get all container descriptors from Docker API.
   *
   * Rejects when the daemon cannot be reached. Reporting an empty array instead
   * would make an outage indistinguishable from an empty cluster, and callers
   * would prune every container on the first hiccup.
   * @returns {Promise<Array>} Array of container descriptors
   * @throws {Error} when the request fails
   */
  async getContainersDescriptors() {
    const response = await fetch('/api/docker/containers/json?all=true');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Start a container
   * @param {string} containerId - Container ID
   * @returns {Promise<Response>}
   */
  async startContainer(containerId) {
    try {
      const response = await fetch(`/api/docker/containers/${containerId}/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Failed to start container: ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error(`Error starting container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Destroy (remove) a container
   * @param {string} containerId - Container ID
   * @returns {Promise<Response>}
   */
  async destroyContainer(containerId) {
    try {
      const response = await fetch(`/api/docker/containers/${containerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to destroy container: ${response.status}`);
      }
      return response;
    } catch (error) {
      console.error(`Error destroying container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Get stats for the provided container ids.
   *
   * The caller already owns the descriptor set; this method only fans out the
   * `/stats` calls. A single container whose stats fail is dropped, not fatal —
   * it may have just exited between listing and stats polling.
   *
   * Concurrency is capped to avoid spiking daemon load on large fleets.
   * @param {string[]} containerIds
   * @param {number} [concurrencyLimit]
   * @returns {Promise<Array>} Array of container stats
   */
  async getAllContainersStats(containerIds = [], concurrencyLimit = DockerApiClient.STATS_CONCURRENCY_LIMIT) {
    if (containerIds.length === 0) {
      return [];
    }

    const queue = [...containerIds];
    const safeConcurrency = Math.max(1, Math.min(concurrencyLimit, queue.length));
    const groups = await Promise.all(
      Array.from({ length: safeConcurrency }, async () => {
        const localStats = [];
        while (queue.length > 0) {
          const containerId = queue.shift();
          if (!containerId) {
            continue;
          }
          const stats = await this.loadContainerStats(containerId).catch(() => null);
          if (stats !== null) {
            localStats.push(stats);
          }
        }
        return localStats;
      })
    );

    return groups.flat();
  }

  /**
   * Load stats for a specific container
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} Container stats
   */
  async loadContainerStats(containerId) {
    try {
      const response = await fetch(`/api/docker/containers/${containerId}/stats?stream=false`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading stats for container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Get logs for a specific container
   * @param {string} containerId - Container ID
   * @returns {Promise<string>} Container logs
   */
  async getContainerLogs(containerId) {
    try {
      const response = await fetch(`/api/docker/containers/${containerId}/logs?stdout=true&stderr=true&tail=50`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error fetching logs for container ${containerId}:`, error);
      return '';
    }
  }
}


