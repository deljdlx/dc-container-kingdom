export class ContainersListEntry
{
  application;
  container;
  element;

  constructor(application, container) {
    this.application = application;
    this.container = container;

    this.element = document.createElement('div');
    this.element.classList.add('container-list-entry');

    const caption = document.createElement('span');
    caption.classList.add('container-name');

    if(container.isRunning()) {
      this.element.classList.add('container-status-running');
      caption.textContent = '▶️' + container.getName();
    }
    else {
      this.element.classList.add('container-status-stopped');
      caption.textContent = '⏹️' + container.getName();
    }
    this.element.appendChild(caption);

    const focusTrigger = document.createElement('div');
    focusTrigger.classList.add('focus-on-container');
    focusTrigger.innerHTML = '🎯';
    this.element.appendChild(focusTrigger);
    focusTrigger.addEventListener('click', () => {
      this.application.focusOnContainer(container);
    });

    caption.addEventListener('click', async () => {
      await this.application.getLayout().handleClickOnContainer(container);
    });
  }

  getElement() {
    return this.element;
  }
}