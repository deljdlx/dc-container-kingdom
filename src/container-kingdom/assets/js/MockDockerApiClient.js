/**
 * Mock Docker API Client for testing the Container Kingdom frontend without Docker
 * This client returns mock data instead of making real API calls
 */
class MockDockerApiClient
{
  /**
   * Get all container descriptors from mock data
   * @returns {Promise<Array>} Array of container descriptors
   */
  async getContainersDescriptors() {
    // Simulate network delay
    await this._simulateDelay();
    return MockData.containers;
  }

  /**
   * Start a container (mock - does nothing but log)
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>}
   */
  async startContainer(containerId) {
    await this._simulateDelay();
    console.log(`[MockDockerApiClient] Starting container ${containerId} (mock)`);

    // Find and update the container state in mock data
    const container = MockData.containers.find(c => c.Id === containerId);
    if (container) {
      container.State = 'running';
      container.Status = 'Up Less than a second';
    }

    return { ok: true };
  }

  /**
   * Destroy (remove) a container (mock - does nothing but log)
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>}
   */
  async destroyContainer(containerId) {
    await this._simulateDelay();
    console.log(`[MockDockerApiClient] Destroying container ${containerId} (mock)`);

    // Remove the container from mock data
    const index = MockData.containers.findIndex(c => c.Id === containerId);
    if (index > -1) {
      MockData.containers.splice(index, 1);
    }

    return { ok: true };
  }

  /**
   * Get stats for all containers
   * @returns {Promise<Array>} Array of container stats
   */
  async getAllContainersStats() {
    await this._simulateDelay();

    // Generate stats for all running containers
    const stats = MockData.containers
      .filter(container => container.State === 'running')
      .map(container => {
        return MockData.generateContainerStats(container.Id, container.Names[0]);
      });

    return stats;
  }

  /**
   * Load stats for a specific container
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} Container stats
   */
  async loadContainerStats(containerId) {
    await this._simulateDelay();

    const container = MockData.containers.find(c => c.Id === containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    return MockData.generateContainerStats(containerId, container.Names[0]);
  }

  /**
   * Get logs for a specific container
   * @param {string} containerId - Container ID
   * @returns {Promise<string>} Container logs
   */
  async getContainerLogs(containerId) {
    await this._simulateDelay();
    return MockData.generateContainerLogs();
  }

  /**
   * Simulate network delay for more realistic behavior
   * @private
   * @returns {Promise<void>}
   */
  async _simulateDelay() {
    const delay = Math.floor(Math.random() * 200) + 50; // 50-250ms
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
