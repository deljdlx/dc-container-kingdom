import { Container } from './Container.js';

export class DockerApiClient
{
  /**
   * Get all container descriptors from Docker API
   * @returns {Promise<Array>} Array of container descriptors
   */
  async getContainersDescriptors() {
    try {
      const response = await fetch('/api/docker/containers/json?all=true');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error while fetching containers descriptors:', error);
      return [];
    }
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
   * Get stats for all containers
   * @returns {Promise<Array>} Array of container stats
   */
  async getAllContainersStats() {
    try {
      const response = await fetch('/api/docker/containers/json?all=true&size=true');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const containers = await response.json();

      const statsPromises = containers.map(container =>
        this.loadContainerStats(container.Id).catch(() => null)
      );
      const stats = await Promise.all(statsPromises);

      return stats.filter(stat => stat !== null);
    } catch (error) {
      console.error('Error fetching all container stats:', error);
      return [];
    }
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


