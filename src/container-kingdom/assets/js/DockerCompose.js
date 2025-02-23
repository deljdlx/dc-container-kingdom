class DockerCompose {

  _containers = {};
  _name = '';

  constructor(name) {
    this._name = name;
  }

  getByIndex(index) {
    let found = null;
    Object.entries(this._containers).forEach(([key, container], i) => {
      if(i === index) {
        found = container;
      }
    });
    return found;
  }

  length() {
    return Object.keys(this._containers).length;
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
