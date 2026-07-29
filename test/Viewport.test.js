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
    expect(moveCharacter).toHaveBeenCalledWith(30, 0);
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
  it('centres the main character when called without coordinates', () => {
    const { viewport } = createViewport(500, 300);

    viewport.enableMainCharacter();
    viewport.getCamera().update();

    expect(viewport.getCharacter().x()).toBe(250);
    expect(viewport.getCharacter().y()).toBe(150);
    expect(viewport.getCamera().x()).toBe(24);
    expect(viewport.getCamera().y()).toBe(24);
  });

  it.each([
    ['up', 0, -7],
    ['down', 0, 7],
    ['left', -7, 0],
    ['right', 7, 0],
  ])('moves %s through the collision dance', (direction, dx, dy) => {
    const { viewport, app } = createViewport();
    const character = {
      moveBlocked: vi.fn((moveX, moveY, isBlocked) => {
        expect(isBlocked()).toBe(false);
        return false;
      }),
      detectCollisionAndTrigger: vi.fn(() => ({ collision: [], trigger: [] })),
      reconcileTrigger: vi.fn(),
      getTrigger: vi.fn(),
    };
    viewport.character = character;

    viewport.moveCharacter(dx, dy);

    expect(character.moveBlocked).toHaveBeenCalledWith(dx, dy, expect.any(Function));
    expect(app.handle).toHaveBeenCalledWith('map.update', {
      map: viewport,
      character,
    });
  });

  it.each([
    ['up', 0, -1],
    ['down', 0, 1],
    ['left', -1, 0],
    ['right', 1, 0],
  ])('walks the character %s while that direction is held', (direction, signX, signY) => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(100, 100);
    viewport.getCharacter().moveSpeed(300);
    viewport.move(direction);

    let t = 1_000;
    viewport.update(t);          // first frame is dt = 0 by design
    t += 100; viewport.update(t);  // 100ms at 300px/s → 30px

    expect(viewport.getCharacter().x() - 100).toBe(30 * signX);
    expect(viewport.getCharacter().y() - 100).toBe(30 * signY);
    expect(viewport.getCharacter().getDirection()).toBe(direction);
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

    viewport.moveCharacter(9, 0);

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

    viewport.moveCharacter(0, -5);

    expect(character.detectCollisionAndTrigger).toHaveBeenCalledWith(viewport.getBoard());
    expect(character.getTrigger).toHaveBeenCalledWith(viewport.getBoard());
    expect(character.reconcileTrigger).not.toHaveBeenCalled();
  });
});

