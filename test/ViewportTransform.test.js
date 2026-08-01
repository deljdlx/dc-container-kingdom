import { describe, expect, it, vi } from 'vitest';
import { ViewportTransform } from '../src/engine/index.js';

describe('ViewportTransform - the relation itself', () => {
  it('is the identity until something moves it', () => {
    const transform = new ViewportTransform();

    expect(transform.worldToScreen(120, -40)).toEqual({ x: 120, y: -40 });
    expect(transform.scale()).toBe(1);
    expect(transform.toCssTransform()).toBe('translate(0px, 0px) scale(1)');
  });

  it('translates, then scales from the top-left corner', () => {
    const transform = new ViewportTransform().setOffset(100, 50);
    transform.scale(2);

    // screen = world × scale + offset
    expect(transform.worldToScreen(10, 10)).toEqual({ x: 120, y: 70 });
  });

  // Easy to get backwards — this test exists because I did, while writing it.
  it('reads a camera as the negative of its position', () => {
    const camera = { x: () => -253, y: () => 144 };
    const transform = new ViewportTransform().setOffset(-camera.x(), -camera.y());

    // Measured in the browser on 2026-08-01: with the camera at (-253, 144), an
    // element at world x=120 sat 373px inside the viewport container.
    expect(transform.worldToScreenX(120)).toBe(373);
    expect(transform.worldToScreenY(120)).toBe(-24);
  });
});

describe('ViewportTransform - reciprocity', () => {
  it.each([
    ['identity', { x: 0, y: 0 }, 1],
    ['translated', { x: -253, y: 144 }, 1],
    ['zoomed out', { x: 0, y: 0 }, 0.5],
    ['panned and zoomed', { x: 137.5, y: -42.25 }, 1.5],
    ['extreme zoom', { x: -1000, y: 2000 }, 0.1],
  ])('screenToWorld undoes worldToScreen (%s)', (label, offset, scale) => {
    const transform = new ViewportTransform().setOffset(offset.x, offset.y);
    transform.scale(scale);

    for (const [x, y] of [[0, 0], [123, 456], [-789, 12], [0.5, -0.25]]) {
      const screen = transform.worldToScreen(x, y);
      const back = transform.screenToWorld(screen.x, screen.y);
      expect(back.x).toBeCloseTo(x, 9);
      expect(back.y).toBeCloseTo(y, 9);
    }
  });

  it('agrees between the scalar and the object forms', () => {
    const transform = new ViewportTransform().setOffset(30, -70);
    transform.scale(0.75);

    const point = transform.worldToScreen(11, 22);
    expect(point.x).toBe(transform.worldToScreenX(11));
    expect(point.y).toBe(transform.worldToScreenY(22));
    expect(transform.screenToWorld(3, 4).x).toBe(transform.screenToWorldX(3));
  });
});

describe('ViewportTransform - the CSS it wears', () => {
  // The host's gestures are pinned to this exact string; the `scale()` term is
  // emitted even at 1.
  it('always emits the scale term', () => {
    const transform = new ViewportTransform().setOffset(50, 30);

    expect(transform.toCssTransform()).toBe('translate(50px, 30px) scale(1)');
  });

  it('keeps fractions intact rather than rounding', () => {
    const transform = new ViewportTransform().setOffset(-20.5, 15.25);
    transform.scale(1.05);

    expect(transform.toCssTransform()).toBe('translate(-20.5px, 15.25px) scale(1.05)');
  });

  it('sets the origin the pan arithmetic assumes', () => {
    const element = { style: {} };
    new ViewportTransform().setOffset(4, 5).applyTo(element);

    expect(element.style.transformOrigin).toBe('0 0');
    expect(element.style.transform).toBe('translate(4px, 5px) scale(1)');
  });
});

describe('ViewportTransform - canvas matrix', () => {
  it('folds scale and pixel ratio into the context matrix', () => {
    const context = { setTransform: vi.fn() };
    const transform = new ViewportTransform({ pixelRatio: 2 }).setOffset(-10, 20);
    transform.scale(3);

    transform.applyToContext(context);

    // world → device: ×(scale × ratio), offset in device pixels
    expect(context.setTransform).toHaveBeenCalledWith(6, 0, 0, 6, -20, 40);
  });

  it('caps the pixel ratio, and never goes below 1', () => {
    expect(new ViewportTransform({ pixelRatio: 3 }).pixelRatio()).toBe(2);
    expect(new ViewportTransform({ pixelRatio: 0.5 }).pixelRatio()).toBe(1);
    expect(new ViewportTransform({ pixelRatio: 1.5 }).pixelRatio()).toBe(1.5);
  });

  // Regression: the particle layer used to fold the ratio in itself, on top of
  // the one the transform already applies.
  it('applies the pixel ratio exactly once', () => {
    const context = { setTransform: vi.fn() };
    const transform = new ViewportTransform({ pixelRatio: 2 });

    transform.applyToContext(context);

    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });
});
