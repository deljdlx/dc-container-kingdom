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

  getNetworks() {
    return Object.keys(this.NetworkSettings.Networks);
  }

  getElement() {
    return this.rpgEngine.data.element;
  }

  createEntry(caption, content) {
    let entry = document.createElement('div');
    entry.classList.add('container-info-entry');
    entry.innerHTML = caption + ': ' + content
    return entry
  }

  getHtmlInfo() {

    const container = document.createElement('div');

      const containerName = this.createEntry('🗒️ Container name', this.getName());
      container.appendChild(containerName);

      const containerImage = this.createEntry('📀 Image', this.getImage());
      container.appendChild(containerImage);

      const containerCompose = this.createEntry('📦 Compose', this.getComposeName());
      container.appendChild(containerCompose);

      const containerMemoryUsage = this.createEntry('🧠 Memory usage', this.getMemoryUsage(true))
      container.appendChild(containerMemoryUsage);

      const containerCpuUsage = this.createEntry('⚙️ CPU load', `${Math.round(this.getCpuUsage() * 100) / 100}%`)
      container.appendChild(containerCpuUsage);

      const demoUrl = this.getDemoUrl();
      if(demoUrl) {
        const containerDemo = this.createEntry('🚀 Demo', `<a class="demo-url" href="//${demoUrl}" target="_blank">${demoUrl}</a>`);
        container.appendChild(containerDemo);
      }

      const networks = this.getNetworks();
      const containerNetworks = this.createEntry('🔌 Networks', `<ul class="networks">${networks.map(network => `<li class="network">${network}</li>`).join('')}</ul>`)
      container.appendChild(containerNetworks);
      
    return container;




    // let html =  `
    //   <div class="container-info-entry">
    //     🗒️ Container name: ${this.getName()}
    //   </div>
    //   <div class="container-info-entry">
    //     📀 Image: ${this.getImage()}
    //   </div>

    //   <div class="container-info-entry">
    //     📦 Compose: ${this.getComposeName()}
    //   </div>


    //   <div class="container-info-entry">
    //     🧠 Memory usage: ${this.getMemoryUsage(true)}
    //   </div>
    //   <div class="container-info-entry">
    //     ⚙️ CPU load: ${Math.round(this.getCpuUsage() * 100) / 100}%
    //   </div>
    // `;

    // if(this.getDemoUrl()) {
    //   html += `<div class="container-info-entry">
    //     🚀 Demo
    //     <div>
    //       <a class="demo-url" href="//${this.getDemoUrl()}" target="_blank">${this.getDemoUrl()}</a>
    //     </div>
    //   </div>`;
    // }

    // this.getNetworks();

    // html += '<div class="container-info-entry">🔌 Networks: <ul class="networks">';
    // this.getNetworks().forEach((network) => {
    //   html += `<li class="network">${network}</li>`;
    // });
    // html += '</ul></div>';

    return html;
  }

  watch() {

    if(this.rpgEngine && this.rpgEngine.data.element) {
      const dom = this.rpgEngine.data.element.getDom()
      dom.dataset.cpuUsage = this.getCpuUsageThreshold().css;

      let memoryUsageContainer = document.querySelector(`[data-container-id="${this.Id}"] .memory-usage`);
      if(memoryUsageContainer) {
        memoryUsageContainer.innerHTML = this.getMemoryUsage(true);
      }
    }

    setTimeout(() => {
      this.watch();
    }, 1000);
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

  getStatus() {
    return this.Status;
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