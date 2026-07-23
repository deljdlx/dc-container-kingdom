// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application } from '../src/assets/js/map/Application.js';
import { Element } from '../src/assets/js/map/Element.js';

// Characterization tests: they lock in the CURRENT behaviour of the map-engine
// base class so it can be refactored safely. Element reads
// Application.mainInstance in its constructor and bubbles events to it.
beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

describe('Element — geometry', () => {
  it('delegates x/y/width/height to its Geometry', () => {
    const el = new Element(10, 20, 30, 40);
    expect(el.x()).toBe(10);
    expect(el.y()).toBe(20);
    expect(el.width()).toBe(30);
    expect(el.height()).toBe(40);

    el.x(99);
    expect(el.x()).toBe(99);
  });

  it('accumulates offsets through the parent chain', () => {
    const parent = new Element(100, 200, 0, 0);
    const child = parent.addElement(10, 20, new Element(0, 0, 5, 5));
    expect(child.offsetX()).toBe(110);
    expect(child.offsetY()).toBe(220);
  });
});

describe('Element — scene graph', () => {
  it('adds children and wires parent + application', () => {
    const root = new Element();
    const child = root.addElement(0, 0, new Element());
    expect(root.getChildren()).toContain(child);
    expect(child.getParent()).toBe(root);
    expect(child.getApplication()).toBe(root.getApplication());
  });

  it('looks up children by name and throws for unknown names', () => {
    const root = new Element();
    const child = root.addElement(0, 0, new Element(), 'hero');
    expect(root.getChildByName('hero')).toBe(child);
    expect(() => root.getChildByName('ghost')).toThrow();
  });

  it('traverses the whole subtree with getAllChildren', () => {
    const root = new Element();
    const a = root.addElement(0, 0, new Element(), 'a');
    const b = a.addElement(0, 0, new Element(), 'b');
    expect(root.getAllChildren()).toEqual(expect.arrayContaining([a, b]));
  });

  it('removes a child by reference', () => {
    const root = new Element();
    const child = root.addElement(0, 0, new Element(), 'x');
    root.removeChild(child);
    expect(root.getChildren()).not.toContain(child);
    expect(() => root.getChildByName('x')).toThrow();
  });
});

describe('Element — events', () => {
  it('invokes registered listeners and bubbles to the application', () => {
    const el = new Element(0, 0, 10, 10);
    const listener = vi.fn();
    el.addEventListener('ping', listener);

    el.handle('ping', { value: 1 });

    expect(listener).toHaveBeenCalledWith({ value: 1 });
    expect(Application.mainInstance.handle).toHaveBeenCalledWith('ping', { value: 1 });
  });

  it('emits element.click when its DOM node is clicked', () => {
    const el = new Element(0, 0, 10, 10);
    const listener = vi.fn();
    el.addEventListener('element.click', listener);

    el.getDom().dispatchEvent(new window.Event('click'));

    expect(listener).toHaveBeenCalled();
  });
});

describe('Element — collision zones', () => {
  it('registers collision and trigger zones', () => {
    const el = new Element(0, 0, 50, 50);
    const collision = el.createCollisionZone(0, 0, 10, 10);
    const trigger = el.createTriggerZone(0, 0, 10, 10);

    expect(el.getCollisionZones('collision')).toContain(collision);
    expect(el.getCollisionZones('trigger')).toContain(trigger);
  });

  it('reports no collision against itself', () => {
    const el = new Element(0, 0, 50, 50);
    expect(el.getCollision(el)).toBe(false);
  });
});
