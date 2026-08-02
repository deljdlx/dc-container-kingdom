// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventConsole, EventEmitter } from '../src/engine/index.js';

/** The slice of Application the console uses: a bus that can be watched. */
class FakeBus {
  _events = new EventEmitter();
  addAnyEventListener(callback) { return this._events.onAny(callback); }
  emit(name, data = {}) { this._events.emit(name, { type: name, at: 0, ...data }); }
}

let bus;
let host;
let console_;

beforeEach(() => {
  vi.useFakeTimers();
  bus = new FakeBus();
  host = document.createElement('div');
  document.body.appendChild(host);
  console_ = new EventConsole(bus, host, { flushInterval: 100 }).start();
});

afterEach(() => {
  console_.stop();
  vi.useRealTimers();
  host.remove();
});

/** Advance past one flush. */
const flush = () => vi.advanceTimersByTime(100);

const lines = () => host.querySelectorAll('.event-console__entry');

describe('EventConsole - batching', () => {
  it('writes nothing to the DOM until the flush timer fires', () => {
    bus.emit('element.click');
    bus.emit('element.collision');

    // The whole point: events arrive on the game loop's clock, the DOM is
    // written on the panel's. An observer must not become a per-frame writer.
    expect(lines()).toHaveLength(0);

    flush();
    expect(lines()).toHaveLength(2);
  });

  it('does not touch the list when nothing was emitted', () => {
    flush();
    expect(lines()).toHaveLength(0);
  });

  it('stops recording once stopped', () => {
    console_.stop();
    bus.emit('element.click');
    flush();

    expect(lines()).toHaveLength(0);
  });

  it('starting twice does not subscribe twice', () => {
    console_.start();
    bus.emit('element.click');
    flush();

    expect(console_.getEntries()).toEqual([{ type: 'element.click', count: 1 }]);
  });
});

describe('EventConsole - coalescing', () => {
  it('folds a repeated event into one line with a counter', () => {
    for (let i = 0; i < 60; i += 1) {
      bus.emit('map.update');
    }
    flush();

    // Without this, one second of walking is 60 lines and the panel is unusable.
    expect(lines()).toHaveLength(1);
    expect(console_.getEntries()).toEqual([{ type: 'map.update', count: 60 }]);
    expect(host.querySelector('.event-console__count').textContent).toBe('×60');
  });

  it('only folds consecutive events, so interleaving still reads', () => {
    bus.emit('map.update');
    bus.emit('element.collision');
    bus.emit('map.update');
    flush();

    expect(console_.getEntries()).toEqual([
      { type: 'map.update', count: 1 },
      { type: 'element.collision', count: 1 },
      { type: 'map.update', count: 1 },
    ]);
  });

  it('folds across flushes too', () => {
    bus.emit('map.update');
    flush();
    bus.emit('map.update');
    flush();

    expect(console_.getEntries()).toEqual([{ type: 'map.update', count: 2 }]);
  });
});

describe('EventConsole - the ceiling', () => {
  it('drops the oldest entries past the limit', () => {
    const bounded = new EventConsole(bus, host, { limit: 3, flushInterval: 100 }).start();

    for (let i = 0; i < 10; i += 1) {
      bus.emit(`event.${i}`);
    }
    flush();

    // A console without a ring buffer leaks exactly like what it watches.
    expect(bounded.getEntries().map(entry => entry.type))
      .toEqual(['event.7', 'event.8', 'event.9']);
    bounded.stop();
  });
});

describe('EventConsole - filtering', () => {
  it('hides the entries whose name does not match', () => {
    bus.emit('map.update');
    bus.emit('element.collision');
    flush();

    console_.setFilter('collision');

    const [first, second] = lines();
    expect(first.hidden).toBe(true);
    expect(second.hidden).toBe(false);
  });

  it('applies the filter to entries arriving later', () => {
    console_.setFilter('collision');
    bus.emit('map.update');
    flush();

    expect(lines()[0].hidden).toBe(true);
  });

  it('an empty filter shows everything again', () => {
    bus.emit('map.update');
    flush();
    console_.setFilter('collision');
    console_.setFilter('   ');

    expect(lines()[0].hidden).toBe(false);
  });
});

describe('EventConsole - reading an entry', () => {
  it('names the source class next to the event', () => {
    class Fountain00 {}
    bus.emit('element.click', { source: new Fountain00() });
    flush();

    expect(host.querySelector('.event-console__source').textContent).toBe('Fountain00');
  });

  it('outlines the source element when the line is clicked, then restores it', () => {
    const dom = document.createElement('div');
    dom.style.outline = 'none';
    bus.emit('element.click', { source: { getDom: () => dom } });
    flush();

    lines()[0].click();
    expect(dom.style.outline).toContain('2px solid');

    vi.advanceTimersByTime(EventConsole.HIGHLIGHT_DURATION);
    expect(dom.style.outline).toBe('none');
  });

  it('a source with no DOM node is simply not clickable', () => {
    bus.emit('element.click', { source: { id: 'headless' } });
    flush();

    expect(() => lines()[0].click()).not.toThrow();
  });

  it('writes event text as text, never as markup', () => {
    bus.emit('<img src=x onerror=alert(1)>');
    flush();

    const name = host.querySelector('.event-console__name');
    expect(name.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(name.querySelector('img')).toBeNull();
  });
});

describe('EventConsole - clearing', () => {
  it('empties the list and the model', () => {
    bus.emit('map.update');
    flush();

    console_.clear();

    expect(lines()).toHaveLength(0);
    expect(console_.getEntries()).toEqual([]);
  });
});
