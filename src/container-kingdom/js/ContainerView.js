
/**
 * DOM/view layer for a {@link Container}. Owns everything that touches the
 * document: the info panel rendered on click, the action buttons, and the
 * live "watch" loop that mirrors CPU/memory onto the container's map house.
 *
 * Keeping this out of {@link Container} lets the domain model stay pure and
 * unit-testable.
 */
export class ContainerView {
  static WATCH_INTERVAL_MS = 1000;

  /**
   * @type {Container}
   * @private
   */
  _container;
  _actionsEnabled = false;
  _watchTimeoutId = null;

  /**
   * @param {Container} container
   * @param {boolean} [actionsEnabled] whether start/destroy buttons are shown
   */
  constructor(container, actionsEnabled = false) {
    this._container = container;
    this._actionsEnabled = actionsEnabled;
    this.watch();
  }

  /**
   * @returns {Container}
   */
  getContainer() {
    return this._container;
  }

  createEntry(caption, content) {
    let entry = document.createElement('div');
    entry.classList.add('container-info-entry');
    entry.innerHTML = caption + ': ' + content;
    return entry;
  }

  /**
   * Build the container info panel shown in the console.
   * @returns {HTMLDivElement}
   */
  getHtmlInfo() {
    const container = document.createElement('div');

    if (this._actionsEnabled) {
      const actionContainer = document.createElement('div');
      actionContainer.classList.add('actions-container');
      container.appendChild(actionContainer);

      if (!this._container.isRunning()) {
        const startButton = document.createElement('button');
        startButton.classList.add('container-action-button', 'start-button');
        startButton.innerHTML = 'Start';
        startButton.addEventListener('click', async () => {
          await this._container.start();
        });
        actionContainer.appendChild(startButton);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('container-action-button', 'destroy-button');
        deleteButton.innerHTML = 'Destroy';
        deleteButton.addEventListener('click', async () => {
          await this._container.destroy();
          this.stopWatch();
        });
        actionContainer.appendChild(deleteButton);
      }
    }

    const containerName = this.createEntry('🗒️ Container name', this._container.getName());
    container.appendChild(containerName);

    const containerStatus = this.createEntry('🔥 Status', this._container.getStatus());
    container.appendChild(containerStatus);

    const containerCreatedUptime = this.createEntry('🗒️ Container created', this._container.getCreatedSince());
    container.appendChild(containerCreatedUptime);

    const containerImage = this.createEntry('📀 Image', this._container.getImage());
    container.appendChild(containerImage);

    const containerCompose = this.createEntry('📦 Compose', this._container.getComposeName());
    container.appendChild(containerCompose);

    const containerMemoryUsage = this.createEntry('🧠 Memory usage', this._container.getMemoryUsage(true));
    container.appendChild(containerMemoryUsage);

    const containerCpuUsage = this.createEntry('⚙️ CPU load', `${Math.round(this._container.getCpuUsage() * 100) / 100}%`);
    container.appendChild(containerCpuUsage);

    const demoUrl = this._container.getDemoUrl();
    if (demoUrl) {
      const containerDemo = this.createEntry('🚀 Demo', `<a class="demo-url" href="//${demoUrl}" target="_blank">${demoUrl}</a>`);
      container.appendChild(containerDemo);
    }

    const networks = this._container.getNetworks();
    const containerNetworks = this.createEntry('🔌 Networks', `<ul class="networks">${networks.map(network => `<li class="network">${network}</li>`).join('')}</ul>`);
    container.appendChild(containerNetworks);

    return container;
  }

  /**
   * Reflect the container's live CPU/memory onto its map house, then reschedule.
   */
  watch() {
    const element = this._container.getElement();
    if (element) {
      const dom = element.getDom();
      dom.dataset.cpuUsage = this._container.getCpuUsageThreshold().css;

      const memoryUsageContainer = document.querySelector(`[data-container-id="${this._container.getId()}"] .memory-usage`);
      if (memoryUsageContainer) {
        memoryUsageContainer.innerHTML = this._container.getMemoryUsage(true);
      }
    }

    this._watchTimeoutId = setTimeout(() => {
      this.watch();
    }, ContainerView.WATCH_INTERVAL_MS);
  }

  /**
   * Stop the watch timer to prevent leaks.
   */
  stopWatch() {
    if (this._watchTimeoutId) {
      clearTimeout(this._watchTimeoutId);
      this._watchTimeoutId = null;
    }
  }
}
