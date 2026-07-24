/**
 * A simple on-screen log panel: appends entries into a DOM container and
 * scrolls to follow them. A debugging/UI helper, decoupled from the engine's
 * render loop.
 */
export class GameConsole
{
  /** @type {import('../map/Application.js').Application} owning application */
  application;
  /** @type {HTMLElement} the panel's DOM container */
  container;

  /**
   * @param {import('../map/Application.js').Application} application owning application
   * @param {string} selector CSS selector of the container element
   */
  constructor(application, selector) {
    this.application = application;
    this.container = document.querySelector(selector);
  }

  /** Removes every entry from the panel. */
  clear() {
    this.container.innerHTML = '';
  }

  /**
   * Appends a new entry to the panel.
   * @param {HTMLElement|string} content DOM node to append, or HTML string
   */
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

  /** Scrolls the panel to reveal its most recent entry. */
  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }
}

