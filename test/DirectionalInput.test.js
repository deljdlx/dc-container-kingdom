import { describe, expect, it } from 'vitest';
import { DirectionalInput } from '../src/engine/index.js';

describe('DirectionalInput - what is held', () => {
  it('is idle until something is pressed', () => {
    const input = new DirectionalInput();

    expect(input.isMoving()).toBe(false);
    expect(input.getFacing()).toBe(null);
    expect(input.getVector()).toEqual({ x: 0, y: 0 });
  });

  it('ignores anything that is not a direction', () => {
    const input = new DirectionalInput();

    expect(input.press('Shift')).toBe(false);
    expect(input.press(undefined)).toBe(false);
    expect(input.isMoving()).toBe(false);
  });

  // Regression: keyup used to stop the character whatever key was released, so
  // tapping any other key while walking froze it mid-stride.
  it('keeps moving when a non-directional key is released', () => {
    const input = new DirectionalInput();
    input.press('right');

    input.release('Shift');

    expect(input.isMoving()).toBe(true);
    expect(input.getVector()).toEqual({ x: 1, y: 0 });
  });

  it('keeps moving on the remaining direction when one of two is released', () => {
    const input = new DirectionalInput();
    input.press('right');
    input.press('up');

    input.release('up');

    expect(input.isMoving()).toBe(true);
    expect(input.getVector()).toEqual({ x: 1, y: 0 });
  });

  it('releases everything at once', () => {
    const input = new DirectionalInput();
    input.press('right');
    input.press('up');

    input.releaseAll();

    expect(input.isMoving()).toBe(false);
    expect(input.getFacing()).toBe(null);
  });
});

describe('DirectionalInput - resulting vector', () => {
  it.each([
    ['up', { x: 0, y: -1 }],
    ['down', { x: 0, y: 1 }],
    ['left', { x: -1, y: 0 }],
    ['right', { x: 1, y: 0 }],
  ])('turns %s into a unit vector', (direction, expected) => {
    const input = new DirectionalInput();
    input.press(direction);

    expect(input.getVector()).toEqual(expected);
  });

  it('normalises a diagonal, so walking sideways is not 1.41x faster', () => {
    const input = new DirectionalInput();
    input.press('right');
    input.press('down');

    const vector = input.getVector();

    expect(vector.x).toBeCloseTo(Math.SQRT1_2, 10);
    expect(vector.y).toBeCloseTo(Math.SQRT1_2, 10);
    expect(Math.hypot(vector.x, vector.y)).toBeCloseTo(1, 10);
  });

  it('cancels opposite directions instead of drifting', () => {
    const input = new DirectionalInput();
    input.press('left');
    input.press('right');

    expect(input.getVector()).toEqual({ x: 0, y: 0 });
    expect(input.isMoving()).toBe(false);
  });
});

describe('DirectionalInput - facing direction', () => {
  it('faces the most recently pressed direction', () => {
    const input = new DirectionalInput();
    input.press('right');
    input.press('up');

    expect(input.getFacing()).toBe('up');
  });

  it('falls back to the direction held before when the newest is released', () => {
    const input = new DirectionalInput();
    input.press('right');
    input.press('up');

    input.release('up');

    expect(input.getFacing()).toBe('right');
  });

  it('re-pressing a held direction makes it the newest again', () => {
    const input = new DirectionalInput();
    input.press('right');
    input.press('up');

    input.press('right');

    expect(input.getFacing()).toBe('right');
    expect(input.getVector().x).toBeCloseTo(Math.SQRT1_2, 10); // still diagonal
  });
});
