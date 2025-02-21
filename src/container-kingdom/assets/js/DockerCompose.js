class DockerCompose {

  _containers = {};
  _name = '';

  constructor(name) {
    this._name = name;
  }

  addContainer(container) {
    this._containers[container.getId()] = container;
  }

  getContainer(id) {
    return this._containers[id] || null;
  }

  getContainers() {
    return this._containers;
  }
}
