// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Board, Element } from '../src/engine/index.js';

/** A viewport double: enough for a Board to exist. */
function fakeViewport(application) {
  return {
    width: () => 900,
    height: () => 560,
    getApplication: () => application,
  };
}

let application;
let board;

beforeEach(() => {
  application = { handle: vi.fn() };
  Application.mainInstance = application;
  board = new Board(fakeViewport(application));
});

describe('Board - the entity layer', () => {
  it('is created on first spawn, not before', () => {
    expect(board.getEntities()).toEqual([]);

    board.spawn(new Element(0, 0, 10, 10), 100, 200);

    expect(board.getEntities()).toHaveLength(1);
  });

  it('places entities in world coordinates', () => {
    const arrow = board.spawn(new Element(0, 0, 10, 10), 1500, 2200);

    // The layer sits at the board's origin, so an entity's own offsets are
    // world offsets — what an object crossing areas needs.
    expect(arrow.offsetX()).toBe(1500);
    expect(arrow.offsetY()).toBe(2200);
  });

  it('reuses the same layer for every entity', () => {
    board.spawn(new Element(0, 0, 10, 10), 0, 0);
    board.spawn(new Element(0, 0, 10, 10), 50, 50);

    expect(board.getEntities()).toHaveLength(2);
    expect(board.getChildByName('entities')).toBeTruthy();
  });

  it('keeps the layer out of the area grid', () => {
    board.spawn(new Element(0, 0, 10, 10), 0, 0);

    // freeArea() only ever destroys what it tracks in `areas`.
    expect(board.getAreas()).toEqual({});
  });
});

describe('Board - entities survive streaming', () => {
  it('an entity outlives the area it was spawned over', () => {
    board.loadArea(0, 0);
    const arrow = board.spawn(new Element(0, 0, 10, 10), 300, 300);

    board.freeArea(0, 0);

    // The whole point of the layer: a projectile does not die because the tile
    // it flew over scrolled away.
    expect(board.areaExistsAt(0, 0)).toBe(false);
    expect(board.getEntities()).toContain(arrow);
    expect(arrow.getParent()).toBeTruthy();
  });

  it('freeing every area leaves the entities alone', () => {
    board.loadArea(0, 0);
    board.loadArea(1, 0);
    board.spawn(new Element(0, 0, 10, 10), 10, 10);
    board.spawn(new Element(0, 0, 10, 10), 20, 20);

    board.freeArea(0, 0);
    board.freeArea(1, 0);

    expect(board.getEntities()).toHaveLength(2);
  });
});

describe('Board - despawning', () => {
  it('takes the entity off the world', () => {
    const arrow = board.spawn(new Element(0, 0, 10, 10), 0, 0);

    board.despawn(arrow);

    expect(board.getEntities()).toHaveLength(0);
  });

  it('announces the departure, so subscribers can let go', () => {
    const arrow = board.spawn(new Element(0, 0, 10, 10), 0, 0);
    application.handle.mockClear();

    board.despawn(arrow);

    const names = application.handle.mock.calls.map(([name]) => name);
    expect(names).toContain('element.destroy');
  });
});

describe('Board - clearing the world', () => {
  it('takes the entities with it, and spawning works again after', () => {
    board.spawn(new Element(0, 0, 10, 10), 0, 0);

    board.clear();
    expect(board.getEntities()).toHaveLength(0);

    // The layer was destroyed with everything else; the next spawn must build a
    // fresh one rather than attach to a dead node.
    const late = board.spawn(new Element(0, 0, 10, 10), 40, 40);
    expect(board.getEntities()).toEqual([late]);
    expect(late.getParent()).toBe(board.getChildByName('entities'));
  });
});
