// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Board } from '../src/engine/index.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

function createBoard(width = 100, height = 100) {
  let board;
  const app = {
    handle: vi.fn(),
    getViewport: () => ({ getBoard: () => board }),
  };
  const viewport = {
    width: () => width,
    height: () => height,
    getApplication: () => app,
  };
  board = new Board(viewport);
  return { board };
}

function countLoadedAreas(board) {
  return Object.values(board.getAreas())
    .reduce((count, column) => count + Object.keys(column).length, 0);
}

describe('Board', () => {
  it('initialize() creates the central 7x7 matrix of areas', () => {
    const { board } = createBoard();

    board.initialize();

    expect(countLoadedAreas(board)).toBe(49);
    expect(board.areaExistsAt(-3, -3)).toBe(true);
    expect(board.areaExistsAt(3, 3)).toBe(true);
    expect(board.areaExistsAt(4, 0)).toBe(false);
  });

  it('loadArea() lazily creates an area and returns the same instance afterwards', () => {
    const { board } = createBoard();

    const created = board.loadArea(2, -1);
    const reused = board.loadArea(2, -1);

    expect(board.areaExistsAt(2, -1)).toBe(true);
    expect(reused).toBe(created);
  });

  it('getAreaAt() lazily creates missing areas', () => {
    const { board } = createBoard();

    const area = board.getAreaAt(-2, 4);

    expect(board.areaExistsAt(-2, 4)).toBe(true);
    expect(board.getAreas()[-2][4]).toBe(area);
  });

  it('freeArea() returns false when the slot is already empty', () => {
    const { board } = createBoard();

    expect(board.freeArea(99, 99)).toBe(false);
  });

  it('freeArea() removes the empty sparse column when its last area is freed', () => {
    const { board } = createBoard();
    board.loadArea(5, 0);

    board.freeArea(5, 0);

    expect(board.getAreas()[5]).toBeUndefined();
  });
});
