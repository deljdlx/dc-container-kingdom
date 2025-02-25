class ContainerKingdom
{
  consoleContainer;
  /**
   * @type {ContainerKingdomLayout}
   */
  layout;
  viewer;
  console;

  containersList;
  dockerApiClient;

  /**
   * @type {Object<string, Container>}
   */
  containers = {};
  containersStats = {};


  /**
   * @type {Object<string, DockerCompose>}
   */
  composes = {};
  networks = {};

  selectedNetworks = {};

  header;

  lastContainersChecksum = null;


  constructor(dockerApiClient) {

    this.dockerApiClient = dockerApiClient;
    this.layout = new ContainerKingdomLayout(this);

    // this.containersList = new ContainersList(this);


    this.header = document.querySelector('#header');


    this.init();
  }

  async init() {
    // await this.initConsole();
    this.layout.init();

    this.viewer = new ContainerKingdomRenderer(this, this.layout.getViewport());


    await this.loadContainers();
    this.layout.renderContainersList();
    await this.loadContainersStats();

    await this.viewer.drawContainers(this.containers);
    await this.viewer.drawNetworks(this.containers);
    await this.layout.getViewport().render();
    this.drawNetworksSwitches();

    await this.loop();
  }

  getTotalMemoryUsage() {
    return Object.values(this.containers).reduce((acc, container) => {
      return acc + container.getMemoryUsage();
    }, 0);
  }

  getGlobalCpuUsage() {
    return Object.values(this.containers).reduce((acc, container) => {
      return acc + container.getCpuUsage();
    }, 0);
  }

  /**
   * @returns {ContainerKingdomLayout}
   */
  getLayout() {
    return this.layout;
  }

  renderClusterInfo() {
    let element = document.querySelector('.cluster-info');
    if(!element) {
      element = document.createElement('div');
      element.classList.add('cluster-info');
      this.header.append(element);
    }

    let memoryUsage = this.getTotalMemoryUsage();
    memoryUsage = Math.round(memoryUsage / 1024 / 1024 * 100) / 100 + ' MB';

    element.innerHTML = '';

    let memoryUsageContainer = document.createElement('div');
    memoryUsageContainer.classList.add('memory-usage');
    memoryUsageContainer.innerHTML = 'Memory usage: ' + memoryUsage;
    element.append(memoryUsageContainer);

    let cpuUsage = this.getGlobalCpuUsage();
    cpuUsage = Math.round(cpuUsage * 100) / 100 + '%';

    let cpuUsageContainer = document.createElement('div');
    cpuUsageContainer.classList.add('cpu-usage');
    cpuUsageContainer.innerHTML = 'CPU usage: ' + cpuUsage;
    element.append(cpuUsageContainer);
  }

  clear() {
    Object.values(this.containers).map(container => {
      delete this.containers[container.Id];
      container.destroy();
    });
  }

  async loadContainersStats() {
    const stats = await this.dockerApiClient.getAllContainersStats();
    stats.map((containerStats) => {
      const containerId = containerStats.id;
      const container = this.containers[containerId];
      if(container) {
        container.setStats(containerStats);
      }
    });

    this.renderClusterInfo();
  }

  async loop() {
    const currentChecksum = await this.getChecksum();

    await this.loadContainers();
    await this.loadContainersStats();

    this.layout.renderContainersList();

    const newChecksum = await this.getChecksum();
    if(currentChecksum !== newChecksum) {
      document.location.reload();
    }

    setTimeout(() => {
      this.loop();
    }, 2000);
  }

  // renderContainersList() {
  //   this.containersList.clear();
  //   this.containersList.load(this.composes);
  // }

  getContainers(toArray = false) {
    if(toArray) {
      return Object.values(this.containers);
    }
    return this.containers;
  }

  getCompose(composeName) {
    return this.composes[composeName] || null;
  }

  getComposes() {
    return this.composes;
  }


  getContainerStats(containerId) {
    return this.containersStats[containerId];
  }


  async loadContainers() {

    const containers = await this.dockerApiClient.getContainersDescriptors();
    containers.map(containerDescriptor => {
      if(this.containers[containerDescriptor.Id]) {
        return;
      }

      const container = new Container(containerDescriptor);
      this.containers[container.Id] = container;

      const networks = container.NetworkSettings.Networks;
      Object.keys(networks).map(networkName => {
        if(!this.networks[networkName]) {
          this.networks[networkName] = [];
        }
        this.selectedNetworks[networkName] = true;
        this.networks[networkName].push(container);
      });
    });


    const composes = {};

    Object.values(this.containers).map(container => {
      if(!composes[container.getComposeName()]) {
        composes[container.getComposeName()] = [];
      }
      composes[container.getComposeName()].push(container);
    });

    const sortedComposes = Object.fromEntries(
      Object.entries(composes)
        .sort(([, containersA], [, containersB]) => containersB.length - containersA.length)
    );
    Object.entries(sortedComposes).map(([composeName, containers]) => {
      this.composes[composeName] = new DockerCompose(composeName);
      containers.map(container => {
        this.composes[composeName].addContainer(container);
      });
    });

    const descriptor = {
      ids: containers.map(container => container.Id),
      networks: containers.map(container => container.NetworkSettings.Networks),
      labels: containers.map(container => container.Labels),
      status: containers.map(container => container.ImageID),
    };

    const newChecksum = await this.getChecksum(descriptor);
    if(this.lastContainersChecksum === null) {
      this.lastContainersChecksum = newChecksum
    }

    if(this.lastContainersChecksum !== newChecksum) {
      document.location.reload();
      return;
    }
    this.lastContainersChecksum = newChecksum;
  }

  drawNetworksSwitches() {
    let container = document.querySelector('.networks-switches');
    if(!container) {
      container = document.createElement('div');
      container.classList.add('networks-switches');
    }
    container.innerHTML = '';
    const caption = document.createElement('h2');
    caption.innerHTML = 'Networks';
    container.append(caption);


    Object.keys(this.networks).map(networkName => {
      const label = document.createElement('label');
      label.classList.add('network-switch');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      label.append(checkbox);
      label.append(networkName);
      container.append(label);

      checkbox.addEventListener('change', (event) => {
        this.handleNetworkSwitch(networkName, event.target.checked);
      });
    });
    this.header.append(container);
  }

  handleNetworkSwitch(networkName, checked) {
    const roads = document.querySelectorAll('.map-element.network.network--' + networkName);
    roads.forEach(road => {
      if(checked) {
        road.classList.remove('hidden');
        this.selectedNetworks[networkName] = true;
      } else {
        road.classList.add('hidden');
        this.selectedNetworks[networkName] = false;
      }
    });

    const containers = document.querySelectorAll('.map-element.container.network--' + networkName);
    containers.forEach(container => {
      let mustBeHidden = true;
      Object.keys(this.selectedNetworks).map(networkName => {
        if(this.selectedNetworks[networkName] && container.classList.contains('network--' + networkName)) {
          mustBeHidden = false;
        }
      });
      if(mustBeHidden) {
        container.classList.add('hidden');
      }
      else {
        container.classList.remove('hidden');
      }
    });

  }

  async gotoContainerUrl(container) {
    if(container.Labels) {
      Object.keys(container.Labels).map((label) => {
        let value = container.Labels[label];
        if(value.match(/Host\(.+?\)/)) {
            let url = value.replace(/Host\((.*?)\).*/, '$1');
            url = url.replace(/"/gi, '');
            url = url.replace(/'/gi, '');
            url = url.replace(/`/gi, '');
            console.log(url);
            if(url) {
              document.querySelector('#iframe-container').classList.remove('hidden');
              document.querySelector('#iframe-preview').src = '//' + url;
            }
        }
      });
    }
  }



  async focusOnContainer(container) {
    this.layout.focusOnContainer(container);
  }

  drawRandomFlowers(quantity) {
    const board = this.layout.getViewport().getBoard();
    for(let i = 0; i < quantity ; i++) {
      const x = Math.random() * 1800;
      const y = Math.random() * window.innerHeight;

      const area = board.getAreaAt(0, 0);
      area.addElement(x, y, new Sunflower00());
    }
  }

  getContainerLogs(container) {
    return this.dockerApiClient.getContainerLogs(container.Id);
  }


  zoom(zoom) {
      this.layout.zoom(zoom);
  }







  async getChecksum(object) {
    const json = JSON.stringify(object);

    const encoder = new TextEncoder();
    const data = encoder.encode(json); // Encoder en Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    const hash = [...new Uint8Array(hashBuffer)] // Convertir en hex
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");

    return hash;
  }
}
