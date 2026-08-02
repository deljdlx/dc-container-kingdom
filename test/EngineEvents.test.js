import { describe, it, expect } from 'vitest';
import {
  EngineEvents,
  collisionEventName,
  engineEventNames,
  makeEvent,
} from '../src/engine/index.js';

describe('EngineEvents - the catalogue', () => {
  it('keeps the names the engine has always emitted', () => {
    // The catalogue declares the public surface; it must not rename it.
    expect(EngineEvents.ELEMENT_CLICK).toBe('element.click');
    expect(EngineEvents.ELEMENT_COLLISION).toBe('element.collision');
    expect(EngineEvents.ELEMENT_COLLISION_END).toBe('element.collision.end');
    expect(EngineEvents.ELEMENT_TRIGGER).toBe('element.trigger');
    expect(EngineEvents.ELEMENT_TRIGGER_END).toBe('element.trigger.end');
    expect(EngineEvents.ELEMENT_REACTION_SHOW).toBe('element.reaction.show');
    expect(EngineEvents.ELEMENT_REACTION_HIDE).toBe('element.reaction.hide');
    expect(EngineEvents.AREA_CLICK).toBe('area.click');
    expect(EngineEvents.MAP_UPDATE).toBe('map.update');
  });

  it('is frozen — a catalogue a host can edit is not one', () => {
    expect(Object.isFrozen(EngineEvents)).toBe(true);
  });

  it('has no duplicate value', () => {
    const names = engineEventNames();
    expect(new Set(names).size).toBe(names.length);
  });

  it('lists every declared name', () => {
    expect(engineEventNames()).toContain(EngineEvents.ELEMENT_DESTROY);
  });
});

describe('collisionEventName', () => {
  it('pairs each start with the matching end', () => {
    expect(collisionEventName('collision', 'start')).toBe(EngineEvents.ELEMENT_COLLISION);
    expect(collisionEventName('collision', 'end')).toBe(EngineEvents.ELEMENT_COLLISION_END);
    expect(collisionEventName('trigger', 'start')).toBe(EngineEvents.ELEMENT_TRIGGER);
    expect(collisionEventName('trigger', 'end')).toBe(EngineEvents.ELEMENT_TRIGGER_END);
  });

  it('keeps a pair on the same prefix', () => {
    // The regression this replaces: a start built from a per-element prefix and
    // an end hard-coding 'element.' could name two unrelated events.
    ['collision', 'trigger'].forEach(type => {
      const start = collisionEventName(type, 'start');
      expect(collisionEventName(type, 'end')).toBe(`${start}.end`);
    });
  });

  it('throws on an unknown type rather than emitting into the void', () => {
    expect(() => collisionEventName('proximity', 'start')).toThrow(/proximity/);
  });
});

describe('makeEvent - the envelope', () => {
  it('stamps type, source and a numeric timestamp over the payload', () => {
    const source = { name: 'emitter' };
    const event = makeEvent('element.destroy', source, { element: source });

    expect(event.type).toBe('element.destroy');
    expect(event.source).toBe(source);
    expect(typeof event.at).toBe('number');
    expect(event.element).toBe(source);
  });

  it('keeps an explicit source over the emitting object', () => {
    const emitter = { id: 'relay' };
    const origin = { id: 'origin' };

    expect(makeEvent('x', emitter, { source: origin }).source).toBe(origin);
  });

  it('passes an already-stamped payload through, so bubbling does not re-date it', () => {
    const origin = { id: 'origin' };
    const relay = { id: 'relay' };
    const stamped = makeEvent('element.click', origin);

    const relayed = makeEvent('element.click', relay, stamped);

    expect(relayed).toBe(stamped);
    expect(relayed.source).toBe(origin);
  });

  it('re-stamps when the name differs, so a relay cannot mislabel an event', () => {
    const stamped = makeEvent('element.click', { id: 'a' });
    const other = makeEvent('area.click', { id: 'b' }, stamped);

    expect(other).not.toBe(stamped);
    expect(other.type).toBe('area.click');
  });

  it('defaults the payload to an empty one', () => {
    expect(makeEvent('tick', null).type).toBe('tick');
  });
});
