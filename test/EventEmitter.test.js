import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/engine/index.js';

describe('EventEmitter', () => {
  it('calls every listener registered for a name with the payload', () => {
    const emitter = new EventEmitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on('move', a);
    emitter.on('move', b);

    emitter.emit('move', { x: 1 });

    expect(a).toHaveBeenCalledWith({ x: 1 });
    expect(b).toHaveBeenCalledWith({ x: 1 });
  });

  it('defaults the payload to an empty object', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.on('tick', listener);

    emitter.emit('tick');

    expect(listener).toHaveBeenCalledWith({});
  });

  it('ignores emits for names with no listeners', () => {
    const emitter = new EventEmitter();
    expect(() => emitter.emit('nobody')).not.toThrow();
  });

  it('does not mistake Object.prototype members for listener buckets', () => {
    const emitter = new EventEmitter();
    // A plain-object registry would have found Object.prototype.constructor
    // here and tried to push onto a function.
    expect(() => emitter.on('constructor', () => {})).not.toThrow();
    expect(() => emitter.emit('toString')).not.toThrow();
  });
});

describe('EventEmitter - revocable subscriptions', () => {
  it('returns an unsubscribe function that stops the listener', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();

    const unsubscribe = emitter.on('hit', listener);
    emitter.emit('hit');
    unsubscribe();
    emitter.emit('hit');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribing twice is harmless', () => {
    const emitter = new EventEmitter();
    const unsubscribe = emitter.on('hit', () => {});

    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
    expect(emitter.listenerCount('hit')).toBe(0);
  });

  it('off() reports whether it removed anything', () => {
    const emitter = new EventEmitter();
    const listener = () => {};
    emitter.on('hit', listener);

    expect(emitter.off('hit', () => {})).toBe(false);
    expect(emitter.off('miss', listener)).toBe(false);
    expect(emitter.off('hit', listener)).toBe(true);
  });

  it('counts listeners per name and in total', () => {
    const emitter = new EventEmitter();
    emitter.on('a', () => {});
    emitter.on('a', () => {});
    emitter.on('b', () => {});

    expect(emitter.listenerCount('a')).toBe(2);
    expect(emitter.listenerCount('absent')).toBe(0);
    expect(emitter.listenerCount()).toBe(3);
  });
});

describe('EventEmitter - mutating during an emission', () => {
  it('does not skip the next listener when one unsubscribes itself', () => {
    const emitter = new EventEmitter();
    const second = vi.fn();
    const third = vi.fn();

    const unsubscribeFirst = emitter.on('hit', () => unsubscribeFirst());
    emitter.on('hit', second);
    emitter.on('hit', third);

    emitter.emit('hit');

    // The classic bug: splicing the live array shifts the indices under the
    // loop, and the listener right after the removed one is never called.
    expect(second).toHaveBeenCalledTimes(1);
    expect(third).toHaveBeenCalledTimes(1);
  });

  it('does not call a listener added during the emission that added it', () => {
    const emitter = new EventEmitter();
    const late = vi.fn();
    emitter.on('hit', () => emitter.on('hit', late));

    emitter.emit('hit');
    expect(late).not.toHaveBeenCalled();

    emitter.emit('hit');
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('still calls a listener removed by an earlier one in the same emission', () => {
    const emitter = new EventEmitter();
    const doomed = vi.fn();

    emitter.on('hit', () => emitter.off('hit', doomed));
    emitter.on('hit', doomed);

    emitter.emit('hit');
    expect(doomed).toHaveBeenCalledTimes(1);

    emitter.emit('hit');
    expect(doomed).toHaveBeenCalledTimes(1);
  });
});

describe('EventEmitter - watching everything', () => {
  it('gives a watcher the payload and the name of every event', () => {
    const emitter = new EventEmitter();
    const watcher = vi.fn();
    emitter.onAny(watcher);

    emitter.emit('spawn', { id: 1 });
    emitter.emit('die', { id: 2 });

    expect(watcher).toHaveBeenNthCalledWith(1, { id: 1 }, 'spawn');
    expect(watcher).toHaveBeenNthCalledWith(2, { id: 2 }, 'die');
  });

  it('lets a watcher unsubscribe', () => {
    const emitter = new EventEmitter();
    const watcher = vi.fn();

    emitter.onAny(watcher)();
    emitter.emit('spawn');

    expect(watcher).not.toHaveBeenCalled();
  });

  it('runs watchers alongside named listeners, not instead of them', () => {
    const emitter = new EventEmitter();
    const named = vi.fn();
    const watcher = vi.fn();
    emitter.on('spawn', named);
    emitter.onAny(watcher);

    emitter.emit('spawn');

    expect(named).toHaveBeenCalledTimes(1);
    expect(watcher).toHaveBeenCalledTimes(1);
  });

  it('does not skip the next watcher when one unsubscribes itself', () => {
    const emitter = new EventEmitter();
    const second = vi.fn();

    const unsubscribe = emitter.onAny(() => unsubscribe());
    emitter.onAny(second);

    emitter.emit('spawn');

    expect(second).toHaveBeenCalledTimes(1);
  });
});
