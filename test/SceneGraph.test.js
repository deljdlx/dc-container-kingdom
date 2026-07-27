// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Application, Element } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

describe('SceneGraph', () => {
  it('addChild() wires parent, application, coordinates and name lookup', () => {
    const root = new Element(100, 200, 0, 0);
    const child = new Element(0, 0, 5, 5);

    root.scene.addChild(10, 20, child, 'hero');

    expect(root.scene.getChildren()).toContain(child);
    expect(root.scene.getChildByName('hero')).toBe(child);
    expect(child.getParent()).toBe(root);
    expect(child.getApplication()).toBe(root.getApplication());
    expect(child.x()).toBe(10);
    expect(child.y()).toBe(20);
  });

  it('getAllChildren() flattens the subtree depth-first', () => {
    const root = new Element();
    const child = root.scene.addChild(10, 20, new Element(), 'child');
    const grandChild = child.scene.addChild(3, 4, new Element(), 'grand-child');

    expect(root.scene.getAllChildren()).toEqual([child, grandChild]);
  });

  it('removeChild() prunes both the children list and the name index', () => {
    const root = new Element();
    const kept = root.scene.addChild(0, 0, new Element(), 'kept');
    const removed = root.scene.addChild(0, 0, new Element(), 'removed');

    root.scene.removeChild(removed);

    expect(root.scene.getChildren()).toEqual([kept]);
    expect(() => root.scene.getChildByName('removed')).toThrow();
  });

  it('offsetX/offsetY use the parent chain while getRelativeToOffsets uses the relativeTo chain', () => {
    const root = new Element(100, 200, 0, 0);
    const child = root.scene.addChild(10, 20, new Element(), 'child');
    const grandChild = child.scene.addChild(3, 4, new Element(), 'grand-child');

    expect(grandChild.scene.offsetX()).toBe(113);
    expect(grandChild.scene.offsetY()).toBe(224);
    expect(grandChild.scene.getRelativeToOffsets()).toEqual({ x: 13, y: 24 });
  });
});
