// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, EngineEvents, Element } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

/**
 * Mount a subtree the way the board does: **every node in the same root**, not
 * nested inside its parent's node. That placement is what makes removing one
 * node take nothing with it.
 * @param {Element[]} elements
 * @returns {HTMLElement} the shared root
 */
function mountFlat(elements) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  elements.forEach(element => root.appendChild(element.getDom()));
  return root;
}

describe('Element.destroy - taking the subtree off the page', () => {
  it('removes the nodes of its descendants, not only its own', () => {
    const area = new Element(0, 0, 100, 100);
    const house = new Element(0, 0, 20, 20);
    const chimney = new Element(0, 0, 5, 5);
    area.addElement(10, 10, house, 'house');
    house.addElement(2, 2, chimney, 'chimney');
    mountFlat([area, house, chimney]);

    expect(document.contains(house.getDom())).toBe(true);
    expect(document.contains(chimney.getDom())).toBe(true);

    area.destroy();

    // The leak this replaces: only the area's own node used to go, and every
    // element it carried stayed in the page for the rest of the session.
    expect(document.contains(area.getDom())).toBe(false);
    expect(document.contains(house.getDom())).toBe(false);
    expect(document.contains(chimney.getDom())).toBe(false);
  });

  it('still lets a listener walk the subtree before it goes', () => {
    const area = new Element(0, 0, 100, 100);
    const house = new Element(0, 0, 20, 20);
    area.addElement(10, 10, house, 'house');
    mountFlat([area, house]);

    let seen = null;
    area.addEventListener(EngineEvents.ELEMENT_DESTROY, event => {
      seen = {
        children: event.source.getChildren().length,
        childStillMounted: document.contains(house.getDom()),
      };
    });

    area.destroy();

    // The event comes first, and the page is still intact when it does — an FX
    // binder needs both to let go of what it holds.
    expect(seen).toEqual({ children: 1, childStillMounted: true });
  });

  it('empties the tree after clearing, never before', () => {
    const area = new Element(0, 0, 100, 100);
    const house = new Element(0, 0, 20, 20);
    area.addElement(10, 10, house, 'house');
    mountFlat([area, house]);
    const houseClear = vi.spyOn(house, 'clear');

    area.destroy();

    // Resetting the scene first would have left the DOM walk nothing to visit.
    expect(houseClear).toHaveBeenCalledTimes(1);
    expect(area.getChildren()).toHaveLength(0);
  });

  it('is no longer listed by its parent', () => {
    const parent = new Element(0, 0, 100, 100);
    const child = new Element(0, 0, 10, 10);
    parent.addElement(0, 0, child, 'c');

    child.destroy();

    expect(parent.getChildren()).toHaveLength(0);
    // Note: the destroyed node still points *back* at its ex-parent — the scene
    // graph only clears the downward link. Pre-existing, out of this ticket's
    // scope, deposited as a follow-up candidate.
  });

  it('does not throw for an element that was never mounted', () => {
    const orphan = new Element(0, 0, 10, 10);
    expect(() => orphan.destroy()).not.toThrow();
  });
});
