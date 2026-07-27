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
  it('advances a frame every walked distance bucket and cycles through 3 frames', () => {
    const anim = new CharacterAnimator(3, 4);
    expect(anim.getIndex()).toBe(0);

    anim.advance(3.9);
    expect(anim.getIndex()).toBe(0);

    anim.advance(0.2);
    expect(anim.getIndex()).toBe(1);

    anim.advance(8);
    expect(anim.getIndex()).toBe(0); // wraps 2 -> 0 after two additional frames
  });

  it('ignores non-positive or invalid walked distance', () => {
    const anim = new CharacterAnimator(3, 4);
    anim.advance(0);
    anim.advance(-10);
    anim.advance(Number.NaN);
    expect(anim.getIndex()).toBe(0);
  });

  it('keeps the same cadence for equal simulated time at 60/120/240 Hz', () => {
    const speed = 80; // px/s
    const frameRates = [60, 120, 240];

    const indices = frameRates.map((fps) => {
      const anim = new CharacterAnimator(3, 4);
      const dt = 1 / fps;
      for (let i = 0; i < fps; i++) {
        anim.advance(speed * dt);
      }
      return anim.getIndex();
    });

    expect(indices[1]).toBe(indices[0]);
    expect(indices[2]).toBe(indices[0]);
  });

  it('reset returns to the first frame', () => {
    const anim = new CharacterAnimator(3, 4);
    anim.advance(4);
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

  it('exposes the animator frame via getAnimationIndex and advances it from walked distance', () => {
    const char = new Character(0, 0);
    expect(char.getAnimationIndex()).toBe(0);
    char.update(4);
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

describe('Character — speech bubble DOM is lazy', () => {
  it('creates no bubble node until the character first speaks', () => {
    const char = new Character(0, 0);
    expect(char.getDom().querySelectorAll('.quickReaction').length).toBe(0);
    expect(char.isReacting()).toBe(false);

    char.quickReaction('hi', false);
    expect(char.getDom().querySelectorAll('.quickReaction').length).toBe(1);
    expect(char.isReacting()).toBe(true);
  });

  it('reuses the same node across reactions and stays silent-safe', () => {
    const char = new Character(0, 0);
    expect(() => char.clearQuickReaction()).not.toThrow();
    expect(char.getDom().querySelectorAll('.quickReaction').length).toBe(0);

    char.quickReaction('hi', false);
    char.clearQuickReaction();
    char.quickReaction('again', false);
    expect(char.getDom().querySelectorAll('.quickReaction').length).toBe(1);
  });

  it('appends the bubble last, after the shadow and the sprite', () => {
    const char = new Character(0, 0);
    char.quickReaction('hi', false);
    const children = [...char.getDom().children];
    expect(children.at(-1).classList.contains('quickReaction')).toBe(true);
    expect(children[0].classList.contains('map-element__shadow')).toBe(true);
  });
});

describe('Character — speech bubble state & events', () => {
  it('isReacting reflects whether a bubble is shown', () => {
    const char = new Character(0, 0);
    expect(char.isReacting()).toBe(false);
    char.quickReaction('hi', false);
    expect(char.isReacting()).toBe(true);
    char.clearQuickReaction();
    expect(char.isReacting()).toBe(false);
  });

  it('emits element.reaction.show on speak and element.reaction.hide on close', () => {
    const char = new Character(0, 0);
    const onShow = vi.fn();
    const onHide = vi.fn();
    char.addEventListener('element.reaction.show', onShow);
    char.addEventListener('element.reaction.hide', onHide);

    char.quickReaction('hi', false);
    expect(onShow).toHaveBeenCalledWith(expect.objectContaining({ content: 'hi' }));
    expect(onHide).not.toHaveBeenCalled();

    char.clearQuickReaction();
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('does not emit hide when no bubble was showing', () => {
    const char = new Character(0, 0);
    const onHide = vi.fn();
    char.addEventListener('element.reaction.hide', onHide);

    char.clearQuickReaction();
    expect(onHide).not.toHaveBeenCalled();
  });

  it('emits hide when the bubble auto-closes', () => {
    vi.useFakeTimers();
    const char = new Character(0, 0);
    const onHide = vi.fn();
    char.addEventListener('element.reaction.hide', onHide);

    char.quickReaction('hi', true, 5000);
    vi.advanceTimersByTime(5000);
    expect(onHide).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