describe('Viewport - diagonals', () => {
  it('walks diagonally when two directions are held', () => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(100, 100);
    viewport.getCharacter().moveSpeed(300);
    viewport.move('right');
    viewport.press('down');

    let t = 1_000;
    viewport.update(t);
    for (let i = 0; i < 10; i++) {   // 10 × 100ms = 1s at 300px/s
      t += 100;
      viewport.update(t);
    }

    expect(viewport.getCharacter().x()).toBeGreaterThan(100);
    expect(viewport.getCharacter().y()).toBeGreaterThan(100);
  });

  // A diagonal used to be impossible; the naive fix (dx = dy = increment) walks
  // √2 ≈ 1.41× too fast in a straight line's time.
  it('covers the same distance diagonally as in a straight line', () => {
    const walk = (directions) => {
      const { viewport } = createViewport();
      viewport.enableMainCharacter(0, 0);
      viewport.getCharacter().moveSpeed(300);
      directions.forEach(direction => viewport.press(direction));

      let t = 1_000;
      viewport.update(t);
      for (let i = 0; i < 10; i++) {
        t += 100;
        viewport.update(t);
      }
      return Math.hypot(viewport.getCharacter().x(), viewport.getCharacter().y());
    };

    const straight = walk(['right']);
    const diagonal = walk(['right', 'down']);

    expect(straight).toBeCloseTo(300, 0);
    expect(Math.abs(diagonal - straight)).toBeLessThanOrEqual(1);
  });

  it('keeps walking on the remaining axis when one direction is released', () => {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(100, 100);
    viewport.getCharacter().moveSpeed(300);
    viewport.press('right');
    viewport.press('down');

    let t = 1_000;
    viewport.update(t);
    t += 100; viewport.update(t);
    const afterDiagonal = { x: viewport.getCharacter().x(), y: viewport.getCharacter().y() };

    viewport.release('down');
    t += 100; viewport.update(t);

    expect(viewport.getCharacter().x()).toBe(afterDiagonal.x + 30); // full speed again
    expect(viewport.getCharacter().y()).toBe(afterDiagonal.y);
    expect(viewport.getCharacter().getDirection()).toBe('right');   // falls back
  });

  // Without the fallback, walking diagonally into a wall stops the character
  // dead instead of letting it follow the wall.
  it('slides along the wall when only one axis is blocked', () => {
    const { viewport } = createViewport();
    const attempts = [];
    const character = {
      moveBlocked: vi.fn((dx, dy, isBlocked) => {
        attempts.push([dx, dy]);
        isBlocked();
        return dy !== 0;              // a horizontal wall: vertical moves fail
      }),
      detectCollisionAndTrigger: vi.fn(() => ({ collision: [], trigger: [] })),
      reconcileTrigger: vi.fn(),
      getTrigger: vi.fn(),
    };
    viewport.character = character;

    const walked = viewport.moveCharacter(5, 5);

    expect(attempts).toEqual([[5, 5], [5, 0]]);
    expect(walked).toBe(5);
    expect(character.reconcileTrigger).toHaveBeenCalled();
    expect(character.getTrigger).not.toHaveBeenCalled();
  });

  it('reports no movement when every fallback is blocked', () => {
    const { viewport } = createViewport();
    const character = {
      moveBlocked: vi.fn(() => true),
      detectCollisionAndTrigger: vi.fn(() => ({ collision: [{}], trigger: [] })),
      reconcileTrigger: vi.fn(),
      getTrigger: vi.fn(),
    };
    viewport.character = character;

    const walked = viewport.moveCharacter(5, 5);

    expect(character.moveBlocked).toHaveBeenCalledTimes(3);  // full, then each axis
    expect(walked).toBe(0);
    expect(character.getTrigger).toHaveBeenCalledWith(viewport.getBoard());
    expect(character.reconcileTrigger).not.toHaveBeenCalled();
  });
});

describe('Viewport - keyboard wiring', () => {
  function runWithKeyboard() {
    const { viewport } = createViewport();
    viewport.enableMainCharacter(100, 100);
    vi.spyOn(viewport, 'startLoop').mockImplementation(() => {});
    viewport.run();
    return viewport;
  }

  const keydown = (key, repeat = false) =>
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key, repeat, bubbles: true }));
  const keyup = (key) =>
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));

  it('combines two arrows into a diagonal', () => {
    const viewport = runWithKeyboard();

    keydown('ArrowRight');
    keydown('ArrowDown');

    const vector = viewport.getInput().getVector();
    expect(vector.x).toBeCloseTo(Math.SQRT1_2, 10);
    expect(vector.y).toBeCloseTo(Math.SQRT1_2, 10);
  });

  // Regression: keyup stopped the character whatever key was released, so
  // tapping any other key while walking froze it mid-stride.
  it('is not stopped by a key that has nothing to do with movement', () => {
    const viewport = runWithKeyboard();
    keydown('ArrowRight');

    keydown('Shift');
    keyup('Shift');

    expect(viewport.getInput().isMoving()).toBe(true);
    expect(viewport.getInput().getVector()).toEqual({ x: 1, y: 0 });
  });

  it('stops only once the last arrow is released', () => {
    const viewport = runWithKeyboard();
    keydown('ArrowRight');
    keydown('ArrowUp');

    keyup('ArrowUp');
    expect(viewport.getInput().isMoving()).toBe(true);

    keyup('ArrowRight');
    expect(viewport.getInput().isMoving()).toBe(false);
  });

  it('ignores auto-repeat, so holding a key does not steal the facing direction', () => {
    const viewport = runWithKeyboard();
    keydown('ArrowRight');
    keydown('ArrowUp');

    keydown('ArrowRight', true);   // OS auto-repeat of the still-held key

    expect(viewport.getInput().getFacing()).toBe('up');
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
