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

  it('returns the listener index within its name bucket', () => {
    const emitter = new EventEmitter();
    expect(emitter.on('x', () => {})).toBe(0);
    expect(emitter.on('x', () => {})).toBe(1);
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
});
