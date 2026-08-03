// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Element } from '../src/engine/index.js';

beforeEach(() => {
  // The engine base class reads Application.mainInstance in its constructor.
  Application.mainInstance = { handle: vi.fn() };
});

/** A parent/child/grandchild chain, all freshly attached. */
function chain() {
  const grandParent = new Element(0, 0, 100, 100);
  const parent = new Element(0, 0, 50, 50);
  const child = new Element(0, 0, 10, 10);
  grandParent.addElement(0, 0, parent, 'p');
  parent.addElement(0, 0, child, 'c');
  return { grandParent, parent, child };
}

describe('Element - the redraw flag', () => {
  it('raising it marks the whole path to the root, so the walk can prune', () => {
    const { grandParent, parent, child } = chain();
    [grandParent, parent, child].forEach(node => node.needUpdate(false));

    child.needUpdate(true);

    expect(child.needUpdate()).toBe(true);
    expect(parent.needUpdate()).toBe(true);
    expect(grandParent.needUpdate()).toBe(true);
  });

  it('clearing it speaks only for the node itself', () => {
    const { grandParent, parent, child } = chain();
    grandParent.needUpdate(true);

    child.needUpdate(false);

    expect(child.needUpdate()).toBe(false);
    expect(parent.needUpdate()).toBe(true);
    expect(grandParent.needUpdate()).toBe(true);
  });

  it('a child finishing its update leaves its ancestors alone', () => {
    const { grandParent, parent, child } = chain();
    grandParent.needUpdate(true);
    parent.needUpdate(true);
    child.needUpdate(true);

    child.update();

    expect(child.needUpdate()).toBe(false);
    // The defect: a node used to clear the flag of everything above it.
    expect(parent.needUpdate()).toBe(true);
    expect(grandParent.needUpdate()).toBe(true);
  });

  it('does not lose a sibling\'s redraw request', () => {
    const parent = new Element(0, 0, 100, 100);
    const first = new Element(0, 0, 10, 10);
    const second = new Element(0, 0, 10, 10);
    parent.addElement(0, 0, first, 'a');
    parent.addElement(0, 0, second, 'b');
    [parent, first, second].forEach(node => node.needUpdate(false));

    second.needUpdate(true);
    first.update();

    // `first` is done; that says nothing about what `second` asked for.
    expect(second.needUpdate()).toBe(true);
    expect(parent.needUpdate()).toBe(true);
  });

  it('keeps a request a node raises while it is being painted', () => {
    const parent = new Element(0, 0, 100, 100);
    const child = new Element(0, 0, 10, 10);
    parent.addElement(0, 0, child, 'c');
    [parent, child].forEach(node => node.needUpdate(false));

    child.needUpdate(true);
    // A node asking for another pass from inside its own paint — an animation
    // frame, a collision flip. Clearing the flag before the work is what makes
    // this survive; clearing after would wipe it the instant it was raised.
    vi.spyOn(child.getRenderer(), 'update').mockImplementation(() => {
      child.needUpdate(true);
    });

    parent.update();

    expect(child.needUpdate()).toBe(true);
    expect(parent.needUpdate()).toBe(true);   // marked again, so the walk returns
  });
});

describe('Element - pruning', () => {
  it('does not descend into a clean subtree', () => {
    const { grandParent, parent, child } = chain();
    [grandParent, parent, child].forEach(node => node.needUpdate(false));
    const parentRender = vi.spyOn(parent.getRenderer(), 'update');
    const childRender = vi.spyOn(child.getRenderer(), 'update');

    grandParent.update();

    // A still world costs the root's own check and nothing else.
    expect(parentRender).not.toHaveBeenCalled();
    expect(childRender).not.toHaveBeenCalled();
  });

  it('descends the marked path when a leaf asks for a redraw', () => {
    const { grandParent, parent, child } = chain();
    [grandParent, parent, child].forEach(node => node.needUpdate(false));
    const childRender = vi.spyOn(child.getRenderer(), 'update');

    child.needUpdate(true);
    grandParent.update();

    expect(childRender).toHaveBeenCalledTimes(1);
  });

  it('reaches an element attached after the last pass', () => {
    const root = new Element(0, 0, 100, 100);
    root.update();
    root.needUpdate(false);

    const late = new Element(0, 0, 10, 10);
    const walked = vi.spyOn(late, 'update');
    root.addElement(5, 5, late, 'late');

    root.update();

    // What a spawned entity depends on: joining the tree is enough for the walk
    // to come to it. Putting its node in the DOM is the renderer's job from
    // there (BoardRenderer.mountPending), covered at integration level.
    expect(walked).toHaveBeenCalledTimes(1);
  });
});
