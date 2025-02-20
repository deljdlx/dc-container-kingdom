class GameConsole
{

  application;
  container;

  constructor(application, selector) {
    this.application = application;
    this.container = document.querySelector(selector);
  }

  clear() {
    this.container.innerHTML = '';
  }

  addEntry(content) {
    const entry = document.createElement('div');
    entry.classList.add('controle-entry');
    if(content instanceof HTMLElement) {
      entry.appendChild(content);
    }
    else {
      entry.innerHTML = content;
    }
    this.container.appendChild(entry);
  }
}

