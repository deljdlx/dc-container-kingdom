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
    entry.innerHTML = content;
    this.container.appendChild(entry);
  }
}

