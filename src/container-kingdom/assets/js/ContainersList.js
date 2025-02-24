class ContainersList {

  application = null;
  element = null;

  composes = [];

  constructor(application) {
    this.application = application;
    this.element = document.querySelector('.containers-list');
  }

  load(composes) {
    this.composes = composes;

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
          const entry = new ContainersListEntry(this.application, container);
          composeContainer.append(entry.getElement());
          this.element.append(composeContainer);
        });
        return
      }

      const container = this.composes[composeName].getByIndex(0);
      const entry = new ContainersListEntry(this.application, container);
      this.element.append(entry.getElement());
    });
  }

  clear() {
    this.element.innerHTML = '';
  }
}
