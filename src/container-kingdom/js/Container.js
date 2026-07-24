import { sha256 } from './sha256.js';

export class Container
{
  // Constants
  static CPU_USAGE_THRESHOLDS = [
    {value: 1, css: 'xxs'},
    {value: 5, css: 'xs'},
    {value: 10, css: 's'},
    {value: 20, css: 'm'},
    {value: 30, css: 'xm'},
    {value: 40, css: 'xxm'},
    {value: 50, css: 'l'},
    {value: 60, css: 'xl'},
    {value: 70, css: 'xxl'},
    {value: 80, css: 'xxxl'},
  ];

  rpgEngine = {
    data: {
      element: null,
      coords: {
        x: null,
        y: null,
      }
    },
  };

  stats = null;
  previousStats = null;
  cpuUsage = 0;

  /**
   * @type {DockerApiClient}
   * @private
   */
  _dockerApiClient = null;




  constructor(
    dockerApiClient,
    descriptor
  ) {
    this._dockerApiClient = dockerApiClient;
    Object.assign(this, descriptor);
  }

  /**
   * Refresh the Docker descriptor fields in place, keeping runtime state
   * (stats history, CPU, rpg-engine binding, rendered flag) intact so the
   * repository can reconcile instead of recreating the model.
   * @param {object} descriptor
   */
  update(descriptor) {
    Object.assign(this, descriptor);
  }

  getNetworks() {
    return Object.keys(this.NetworkSettings.Networks);
  }

  getElement() {
    return this.rpgEngine.data.element;
  }

  async start() {
    try {
      const response = await this._dockerApiClient.startContainer(this.Id);
      return response;
    } catch (error) {
      console.error(`Error starting container ${this.Id}:`, error);
      throw error;
    }
  }

  async destroy() {
    try {
      const response = await this._dockerApiClient.destroyContainer(this.Id);
      return response;
    } catch (error) {
      console.error(`Error destroying container ${this.Id}:`, error);
      throw error;
    }
  }

  getCpuUsageThreshold() {
    for (let i = 0; i < Container.CPU_USAGE_THRESHOLDS.length; i++) {
      if (this.cpuUsage < Container.CPU_USAGE_THRESHOLDS[i].value) {
        return Container.CPU_USAGE_THRESHOLDS[i];
      }
    }

    return {value: 90, css: 'critical'};
  }

  getDemoUrl() {
    let demoUrl = false;
    if(this.Labels) {
      Object.keys(this.Labels).map((label) => {
        let value = this.Labels[label];
        if(value.match(/Host\(.+?\)/)) {
          let url = value.replace(/Host\((.*?)\).*/, '$1');
          url = url.replace(/"/gi, '');
          url = url.replace(/'/gi, '');
          url = url.replace(/`/gi, '');
          if(url) {
            demoUrl = url;
          };
        }
      });
    }

    return demoUrl;
  }


  setStats(stats) {
    this.stats = stats;

    if (this.previousStats) {
      const totalDiff = this.stats.cpu_stats.cpu_usage.total_usage - this.previousStats.cpu_stats.cpu_usage.total_usage;
      const systemDiff = this.stats.cpu_stats.system_cpu_usage - this.previousStats.cpu_stats.system_cpu_usage;
      const numCores = this.stats.cpu_stats.online_cpus;
      this.cpuUsage = (totalDiff / systemDiff) * numCores * 100;
    }

    this.previousStats = this.stats;
  }


  isRunning() {
    return this.State === 'running';
  }

  getStatus() {
    return this.Status;
  }

  getCreatedSince() {
    const created = new Date(this.Created * 1000);
    const now = new Date();
    const diff = now - created;
    const diffInDays = diff / (1000 * 60 * 60 * 24);
    return `${diffInDays.toFixed(2)} days`;
  }

  getCpuUsage() {
    return this.cpuUsage;
  }

  getMemoryUsage(human = false) {
    if (!this.stats || !this.stats.memory_stats || typeof this.stats.memory_stats.usage === 'undefined') {
      return human ? 'N/A' : 0;
    }
    if(human) {
      const usageInMb = this.stats.memory_stats.usage / 1024 / 1024;
      return `${usageInMb.toFixed(2)} MB`;
    }
    return this.stats.memory_stats.usage;
  }

  setRpgEngineData(data) {
    this.rpgEngine.data = data;
  }


  getImage() {
    return this.Image;
  }

  getId() {
    return this.Id;
  }

  getLabel(label) {
    return this.Labels[label] ??  null;
  }
  getLabels() {
    return this.Labels;
  }

  getName() {
    return this.Names[0];
  }

  getComposeName() {
    return this.getLabel('com.docker.compose.project')
  }

  async getChecksum() {
    const descriptor = {
      Id: this.Id,
      Name: this.Name,
      State: this.State,
      Created: this.Created,
      Image: this.Image,
      ImageID: this.ImageID,
      Command: this.Command,
      Ports: this.Ports,
      Labels: this.Labels,
      SizeRw: this.SizeRw,
      SizeRootFs: this.SizeRootFs,
      HostConfig: this.HostConfig,
      NetworkSettings: this.NetworkSettings,
      Mounts: this.Mounts,
      Config: this.Config,
      LogPath: this.LogPath,
      RestartCount: this.RestartCount,
      Platform: this.Platform,
    };

    return sha256(descriptor);
  }
}