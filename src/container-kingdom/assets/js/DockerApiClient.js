class DockerApiClient
{
  async getContainersDescriptors() {
    let response;
    try {
      response = await fetch('/api/docker/containers/json?all=true');
    }
    catch (error) {
      console.error('Error while fetching containers descriptors', error);
      return [];
    }

    try {
      const containers = await response.json();
      return containers;
    } catch (error) {
      console.error('Error while parsing containers descriptors', error);
      return [];
    }
  }

  async startContainer(containerId) {
    const response = await fetch(`/api/docker/containers/${containerId}/start`, {
      method: 'POST',
    });
    return response;
  }
  async destroyContainer(containerId) {
    const response = await fetch(`/api/docker/containers/${containerId}`, {
      method: 'DELETE',
    });
    return response;
  }

  async getAllContainersStats() {
    const response = await fetch('/api/docker/containers/json?all=true&size=true');
    const containers = await response.json();

    const statsPromises = containers.map(container =>
        fetch(`/api/docker/containers/${container.Id}/stats?stream=false`)
            .then(res => res.json())
            .catch(() => null)
    );
    const stats = await Promise.all(statsPromises);

    return stats.filter(stat => stat !== null);
  }

  async loadContainerStats(containerId) {
    const response = await fetch(`/api/docker/containers/${containerId}/stats?stream=false`);
    const stats = await response.json();

    return stats;
  }

  async getContainerLogs(containerId) {
    const response = await fetch(`/api/docker/containers/${containerId}/logs?stdout=true&stderr=true&tail=50`);
    const logs = await response.text();
    return logs;
  }

}


