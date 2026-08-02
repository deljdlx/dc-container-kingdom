/**
 * A live view of everything crossing the engine's event bus.
 *
 * Not a comfort: an **instrument for measuring the architecture**. If a fact of
 * the game is not readable here, it is not modelled — the panel makes visible
 * what would otherwise stay implicit in a call stack.
 *
 * Three constraints shape it, and each comes from a way this kind of tool
 * usually fails:
 *
 * - **Coalescing.** A repeated event is one line with a counter, not N lines.
 *   `map.update` alone fires on every frame the player walks; without this the
 *   panel is a wall of noise one second in.
 * - **Batched writes.** Events arrive on the game loop's clock; the DOM is
 *   written on a **timer** instead, once per flush. An observer of the loop must
 *   not become a per-frame DOM writer itself.
 * - **A ceiling.** Entries live in a ring buffer. A console without one leaks
 *   exactly like the things it is there to watch.
 *
 * Text is written with `textContent`, never `innerHTML`: an event payload can
 * carry data from outside (a container name, a label) and a log panel is no
 * place to grow an injection.
 */
export class EventConsole
{
  /** @type {number} entries kept on screen; the oldest are dropped */
  static DEFAULT_LIMIT = 200;

  /** @type {number} ms between DOM flushes — the panel's own clock */
  static FLUSH_INTERVAL = 100;

  /** @type {number} ms an event counts towards the displayed rate */
  static RATE_WINDOW = 1000;

  /** @type {number} ms a clicked event's source stays outlined */
  static HIGHLIGHT_DURATION = 1200;

  /** @type {Array<{type: string, count: number, source: Object, node: HTMLElement, countNode: HTMLElement}>} */
  _entries = [];

  /** @type {Array<{type: string, source: Object, at: number}>} awaiting the next flush */
  _pending = [];

  /** @type {number[]} `at` stamps kept for the rate readout */
  _recent = [];

  /** @type {string} lowercased substring an entry must contain to show */
  _filter = '';

  /** @type {(() => void)|null} undoes the bus subscription */
  _unsubscribe = null;

  /** @type {*} handle of the flush timer */
  _timer = null;

  /**
   * @param {{addAnyEventListener?: Function, onAny?: Function}} bus the global
   * bus — an `Application`, or any emitter exposing `onAny`
   * @param {HTMLElement|string} container host node, or a CSS selector for it
   * @param {Object} [options]
   * @param {number} [options.limit] entries kept on screen
   * @param {number} [options.flushInterval] ms between DOM flushes
   */
  constructor(bus, container, { limit, flushInterval } = {}) {
    this._bus = bus;
    this._limit = limit ?? EventConsole.DEFAULT_LIMIT;
    this._flushInterval = flushInterval ?? EventConsole.FLUSH_INTERVAL;
    this._container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this._build();
  }

  /**
   * Subscribe to the bus and start flushing. Idempotent.
   * @returns {this}
   */
  start() {
    if (this._unsubscribe) {
      return this;
    }

    const watch = (data, name) => this._record(data, name);
    this._unsubscribe = this._bus.addAnyEventListener
      ? this._bus.addAnyEventListener(watch)
      : this._bus.onAny(watch);

    this._timer = setInterval(() => this._flush(), this._flushInterval);
    return this;
  }

  /**
   * Unsubscribe and stop flushing — the panel keeps what it has shown.
   * @returns {this}
   */
  stop() {
    this._unsubscribe?.();
    this._unsubscribe = null;
    clearInterval(this._timer);
    this._timer = null;
    return this;
  }

  /** Drop every entry. @returns {this} */
  clear() {
    this._entries = [];
    this._pending = [];
    this._recent = [];
    this._list.replaceChildren();
    return this;
  }

  /**
   * Show only the entries whose name contains this text.
   * @param {string} text
   * @returns {this}
   */
  setFilter(text) {
    this._filter = String(text ?? '').trim().toLowerCase();
    this._entries.forEach(entry => this._applyFilter(entry));
    return this;
  }

  /** @returns {HTMLElement} the panel's root node */
  getDom() {
    return this._root;
  }

  /** @returns {Array<{type: string, count: number}>} what is currently listed */
  getEntries() {
    return this._entries.map(({ type, count }) => ({ type, count }));
  }

  /**
   * Queue an event. Deliberately does **nothing** to the DOM: this runs on the
   * game loop's clock, {@link _flush} runs on the panel's.
   * @param {Object} data the stamped payload
   * @param {string} name the event name
   */
  _record(data, name) {
    this._pending.push({
      type: data?.type ?? name,
      source: data?.source ?? null,
      at: typeof data?.at === 'number' ? data.at : this._pending.length,
    });
  }

  /** Write everything queued since the last flush, in one pass. */
  _flush() {
    this._updateRate();

    if (this._pending.length === 0) {
      return;
    }

    const pending = this._pending;
    this._pending = [];

    pending.forEach(event => this._append(event));
    this._trim();
    this._list.scrollTop = this._list.scrollHeight;
  }

