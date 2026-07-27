// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Viewport } from '../src/engine/index.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

function createViewport(width = 64, height = 64) {
  let viewport;
  const app = {
    handle: vi.fn(),
    fetchArea: vi.fn().mockResolvedValue([]),
    instanciate: vi.fn(),
    getViewport: () => viewport,
  };
  viewport = new Viewport(app, document.querySelector('#app'), width, height);
  return { viewport, app };
}

function countLoadedAreas(board) {
  return Object.values(board.getAreas())
    .reduce((count, column) => count + Object.keys(column).length, 0);
}

describe('Viewport - frame clock', () => {
  it('uses dt=0 on the first frame and clamps later frames to 100ms', () => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(10, 10);
    viewport.move('right');

    const behavior = { update: vi.fn() };
    viewport.addBehavior(behavior);

    const moveCharacter = vi.spyOn(viewport, 'moveCharacter');
    const streamAreas = vi.spyOn(viewport, '_streamAreas');
    const characterUpdate = vi.spyOn(viewport.getCharacter(), 'update');

    viewport.update(1_000);
    expect(behavior.update).toHaveBeenNthCalledWith(1, 0);
    expect(moveCharacter).not.toHaveBeenCalled();
    expect(streamAreas).not.toHaveBeenCalled();
    expect(characterUpdate).not.toHaveBeenCalled();

    viewport.update(1_500);
    expect(behavior.update).toHaveBeenNthCalledWith(2, 100);
    expect(moveCharacter).toHaveBeenCalledWith(30);
    expect(streamAreas).toHaveBeenCalledTimes(1);
    expect(characterUpdate).toHaveBeenCalledTimes(1);
  });
});

/**
 * Walk right for `frames` frames of `step` ms, driving the loop by hand (rAF is
 * paused in a background tab — see meta/recipes/verify-in-browser.md).
 * @returns {number} pixels travelled
 */
function walkRight({ viewport }, { frames, step, speed }) {
  viewport.enableMainCharacter(0, 0);
  viewport.getCharacter().moveSpeed(speed);
  viewport.move('right');

  const startX = viewport.getCharacter().x();
  let t = 1_000;
  viewport.update(t);                  // first frame is dt = 0 by design
  for (let i = 0; i < frames; i++) {
    t += step;
    viewport.update(t);
  }
  return viewport.getCharacter().x() - startX;
}

// Regression: `Math.round(dt * speed / 1000)` dropped the sub-pixel remainder and
// skipped the frame entirely below 1px, so walking speed followed the display's
// refresh rate — and stalled completely on fast displays.
describe('Viewport - movement is frame-rate independent', () => {
  it('covers the same distance for the same simulated time, whatever the dt', () => {
    const coarse = walkRight(createViewport(), { frames: 40, step: 16, speed: 300 });
    const fine = walkRight(createViewport(), { frames: 160, step: 4, speed: 300 });

    expect(coarse).toBeGreaterThan(0);
    expect(Math.abs(coarse - fine)).toBeLessThanOrEqual(1);
  });

  it('still walks at 240Hz with a slow character (0.4px per frame)', () => {
    // 4ms × 100px/s = 0.4px per frame: every frame used to round to 0 and be
    // thrown away, freezing the character for good.
    const travelled = walkRight(createViewport(), { frames: 240, step: 4, speed: 100 });

    expect(travelled).toBeGreaterThan(0);
    expect(travelled).toBeCloseTo(96, 0); // 240 × 4ms = 960ms at 100px/s
  });

  it('keeps positions integral, so sprites never land on a sub-pixel', () => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(0, 0);
    viewport.getCharacter().moveSpeed(100);
    viewport.move('right');

    let t = 1_000;
    viewport.update(t);
    for (let i = 0; i < 50; i++) {
      t += 7;                                   // 0.7px per frame
      viewport.update(t);
      expect(Number.isInteger(viewport.getCharacter().x())).toBe(true);
    }
  });

  it('does not bank the remainder across a stop', () => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(0, 0);
    viewport.getCharacter().moveSpeed(100);
    viewport.move('right');

    let t = 1_000;
    viewport.update(t);
    t += 9; viewport.update(t);   // 0.9px accumulated, nothing moved yet
    viewport.stop();
    t += 9; viewport.update(t);   // standing still must not bank anything
    viewport.move('right');
    t += 1; viewport.update(t);   // 0.1px only: a banked remainder would jump 1px

    expect(viewport.getCharacter().x()).toBe(0);
  });
});

