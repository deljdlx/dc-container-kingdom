class Container
{
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


  cpuUsageThresholds = [
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




  constructor(descriptor) {
    Object.assign(this, descriptor);
    this.watch();
  }

  getElement() {
    return this.rpgEngine.data.element;
  }

  watch() {

    if(this.rpgEngine && this.rpgEngine.data.element) {
      const dom = this.rpgEngine.data.element.getDom()
      dom.dataset.cpuUsage = this.getCpuUsageThreshold().css;

      const memoryUsageContainer = dom.querySelector('.container__memory-usage');
      if(memoryUsageContainer) {
        memoryUsageContainer.innerHTML = this.getMemoryUsage(true);
      }


    }



    setTimeout(() => {
      this.watch();
    }, 10000);
  }

  getCpuUsageThreshold() {
    for (let i = 0; i < this.cpuUsageThresholds.length; i++) {
      if (this.cpuUsage < this.cpuUsageThresholds[i].value) {
        return this.cpuUsageThresholds[i];
      }
    }

    return {value: 90, css: 'critical'};
  }

  getDemoUrl() {
    let demoUrl =false;
    if(this.Labels) {
      Object.keys(this.Labels).map((label) => {
        let value = this.Labels[label];
        if(value.match(/Host\(.+?\)/)) {
          let url = value.replace(/Host\((.*?)\).*/, '$1');
          url = url.replace(/"/gi, '');
          url = url.replace(/'/gi, '');
          url = url.replace(/`/gi, '');
          console.log(url);
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

  getCpuUsage() {
    return this.cpuUsage;
  }

  getMemoryUsage(human = false) {
    if(human) {
      const usageInMb = this.stats.memory_stats.usage / 1024 / 1024;
      return `${usageInMb.toFixed(2)} MB`;
    }
    return this.stats.memory_stats.usage;
  }

  destroy() {
    this.rpgEngine.data.element.destro();
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

  getName() {
    return this.Names[0];
  }

  getComposeName() {
    return this.getLabel('com.docker.compose.project')
  }

  async getChecksum() {

    let descriptor = {
      Id: this.Id,
      Labels: this.Labels,
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
      NetworkSettings: this.NetworkSettings,
      LogPath: this.LogPath,
      HostConfig: this.HostConfig,
      RestartCount: this.RestartCount,
      Platform: this.Platform,
    };


    const json = JSON.stringify(descriptor);
    const encoder = new TextEncoder();
    const data = encoder.encode(json); // Encoder en Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    const hash = [...new Uint8Array(hashBuffer)] // Convertir en hex
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");

    return hash;
  }
}