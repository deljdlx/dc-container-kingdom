class ContainersListEntry
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
    caption.innerHTML = container.getName();
    this.element.appendChild(caption);

    const focusTrigger = document.createElement('div');
    focusTrigger.classList.add('focus-on-container');
    focusTrigger.innerHTML = '🎯';
    this.element.appendChild(focusTrigger);
    focusTrigger.addEventListener('click', () => {
      this.application.focusOnContainer(container);
    });

    caption.addEventListener('click', async () => {
      await this.application.handleClickOnContainer(container);
    });
  }

  getElement() {
    return this.element;
  }
}