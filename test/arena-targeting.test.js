import { describe, expect, it } from 'vitest';
import { STRATEGIES, inSight, pickTarget, strategyById } from '../src/arena/targeting.js';

const SIGHT = { range: 132, arc: Math.PI / 3, pointBlank: 30 };
const DEGREE = Math.PI / 180;

/** @returns {Object} a candidate, described the way the host describes one */
function candidate({ distance = 100, offAxis = 0, hp = 3, name = 'a' } = {}) {
  return { element: name, at: { x: 0, y: 0 }, distance, offAxis, hp };
}

describe('inSight — who may be shot at all', () => {
  describe('range', () => {
    it('accepts what is within reach', () => {
      expect(inSight(candidate({ distance: 131 }), SIGHT)).toBe(true);
    });

    it('refuses what is beyond it', () => {
      expect(inSight(candidate({ distance: 133 }), SIGHT)).toBe(false);
    });

    it('refuses something standing exactly on the shooter', () => {
      // No direction to fire in, and a division by zero waiting to happen.
      expect(inSight(candidate({ distance: 0 }), SIGHT)).toBe(false);
    });
  });

  describe('the cone', () => {
    it('accepts what is dead ahead', () => {
      expect(inSight(candidate({ offAxis: 0 }), SIGHT)).toBe(true);
    });

    it('accepts what sits on the edge — a 60° cone reaches 30° each side', () => {
      expect(inSight(candidate({ offAxis: 30 * DEGREE }), SIGHT)).toBe(true);
    });

    it('refuses what is just outside it', () => {
      expect(inSight(candidate({ offAxis: 31 * DEGREE }), SIGHT)).toBe(false);
    });

    it('refuses what is behind', () => {
      expect(inSight(candidate({ offAxis: Math.PI }), SIGHT)).toBe(false);
    });
  });

  describe('point blank — the rule that was missing', () => {
    it('accepts something at your back when it is close enough to bite', () => {
      // This is the defect the player reported: a fixed ANGLE is a knife at
      // close range, so an attacker in contact was never inside the cone.
      expect(inSight(candidate({ distance: 22, offAxis: Math.PI }), SIGHT)).toBe(true);
    });

    it('still refuses the same angle one pixel further out', () => {
      expect(inSight(candidate({ distance: 31, offAxis: Math.PI }), SIGHT)).toBe(false);
    });

    it('does not let point blank override range', () => {
      const myopic = { range: 20, arc: Math.PI / 3, pointBlank: 30 };

      expect(inSight(candidate({ distance: 25, offAxis: 0 }), myopic)).toBe(false);
    });
  });
});

describe('the strategies — which of the eligible is shot', () => {
  const near = candidate({ name: 'near', distance: 40, hp: 5 });
  const far = candidate({ name: 'far', distance: 120, hp: 1 });
  const middle = candidate({ name: 'middle', distance: 80, hp: 9 });
  const all = [near, far, middle];

  it('offers three, and they disagree — otherwise the pattern is decoration', () => {
    const picks = STRATEGIES.map(strategy => strategy.choose(all).element);

    expect(picks).toEqual(['near', 'far', 'middle']);
    expect(new Set(picks).size).toBe(3);
  });

  it('nearest answers the most immediate threat', () => {
    expect(strategyById('nearest').choose(all).element).toBe('near');
  });

  it('weakest finishes the wounded', () => {
    expect(strategyById('weakest').choose(all).element).toBe('far');
  });

  it('toughest breaks the big one', () => {
    expect(strategyById('toughest').choose(all).element).toBe('middle');
  });

  it('is stable on a tie — the first seen wins, so aim does not jitter', () => {
    const first = candidate({ name: 'first', distance: 50 });
    const second = candidate({ name: 'second', distance: 50 });

    expect(strategyById('nearest').choose([first, second]).element).toBe('first');
  });

  it('falls back to the first strategy for an unknown id', () => {
    expect(strategyById('sniper').id).toBe('nearest');
  });
});

describe('pickTarget — filtering, then choosing', () => {
  it('never returns something out of sight, whatever the strategy prefers', () => {
    // `weakest` wants the far one; sight forbids it.
    const wounded = candidate({ name: 'wounded', distance: 300, hp: 1 });
    const healthy = candidate({ name: 'healthy', distance: 50, hp: 9 });

    expect(pickTarget([wounded, healthy], SIGHT, strategyById('weakest')).element).toBe('healthy');
  });

  it('returns null when nothing is eligible', () => {
    expect(pickTarget([candidate({ distance: 400 })], SIGHT, STRATEGIES[0])).toBeNull();
  });

  it('returns null when there is nothing at all', () => {
    expect(pickTarget([], SIGHT, STRATEGIES[0])).toBeNull();
  });
});
