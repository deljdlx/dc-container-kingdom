class ContainerKingdom
{
  iframeContainer;
  consoleContainer;
  containerInfoContainer;
  containersListContainer;

  rpgEngine;
  viewer;
  console;
  dockerApiClient;


  containers = {};
  containersStats = {};

  composes = {};
  networks = {};

  selectedNetworks = {};

  header;

  lastContainersChecksum = null;


  constructor(dockerApiClient) {

    this.dockerApiClient = dockerApiClient;

    this.iframeContainer = document.querySelector('#iframe-container');
    this.containerInfoContainer = document.querySelector('.console-container .container-info');
    this.containersListContainer = document.querySelector('.containers-list');

    this.header = document.querySelector('#header');
    this.makeViewportZoomable();
    this.makeViewportDraggable()

    this.init();
  }

  async init() {
    await this.initRpgEngine();
    await this.initConsole();
    this.viewer = new ContainerKingdomRenderer(this, this.rpgEngine.getViewport());

    await this.loadContainers();
    this.renderContainersList();
    await this.loadContainersStats();

    await this.viewer.drawContainers(this.containers);
    await this.viewer.drawNetworks(this.containers);
    await this.rpgEngine.getViewport().render();
    this.drawNetworksSwitches();



    await this.loop();
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
  }

  async loop() {
    const currentChecksum = await this.getChecksum();

    await this.loadContainers();
    await this.loadContainersStats();

    this.renderContainersList();

    const newChecksum = await this.getChecksum();
    if(currentChecksum !== newChecksum) {
      document.location.reload();
    }

    setTimeout(() => {
      this.loop();
    }, 5000);
  }

  renderContainersList() {

    this.containersListContainer.innerHTML = '';

    Object.keys(this.composes).map(composeName => {
      if(this.composes[composeName].length() > 1 ) {
        const composeContainer = document.createElement('details');
        composeContainer.open = true;
        composeContainer.classList.add('compose-container');
        const caption = document.createElement('summary');
        caption.classList.add('compose-caption');
        caption.innerHTML = composeName;
        composeContainer.append(caption);

        Object.values(this.composes[composeName].getContainers()).map(container => {
          const entry = new ContainersListEntry(this, container);
          composeContainer.append(entry.getElement());
          this.containersListContainer.append(composeContainer);
        });
        return
      }

      const container = this.composes[composeName].getByIndex(0);
      const entry = new ContainersListEntry(this, container);
      this.containersListContainer.append(entry.getElement());
    });
  }

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
    };

    const newChecksum = await this.getChecksum(descriptor);
    if(this.lastContainersChecksum === null) {
      this.lastContainersChecksum = newChecksum
    }

    if(this.lastContainersChecksum !== newChecksum) {
      document.location.reload();
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

  async initRpgEngine() {
    const MAP_CONFIGURATION = {
      width: window.innerWidth,
      height: window.innerHeight - 50,
    }


    this.rpgEngine = new Application(
      '#viewport',
      MAP_CONFIGURATION.width,
      MAP_CONFIGURATION.height,
      // MAP_CONFIGURATION.width * 3,
      // MAP_CONFIGURATION.height * 3,
      // MAP_CONFIGURATION.width / 2,
      // MAP_CONFIGURATION.height / 2,
    );

    this.rpgEngine.registerElement('FenceGroup00', FenceGroup00);
    this.rpgEngine.registerElement('Fence00H', Fence00H);
    this.rpgEngine.registerElement('Fence00V', Fence00V);

    this.rpgEngine.registerElement('House00', House00);
    this.rpgEngine.registerElement('House01', House01);
    this.rpgEngine.registerElement('Fountain00', Fountain00);

    this.rpgEngine.registerElement('Woman00', Woman00);
    this.rpgEngine.registerElement('Woman01', Woman01);
    this.rpgEngine.registerElement('Woman01', Woman02);
    this.rpgEngine.registerElement('Man00', Man00);

    this.rpgEngine.registerElement('Flower00', Flower00);
    this.rpgEngine.registerElement('Tree00', Tree00);
    this.rpgEngine.registerElement('Sunflower00', Sunflower00);
    this.rpgEngine.registerElement('Ground00', Ground00);

    this.rpgEngine.addEventListener('map.update', (event) => {

    });

    document.querySelector('#close-iframe-container').addEventListener('click', () => {
      document.querySelector('#iframe-container').classList.add('hidden');
    });


    this.rpgEngine.addEventListener('element.collision', (event) => {
      event.target.getRenderer().getDom().classList.add('collided');
      event.target.getRenderer().getDom().classList.add('shake');
      setTimeout(() => {
        event.target.getRenderer().getDom().classList.remove('shake');
      }, 500);

      // if(event.target.data.container) {
      //   this.gotoContainerUrl(event.target.data.container);
      // }
    });


    this.rpgEngine.addEventListener('element.click', async (event) => {

      if(!event.element.data.container) {
        return;
      }
      await this.handleClickOnContainer(event.element.data.container);
    });

    this.rpgEngine.addEventListener('element.collision.end', (event) => {
      event.target.getRenderer().getDom().classList.remove('collided');
    });

    this.rpgEngine.addEventListener('element.trigger', (event) => {
      event.target.getRenderer().getDom().classList.add('collided');
    });

    this.rpgEngine.addEventListener('element.trigger.end', (event) => {
      event.target.getRenderer().getDom().classList.remove('collided');
    });

    const viewport = this.rpgEngine.getViewport();
    const board = viewport.getBoard();

    board.initialize();

    this.drawRandomFlowers(50);

    viewport.render();
    viewport.run();
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

  async handleClickOnContainer(container) {
    this.console.clear();
    const buffer = await this.dockerApiClient.getContainerLogs(container.Id);
    const log = new Log(buffer)
    const entries = log.getEntries();

    entries.map(logEntry => {
      this.console.addEntry(logEntry.getElement());
    });

    this.containerInfoContainer.innerHTML = '';

    this.containerInfoContainer.innerHTML = container.getHtmlInfo();

    this.showConsole();
    this.console.scrollToBottom();
  }

  async focusOnContainer(container) {
    const absoluteX = container.getElement().x();
    const absoluteY = container.getElement().y();

    const board = document.querySelector('#viewport').firstElementChild;

    let moveX = (window.innerWidth / 2 - absoluteX) * 1.5;
    let moveY = (window.innerHeight / 2 - absoluteY) * 1.5 - container.getElement().height();

    board.style.left = moveX + 'px';
    board.style.top = moveY + 'px';

    board.style.transform = 'scale(1.5)';
  }

  drawRandomFlowers(quantity) {
    const board = this.rpgEngine.getViewport().getBoard();
    for(let i = 0; i < quantity ; i++) {
      const x = Math.random() * 1800;
      const y = Math.random() * window.innerHeight;

      const area = board.getAreaAt(0, 0);
      area.addElement(x, y, new Sunflower00());
    }
  }

  makeViewportZoomable() {
    document.querySelector('#viewport').addEventListener('wheel', (event) => {
      const board = document.querySelector('#viewport').firstElementChild;
      if(!board) {
        return;
      }

      const clientX = event.clientX;
      const clientY = event.clientY;
      const offsetX = board.offsetLeft;
      const offsetY = board.offsetTop;

      // const savedTransformOrigin = board.style.transform;
      // board.style.transformOrigin = `${clientX - offsetX}px ${clientY - offsetY}px`;

      const scale = board.style.transform.match(/scale\((.*)\)/);
      let currentScale = 1;

      if(scale) {
        currentScale = parseFloat(scale[1]);
      }

      if(event.deltaY > 0) {
        if(currentScale <= 0.1) {
          return;
        }
        board.style.transform = `scale(${parseFloat(currentScale) - 0.05})`;
      } else {
        if(currentScale >= 3) {
          return;
        }
        board.style.transform = `scale(${parseFloat(currentScale) + 0.05})`;
      }

      // board.style.transformOrigin = savedTransformOrigin;

    });
  }

  makeViewportDraggable() {
    document.querySelector('#viewport').addEventListener('mousedown', (event) => {
      const firstChild = document.querySelector('#viewport').firstElementChild;
      if (!firstChild) {
          return;
      }

      const offsetX = event.clientX - firstChild.offsetLeft;
      const offsetY = event.clientY - firstChild.offsetTop;

      function onMouseMove(event) {
          firstChild.style.left = (event.clientX - offsetX) + 'px';
          firstChild.style.top = (event.clientY - offsetY) + 'px';
      }

      document.body.addEventListener('mousemove', onMouseMove);

      document.body.addEventListener('mouseup', () => {
          document.body.removeEventListener('mousemove', onMouseMove);
      }, { once: true });
    });
  }

  initConsole() {
    this.console = new GameConsole(this.rpgEngine, '#game-console');
    this.console.addEntry('<em>Hello my friend, what can I do for you ?</em>');

    this.consoleContainer = document.querySelector('.console-container')

    const closeTrigger = document.querySelector('#close-console-container');
    closeTrigger.addEventListener('click', () => {
      this.consoleContainer.classList.add('hidden');
    });
  }

  showConsole() {
    this.consoleContainer.classList.remove('hidden');
  }

  showIframe(url) {
    this.iframeContainer.classList.remove('hidden');
    document.querySelector('#iframe-preview').src = '//' + url;
  }

  hideIframe() {
    this.iframeContainer.classList.add('hidden');
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
