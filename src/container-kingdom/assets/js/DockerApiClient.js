class DockerApiClient
{
  async getContainersDescriptors() {
    const response = await fetch('/api/docker/containers/json?all=true');
    const containers = await response.json();
    return containers;
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