describe('Viewport - movement orchestration', () => {
  it.each([
    ['up', 0, -7],
    ['down', 0, 7],
    ['left', -7, 0],
    ['right', 7, 0],
  ])('translates %s into (%i, %i)', (direction, expectedDx, expectedDy) => {
    const { viewport, app } = createViewport();
    const character = {
      moveBlocked: vi.fn((dx, dy, isBlocked) => {
        expect(isBlocked()).toBe(false);
        return false;
      }),
      detectCollisionAndTrigger: vi.fn(() => ({ collision: [], trigger: [] })),
      reconcileTrigger: vi.fn(),
      getTrigger: vi.fn(),
    };
    viewport.character = character;
    viewport.direction = direction;

    viewport.moveCharacter(7);

    expect(character.moveBlocked).toHaveBeenCalledWith(
      expectedDx,
      expectedDy,
      expect.any(Function),
    );
    expect(app.handle).toHaveBeenCalledWith('map.update', {
      map: viewport,
      character,
    });
  });

  it('reconciles trigger hits from the single-pass detection when the move succeeds', () => {
    const { viewport } = createViewport();
    const triggerHits = [{ id: 'pad' }];
    const character = {
      moveBlocked: vi.fn((dx, dy, isBlocked) => {
        expect(dx).toBe(9);
        expect(dy).toBe(0);
        expect(isBlocked()).toBe(false);
        return false;
      }),
      detectCollisionAndTrigger: vi.fn(() => ({ collision: [], trigger: triggerHits })),
      reconcileTrigger: vi.fn(),
      getTrigger: vi.fn(),
    };
    viewport.character = character;
    viewport.direction = 'right';

    viewport.moveCharacter(9);

    expect(character.detectCollisionAndTrigger).toHaveBeenCalledWith(viewport.getBoard());
    expect(character.reconcileTrigger).toHaveBeenCalledWith(triggerHits);
    expect(character.getTrigger).not.toHaveBeenCalled();
  });

  it('re-detects triggers at the final position when the move is blocked', () => {
    const { viewport } = createViewport();
    const character = {
      moveBlocked: vi.fn((dx, dy, isBlocked) => {
        expect(dx).toBe(0);
        expect(dy).toBe(-5);
        expect(isBlocked()).toBe(true);
        return true;
      }),
      detectCollisionAndTrigger: vi.fn(() => ({ collision: [{}], trigger: [{}] })),
      reconcileTrigger: vi.fn(),
      getTrigger: vi.fn(),
    };
    viewport.character = character;
    viewport.direction = 'up';

    viewport.moveCharacter(5);

    expect(character.detectCollisionAndTrigger).toHaveBeenCalledWith(viewport.getBoard());
    expect(character.getTrigger).toHaveBeenCalledWith(viewport.getBoard());
    expect(character.reconcileTrigger).not.toHaveBeenCalled();
  });
});

describe('Viewport - area streaming', () => {
  it('computes area coordinates with the +48 y-offset and keeps negative coordinates', () => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(0, 15);

    expect(viewport.getCurrentAreaCoordinates()).toEqual({ x: 0, y: 0 });

    viewport.getCharacter().y(16);
    expect(viewport.getCurrentAreaCoordinates()).toEqual({ x: 0, y: 1 });

    viewport.getCharacter().x(-1);
    viewport.getCharacter().y(-49);
    expect(viewport.getCurrentAreaCoordinates()).toEqual({ x: -1, y: -1 });
  });

  it('streams only when the player crosses into a new area', () => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(10, 10);

    const loadAreas = vi.spyOn(viewport, 'loadAreasFromCurrentPosition');
    const freeAreas = vi.spyOn(viewport, 'freeAreasFromCurrentPosition');
    const boardUpdate = vi.spyOn(viewport.getBoard(), 'update').mockImplementation(() => {});

    viewport._streamAreas();
    viewport._streamAreas();

    expect(loadAreas).toHaveBeenCalledTimes(1);
    expect(freeAreas).toHaveBeenCalledTimes(1);
    expect(boardUpdate).toHaveBeenCalledTimes(1);

    viewport.getCharacter().x(70);
    viewport._streamAreas();

    expect(loadAreas).toHaveBeenCalledTimes(2);
    expect(freeAreas).toHaveBeenCalledTimes(2);
    expect(boardUpdate).toHaveBeenCalledTimes(2);
  });

  it('loads a 7x7 window of areas around the current position', () => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(10, 10);

    viewport.loadAreasFromCurrentPosition();

    expect(countLoadedAreas(viewport.getBoard())).toBe(49);
    expect(viewport.getBoard().areaExistsAt(-3, -3)).toBe(true);
    expect(viewport.getBoard().areaExistsAt(3, 3)).toBe(true);
  });

  it('keeps a 9x9 hysteresis window before freeing distant areas', () => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(10, 10);
    const board = viewport.getBoard();

    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        board.loadArea(x, y);
      }
    }

    viewport.freeAreasFromCurrentPosition();

    expect(countLoadedAreas(board)).toBe(81);
    expect(board.areaExistsAt(4, 4)).toBe(true);
    expect(board.areaExistsAt(5, 0)).toBe(false);
    expect(board.areaExistsAt(0, -5)).toBe(false);
  });
});
