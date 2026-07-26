// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Board, Viewport } from '../src/engine/index.js';

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

describe('Board area lifecycle', () => {
  it('freeArea detaches the area from scene graph, matrix and DOM', () => {
    const { board } = createBoard();
    const area = board.createAreaAt(0, 0);

    document.body.append(board.render());

    expect(board.getChildren()).toContain(area);
    expect(board.getAreas()[0][0]).toBe(area);
    expect(area.getDom().isConnected).toBe(true);

    board.freeArea(0, 0);

    expect(board.getChildren()).not.toContain(area);
    expect(board.areaExistsAt(0, 0)).toBe(false);
    expect(area.getDom().isConnected).toBe(false);
  });

  it('shrinks aggregate bounding boxes after freeing a distant area', () => {
    const { board } = createBoard();

    board.createAreaAt(12, 0);

    expect(board.getCollisionBoundingBox().x1()).toBeGreaterThan(board.width());
    expect(board.getBoundingBox().x1()).toBeGreaterThan(board.width());

    board.freeArea(12, 0);

    expect(board.getCollisionBoundingBox().x0()).toBe(0);
    expect(board.getCollisionBoundingBox().x1()).toBe(board.width());
    expect(board.getBoundingBox().x0()).toBe(0);
    expect(board.getBoundingBox().x1()).toBe(board.width());
  });

  it('clear resets areas matrix and detaches all area children', () => {
    const { board } = createBoard();
    board.createAreaAt(0, 0);
    board.createAreaAt(1, 0);

    document.body.append(board.render());
    expect(board.getChildren().length).toBe(2);

    board.clear();

    expect(board.getChildren().length).toBe(0);
    expect(countLoadedAreas(board)).toBe(0);
    expect(board.getRenderer().getDom().querySelectorAll('.map-area').length).toBe(0);
  });
});

describe('Viewport area streaming', () => {
  it('keeps the board children count bounded while walking across many areas', () => {
    let viewport;
    const app = {
      handle: vi.fn(),
      fetchArea: vi.fn().mockResolvedValue([]),
      instanciate: vi.fn(),
      getViewport: () => viewport,
    };
    viewport = new Viewport(app, document.querySelector('#app'), 64, 64);
    viewport.enableMainCharacter(10, 10);
    viewport.getCharacter().moveSpeed(1200);
    viewport.move('right');

    let timestamp = 0;
    for (let i = 0; i < 600; i++) {
      timestamp += 16;
      viewport.update(timestamp);
    }

    const board = viewport.getBoard();
    expect(board.getChildren().length).toBeLessThanOrEqual(81);
    expect(countLoadedAreas(board)).toBeLessThanOrEqual(81);
  });
});
