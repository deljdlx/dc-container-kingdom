// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Element } from '../src/engine/index.js';

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

describe('Element — collision detection', () => {
  /** An element whose collision box spans [x, x+size] on both axes. */
  function collider(x, y, size = 50) {
    const el = new Element(x, y, size, size);
    el.createCollisionZone(0, 0, size, size);
    return el;
  }

  it('detects overlapping colliders and returns the target', () => {
    const a = collider(0, 0);
    const b = collider(10, 10); // overlaps a in absolute space

    expect(a.getCollision(b)).toEqual([b]);
    expect(a.collided()).toBe(true);
    expect(b.collided()).toBe(true);
  });

  it('reports no collision for distant colliders', () => {
    const a = collider(0, 0);
    const b = collider(1000, 1000);

    expect(a.getCollision(b)).toBe(false);
  });

  it('fires element.collision on both parties, bubbling to the application', () => {
    const a = collider(0, 0);
    const b = collider(10, 10);
    const onA = vi.fn();
    const onB = vi.fn();
    a.addEventListener('element.collision', onA);
    b.addEventListener('element.collision', onB);

    a.getCollision(b);

    expect(onA).toHaveBeenCalled();
    expect(onB).toHaveBeenCalled();
    expect(Application.mainInstance.handle).toHaveBeenCalledWith(
      'element.collision',
      expect.anything(),
    );
  });

  it('detects trigger overlaps separately via getTrigger', () => {
    const a = new Element(0, 0, 50, 50);
    a.createCollisionZone(0, 0, 50, 50);
    const b = new Element(10, 10, 50, 50);
    b.createTriggerZone(0, 0, 50, 50);

    expect(a.getTrigger(b)).toEqual([b]);
  });

  it('clears collision state and fires the end event', () => {
    const a = collider(0, 0);
    const b = collider(10, 10);
    const onEnd = vi.fn();
    a.addEventListener('element.collision.end', onEnd);

    a.getCollision(b);
    a.clearCollision();

    expect(a.collided()).toBe(false);
    expect(onEnd).toHaveBeenCalled();
  });

  it('reconciles by diff: start fires once while overlapping, end once when it stops', () => {
    const a = collider(0, 0);
    const b = collider(10, 10);
    const onStart = vi.fn();
    const onEnd = vi.fn();
    a.addEventListener('element.collision', onStart);
    a.addEventListener('element.collision.end', onEnd);

    a.getCollision(b); // frame 1 → start
    a.getCollision(b); // frame 2 → still overlapping, no new start
    a.getCollision(b); // frame 3 → still overlapping
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();

    b.x(1000);
    b.y(1000);
    a.getCollision(b); // no longer overlapping → end once
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
