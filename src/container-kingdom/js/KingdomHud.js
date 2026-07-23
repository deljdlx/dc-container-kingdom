/**
 * Header HUD for the kingdom: the live cluster totals (memory / CPU) and the
 * per-network toggle switches that show/hide roads and container houses.
 *
 * All the header DOM lives here so {@link ContainerKingdom} stays an
 * orchestrator rather than a renderer. Reads live data back through the
 * application (getTotalMemoryUsage / getGlobalCpuUsage / getNetworks).
 */
export class KingdomHud {
  /** @type {import('./ContainerKingdom.js').ContainerKingdom} */
  _application;
  _header;

  /** UI filter state: which networks are currently toggled on. */
  selectedNetworks = {};

  constructor(application, header) {
    this._application = application;
    this._header = header;
  }

  /**
   * Render (or refresh) the cluster totals block in the header.
   */
  renderClusterInfo() {
    let element = document.querySelector('.cluster-info');
    if (!element) {
      element = document.createElement('div');
      element.classList.add('cluster-info');
      this._header.append(element);
    }

    let memoryUsage = this._application.getTotalMemoryUsage();
    memoryUsage = Math.round(memoryUsage / 1024 / 1024 * 100) / 100 + ' MB';

    element.innerHTML = '';

    let memoryUsageContainer = document.createElement('div');
    memoryUsageContainer.classList.add('memory-usage');
    memoryUsageContainer.innerHTML = 'Memory usage: ' + memoryUsage;
    element.append(memoryUsageContainer);

    let cpuUsage = this._application.getGlobalCpuUsage();
    cpuUsage = Math.round(cpuUsage * 100) / 100 + '%';

    let cpuUsageContainer = document.createElement('div');
    cpuUsageContainer.classList.add('cpu-usage');
    cpuUsageContainer.innerHTML = 'CPU usage: ' + cpuUsage;
    element.append(cpuUsageContainer);
  }

  /**
   * Render the per-network toggle switches. Every network starts enabled.
   */
  drawNetworksSwitches() {
    let container = document.querySelector('.networks-switches');
    if (!container) {
      container = document.createElement('div');
      container.classList.add('networks-switches');
    }
    container.innerHTML = '';
    const caption = document.createElement('h2');
    caption.innerHTML = 'Networks';
    container.append(caption);

    Object.keys(this._application.getNetworks()).forEach(networkName => {
      this.selectedNetworks[networkName] = true;

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
    this._header.append(container);
  }

  /**
   * Toggle roads and houses for a network on/off, hiding a house only once all
   * of its networks are off.
   */
  handleNetworkSwitch(networkName, checked) {
    const roads = document.querySelectorAll('.map-element.network.network--' + networkName);
    roads.forEach(road => {
      if (checked) {
        road.classList.remove('hidden');
        this.selectedNetworks[networkName] = true;
      } else {
        road.classList.add('hidden');
        this.selectedNetworks[networkName] = false;
      }
    });

    const containers = document.querySelectorAll('.map-element.container.network--' + networkName);
    containers.forEach(containerElement => {
      let mustBeHidden = true;
      Object.keys(this.selectedNetworks).forEach(netName => {
        if (this.selectedNetworks[netName] && containerElement.classList.contains('network--' + netName)) {
          mustBeHidden = false;
        }
      });
      if (mustBeHidden) {
        containerElement.classList.add('hidden');
      } else {
        containerElement.classList.remove('hidden');
      }
    });
  }
}
