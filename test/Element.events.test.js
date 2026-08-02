// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, EngineEvents, Element } from '../src/engine/index.js';

/** A stand-in for the global bus: records what reaches it. */
function fakeApplication() {
  return { handle: vi.fn() };
}

beforeEach(() => {
  // The engine base class reads Application.mainInstance in its constructor.
  Application.mainInstance = fakeApplication();
});

describe('Element - emitting', () => {
  it('stamps the envelope on the local payload', () => {
    const element = new Element(0, 0, 10, 10);
    const listener = vi.fn();
    element.addEventListener('element.click', listener);

    element.handle(EngineEvents.ELEMENT_CLICK, { areaX: 3 });

    const event = listener.mock.calls[0][0];
    expect(event.type).toBe(EngineEvents.ELEMENT_CLICK);
    expect(event.source).toBe(element);
    expect(typeof event.at).toBe('number');
    expect(event.areaX).toBe(3);
  });

  it('relays the very same stamped event to the application bus', () => {
    const element = new Element(0, 0, 10, 10);
    const local = vi.fn();
    element.addEventListener('element.click', local);

    element.handle(EngineEvents.ELEMENT_CLICK);

    const relayed = Application.mainInstance.handle.mock.calls[0][1];
    expect(relayed).toBe(local.mock.calls[0][0]);
    expect(relayed.source).toBe(element);
  });

  it('stays silent instead of throwing when it has no application', () => {
    // The case the catalogue hits (elements built before being attached), and
    // the one anything spawning an entity mid-flight will hit.
    Application.mainInstance = undefined;
    const orphan = new Element(0, 0, 10, 10);
    const listener = vi.fn();
    orphan.addEventListener('element.click', listener);

    expect(() => orphan.handle(EngineEvents.ELEMENT_CLICK)).not.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('hands back an unsubscribe function', () => {
    const element = new Element(0, 0, 10, 10);
    const listener = vi.fn();

    const unsubscribe = element.addEventListener('element.click', listener);
    expect(typeof unsubscribe).toBe('function');

    unsubscribe();
    element.handle(EngineEvents.ELEMENT_CLICK);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('Element - the destroy event', () => {
  it('announces its departure on the global bus', () => {
    const element = new Element(0, 0, 10, 10);

    element.destroy();

    const [name, event] = Application.mainInstance.handle.mock.calls[0];
    expect(name).toBe(EngineEvents.ELEMENT_DESTROY);
    expect(event.source).toBe(element);
    expect(event.element).toBe(element);
  });

  it('fires BEFORE detaching, so a listener can still walk the subtree', () => {
    const parent = new Element(0, 0, 100, 100);
    const child = new Element(0, 0, 10, 10);
    parent.addElement(5, 5, child, 'child');

    const grandChild = new Element(0, 0, 4, 4);
    child.addElement(1, 1, grandChild, 'grand');

    let seen = null;
    child.addEventListener(EngineEvents.ELEMENT_DESTROY, event => {
      seen = {
        parent: event.source.getParent(),
        children: event.source.getChildren().length,
      };
    });

    child.destroy();

    // Emitting after scene.reset() would have handed the listener an orphan
    // with no children — exactly what it needs to let go of.
    expect(seen.parent).toBe(parent);
    expect(seen.children).toBe(1);
    expect(child.getChildren()).toHaveLength(0);
  });

  it('does not throw for an element that was never attached', () => {
    Application.mainInstance = undefined;
    const orphan = new Element(0, 0, 10, 10);

    expect(() => orphan.destroy()).not.toThrow();
  });
});