  /**
   * Add one event — as a counter bump when it repeats the newest entry.
   * @param {{type: string, source: Object, at: number}} event
   */
  _append(event) {
    this._recent.push(event.at);

    const newest = this._entries[this._entries.length - 1];
    if (newest && newest.type === event.type) {
      newest.count += 1;
      newest.source = event.source;
      newest.countNode.textContent = `×${newest.count}`;
      return;
    }

    const entry = this._createEntry(event);
    this._entries.push(entry);
    this._list.appendChild(entry.node);
    this._applyFilter(entry);
  }

  /** Enforce the ring buffer's ceiling. */
  _trim() {
    while (this._entries.length > this._limit) {
      const dropped = this._entries.shift();
      dropped.node.remove();
    }
  }

  /**
   * @param {{type: string, source: Object}} event
   * @returns {{type: string, count: number, source: Object, node: HTMLElement, countNode: HTMLElement}}
   */
  _createEntry(event) {
    const node = document.createElement('li');
    node.className = 'event-console__entry';
    style(node, {
      display: 'flex',
      gap: '8px',
      alignItems: 'baseline',
      padding: '2px 8px',
      cursor: event.source ? 'pointer' : 'default',
      borderBottom: '1px solid rgba(255,255,255,.06)',
    });

    const name = document.createElement('span');
    name.className = 'event-console__name';
    name.textContent = event.type;
    style(name, { flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis' });

    const countNode = document.createElement('span');
    countNode.className = 'event-console__count';
    style(countNode, { opacity: '.55', fontVariantNumeric: 'tabular-nums' });

    const source = document.createElement('span');
    source.className = 'event-console__source';
    source.textContent = labelOf(event.source);
    style(source, { opacity: '.45', flex: '0 0 auto' });

    node.append(name, countNode, source);

    const entry = { type: event.type, count: 1, source: event.source, node, countNode };
    node.addEventListener('click', () => this._highlight(entry.source));

    return entry;
  }

  /**
   * Outline the element an event came from, so a line in the panel maps to
   * something on screen. Restores whatever the node had before.
   * @param {Object|null} source
   */
  _highlight(source) {
    const dom = source?.getDom?.();
    if (!dom?.style) {
      return;
    }

    const previous = dom.style.outline;
    dom.style.outline = '2px solid #ff3ea5';
    setTimeout(() => { dom.style.outline = previous; }, EventConsole.HIGHLIGHT_DURATION);
  }

  /** @param {{type: string, node: HTMLElement}} entry */
  _applyFilter(entry) {
    entry.node.hidden = this._filter !== '' && !entry.type.toLowerCase().includes(this._filter);
  }

  /** Refresh the events-per-second readout, dropping stamps out of the window. */
  _updateRate() {
    const newest = this._recent[this._recent.length - 1] ?? 0;
    this._recent = this._recent.filter(at => newest - at < EventConsole.RATE_WINDOW);
    this._rate.textContent = `${this._recent.length}/s`;
  }

  /** Build the panel: a filter bar over a scrolling list. */
  _build() {
    this._root = document.createElement('div');
    this._root.className = 'event-console';
    style(this._root, {
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '240px',
      font: '12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
      color: '#e8e8ef',
      background: 'rgba(18, 18, 24, .92)',
      border: '1px solid rgba(255,255,255,.12)',
      borderRadius: '8px',
      overflow: 'hidden',
    });

    const bar = document.createElement('div');
    style(bar, {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      padding: '6px 8px',
      borderBottom: '1px solid rgba(255,255,255,.12)',
    });

    this._filterInput = document.createElement('input');
    this._filterInput.type = 'search';
    this._filterInput.placeholder = 'filtrer…';
    this._filterInput.setAttribute('aria-label', 'Filtrer les events');
    style(this._filterInput, {
      flex: '1 1 auto',
      minWidth: '0',
      font: 'inherit',
      color: 'inherit',
      background: 'rgba(255,255,255,.06)',
      border: '1px solid rgba(255,255,255,.14)',
      borderRadius: '4px',
      padding: '2px 6px',
    });
    this._filterInput.addEventListener('input', () => this.setFilter(this._filterInput.value));

    this._rate = document.createElement('span');
    this._rate.textContent = '0/s';
    style(this._rate, { opacity: '.6', flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' });

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.textContent = 'vider';
    style(clearButton, {
      font: 'inherit',
      color: 'inherit',
      background: 'rgba(255,255,255,.06)',
      border: '1px solid rgba(255,255,255,.14)',
      borderRadius: '4px',
      padding: '2px 8px',
      cursor: 'pointer',
    });
    clearButton.addEventListener('click', () => this.clear());

    bar.append(this._filterInput, this._rate, clearButton);

    this._list = document.createElement('ol');
    this._list.className = 'event-console__list';
    style(this._list, {
      flex: '1 1 auto',
      margin: '0',
      padding: '0',
      listStyle: 'none',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
    });

    this._root.append(bar, this._list);
    this._container?.appendChild(this._root);
  }
}

/**
 * @param {HTMLElement} node
 * @param {Object<string, string>} declarations
 */
function style(node, declarations) {
  Object.assign(node.style, declarations);
}

/**
 * A short, human-readable name for what emitted an event.
 * @param {Object|null} source
 * @returns {string}
 */
function labelOf(source) {
  return source?.constructor?.name ?? '';
}
