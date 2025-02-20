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


  constructor(descriptor) {
    Object.assign(this, descriptor);
  }

  destroy() {
    this.rpgEngine.data.element.destro();
  }

  setRpgEngineData(data) {
    this.rpgEngine.data = data;
  }

  getId() {
    return this.Id;
  }

  getLabel(label) {
    return this.Labels[label] ??  null;
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