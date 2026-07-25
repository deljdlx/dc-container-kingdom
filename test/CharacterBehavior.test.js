import { describe, it, expect, vi, afterEach } from 'vitest';
import { CharacterBehavior } from '../src/engine/index.js';

/** Duck-typed character: drives CharacterBehavior without the full engine. */
function fakeCharacter() {
  return {
    _dir: null,
    _blocked: false, // what moveBlocked returns
    getDirection() { return this._dir; },
    setDirection(d) { this._dir = d; },
    moveBlocked() { return this._blocked; },
    getCollision() { return []; },
    getBoard() { return null; },
    update() {},
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CharacterBehavior', () => {
  it('runs _step at the tickDelay cadence, catching up on slow frames', () => {
    const behavior = new CharacterBehavior(fakeCharacter()); // _tickDelay = 100 ms
    const step = vi.spyOn(behavior, '_step').mockImplementation(() => {});

    behavior.update(250); // 250 ms → 2 ticks, 50 ms reporté
    expect(step).toHaveBeenCalledTimes(2);

    behavior.update(60); // 50 + 60 = 110 → 1 tick
    expect(step).toHaveBeenCalledTimes(3);

    behavior.update(30); // 80 < 100 → aucun tick
    expect(step).toHaveBeenCalledTimes(3);
  });

  it('picks an initial direction when alive and none is set', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // _randomDirection → 'up'
    const char = fakeCharacter();
    const behavior = new CharacterBehavior(char);
    behavior._alive = true;

    behavior._step();

    expect(char.getDirection()).toBe('up');
  });

  it('picks a new direction when a move is blocked', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // _randomDirection → 'left'
    const char = fakeCharacter();
    char._dir = 'up';
    char._blocked = true; // moveBlocked → bloqué
    const behavior = new CharacterBehavior(char);
    behavior._alive = true;
    const setDir = vi.spyOn(char, 'setDirection');

    behavior._step();

    expect(setDir).toHaveBeenCalledWith('left'); // nouvelle direction sur collision
    expect(char.getDirection()).toBe('left');
  });
});
