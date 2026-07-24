// @vitest-environment jsdom
// Characterization tests locking the behaviour of the decomposed Character:
// the animation clock, the direction/animation delegation, and the speech
// bubble routed through the renderer.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Character, CharacterAnimator } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

describe('CharacterAnimator', () => {
  it('advances a frame only every tickInterval ticks and cycles through 3 frames', () => {
    const anim = new CharacterAnimator(3);
    expect(anim.getIndex()).toBe(0);

    // interval 4 → frame changes on the 4th tick
    anim.advance(4);
    anim.advance(4);
    anim.advance(4);
    expect(anim.getIndex()).toBe(0);
    anim.advance(4);
    expect(anim.getIndex()).toBe(1);

    for (let i = 0; i < 4; i++) anim.advance(4);
    expect(anim.getIndex()).toBe(2);
    for (let i = 0; i < 4; i++) anim.advance(4);
    expect(anim.getIndex()).toBe(0); // wraps 3 → 0
  });

  it('advances every tick when interval is 1', () => {
    const anim = new CharacterAnimator(3);
    anim.advance(1);
    expect(anim.getIndex()).toBe(1);
    anim.advance(1);
    expect(anim.getIndex()).toBe(2);
  });

  it('guards against a zero interval (never divides by zero)', () => {
    const anim = new CharacterAnimator(3);
    expect(() => anim.advance(0)).not.toThrow();
    expect(Number.isNaN(anim.getIndex())).toBe(false);
  });

  it('reset returns to the first frame', () => {
    const anim = new CharacterAnimator(3);
    anim.advance(1);
    anim.reset();
    expect(anim.getIndex()).toBe(0);
  });
});

describe('Character — direction & animation', () => {
  it('stores and reports its facing direction', () => {
    const char = new Character(0, 0);
    expect(char.getDirection()).toBeUndefined();
    char.setDirection('left');
    expect(char.getDirection()).toBe('left');
    char.stop();
    expect(char.getDirection()).toBeNull();
  });

  it('exposes the animator frame via getAnimationIndex and advances it on update', () => {
    const char = new Character(0, 0);
    char.moveSpeed(80); // → tickInterval = round(80/80) = 1 → advances every update
    expect(char.getAnimationIndex()).toBe(0);
    char.update();
    expect(char.getAnimationIndex()).toBe(1);
  });

  it('carries the sprite-sheet offsets from its constructor', () => {
    const char = new Character(0, 0, 48 * 3, 48 * 2);
    expect(char.getSpriteSheetOffsetLeft()).toBe(144);
    expect(char.getSpriteSheetOffsetTop()).toBe(96);
  });
});

describe('Character — moveBlocked', () => {
  it('applies the delta when the move is not blocked', () => {
    const char = new Character(100, 100);
    const blocked = char.moveBlocked(5, -3, () => false);
    expect(blocked).toBe(false);
    expect(char.x()).toBe(105);
    expect(char.y()).toBe(97);
  });

  it('reverts to the starting position when blocked', () => {
    const char = new Character(100, 100);
    const blocked = char.moveBlocked(5, -3, () => true);
    expect(blocked).toBe(true);
    expect(char.x()).toBe(100);
    expect(char.y()).toBe(100);
  });

  it('evaluates the predicate at the tentative (moved) position', () => {
    const char = new Character(100, 100);
    let seenX;
    char.moveBlocked(10, 0, () => { seenX = char.x(); return false; });
    expect(seenX).toBe(110);
  });
});

describe('Character — speech bubble via the renderer', () => {
  it('routes quickReaction / clearQuickReaction to the renderer (no DOM poking)', () => {
    const char = new Character(0, 0);
    const show = vi.spyOn(char.getRenderer(), 'showReaction');
    const clear = vi.spyOn(char.getRenderer(), 'clearReaction');

    char.quickReaction('hello', false);
    expect(show).toHaveBeenCalledWith('hello');

    char.clearQuickReaction();
    expect(clear).toHaveBeenCalled();
  });

  it('auto-closes the bubble after the delay', () => {
    vi.useFakeTimers();
    const char = new Character(0, 0);
    const clear = vi.spyOn(char.getRenderer(), 'clearReaction');

    char.quickReaction('hi', true, 5000);
    expect(clear).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(clear).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
