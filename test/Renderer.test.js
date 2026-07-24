// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Element, House00, Tree00 } from '../src/engine/index.js';

// The engine base class reads Application.mainInstance in its constructor.
beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

describe('Renderer — idempotent rendering', () => {
  it('addShadow() creates the shadow once, not one per call', () => {
    const el = new Element(0, 0, 50, 50);
    el.getRenderer().addShadow();
    el.getRenderer().addShadow();

    expect(el.getDom().querySelectorAll('.map-element__shadow').length).toBe(1);
  });

  it('renderBoundingBox() does not duplicate the debug box', () => {
    const el = new Element(0, 0, 50, 50);
    el.getRenderer().renderBoundingBox();
    el.getRenderer().renderBoundingBox();

    expect(el.getDom().querySelectorAll('.map-element__bounding-box').length).toBe(1);
  });

  it('re-rendering a House keeps a single shadow (was: leaked one per render)', () => {
    const house = new House00();
    house.render();
    house.render();
    house.render();

    expect(house.getDom().querySelectorAll('.map-element__shadow').length).toBe(1);
  });

  it('re-rendering a Tree keeps a single shadow', () => {
    const tree = new Tree00();
    tree.render();
    tree.render();

    expect(tree.getDom().querySelectorAll('.map-element__shadow').length).toBe(1);
  });

  it('render() repositions without spawning extra DOM', () => {
    const el = new Element(10, 20, 30, 40);
    el.render();
    const childCount = el.getDom().children.length;

    el.x(99);
    el.render();

    expect(el.getDom().style.left).toBe('99px');
    expect(el.getDom().children.length).toBe(childCount);
  });
});
