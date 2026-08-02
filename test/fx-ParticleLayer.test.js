import { describe, expect, it, vi } from 'vitest';
import { ParticleLayer, ParticleSystem } from '../src/engine/index.js';

/**
 * A recording 2d context. jsdom answers `null` to `getContext('2d')` — the
 * native `canvas` package is deliberately not a dependency — so the drawing path
 * is exercised through a double rather than a real surface.
 */
function fakeContext() {
  return {
    calls: [],
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    createRadialGradient: vi.fn(),
    globalAlpha: 1,
    fillStyle: null,
  };
}

/** A canvas double: no ownerDocument, so the layer falls back to `fillRect`. */
function fakeCanvas(context) {
  return { width: 0, height: 0, style: {}, getContext: () => context };
}

/** A transform double: records the matrix it would install. */
const transformAt = (offsetX, offsetY, scale = 1) => ({
  applyToContext: vi.fn((context) =>
    context.setTransform(scale, 0, 0, scale, offsetX, offsetY)),
});

describe('ParticleLayer - a missing context breaks nothing', () => {
  it('accepts a canvas that cannot provide a 2d context', () => {
    const layer = new ParticleLayer({ getContext: () => null, style: {} });

    expect(() => {
      layer.emit({ x: 0, y: 0, count: 5 });
      layer.update(16);
      layer.render(transformAt(0, 0));
    }).not.toThrow();

    // The simulation keeps running even though nothing is painted.
    expect(layer.getSystem().count()).toBe(5);
  });

  it('accepts a host that offers no canvas API at all', () => {
    const layer = new ParticleLayer({});

    expect(() => layer.render(transformAt(0, 0))).not.toThrow();
  });
});

describe('ParticleLayer - idle costs nothing', () => {
  it('does not even clear while nothing is alive', () => {
    const context = fakeContext();
    const layer = new ParticleLayer(fakeCanvas(context));

    layer.render(transformAt(0, 0));
    layer.render(transformAt(0, 0));

    expect(context.clearRect).not.toHaveBeenCalled();
    expect(context.setTransform).not.toHaveBeenCalled();
  });

  it('clears exactly once after the last particle dies', () => {
    const context = fakeContext();
    const layer = new ParticleLayer(fakeCanvas(context));
    layer.emit({ count: 1, life: 100 });

    layer.render(transformAt(0, 0));              // painted
    expect(context.clearRect).toHaveBeenCalledTimes(1);

    layer.update(100);                        // the particle dies
    layer.render(transformAt(0, 0));               // one last wipe
    expect(context.clearRect).toHaveBeenCalledTimes(2);

    layer.render(transformAt(0, 0));               // then nothing, forever
    expect(context.clearRect).toHaveBeenCalledTimes(2);
  });
});

describe('ParticleLayer - drawing', () => {
  // The layer no longer computes the matrix: it hands the context to the
  // transform, which owns offset, scale and pixel ratio.
  it('delegates the matrix to the transform', () => {
    const context = fakeContext();
    const layer = new ParticleLayer(fakeCanvas(context));
    const transform = transformAt(-120, -80);
    layer.emit({ x: 500, y: 300, count: 1 });

    layer.render(transform);

    expect(transform.applyToContext).toHaveBeenCalledWith(context);
    expect(context.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, -120, -80);
  });

  it('scales its backing store by the pixel ratio', () => {
    const context = fakeContext();
    const canvas = fakeCanvas(context);
    const layer = new ParticleLayer(canvas, { pixelRatio: 2 });

    layer.resize(900, 560);

    expect(canvas.width).toBe(1800);
    expect(canvas.height).toBe(1120);
    expect(canvas.style.width).toBe('900px');
  });

  // Without a transform (a bare host), it still paints — at identity, ratio only.
  it('falls back to its own ratio when no transform is given', () => {
    const context = fakeContext();
    const layer = new ParticleLayer(fakeCanvas(context), { pixelRatio: 2 });
    layer.emit({ x: 0, y: 0, count: 1 });

    layer.render();

    expect(context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
  });

  // A phone at ratio 3 would pay 2.25× the pixels of ratio 2 for a difference
  // nobody sees on smoke.
  it('caps the pixel ratio at 2', () => {
    const canvas = fakeCanvas(fakeContext());
    const layer = new ParticleLayer(canvas, { pixelRatio: 3 });

    layer.resize(100, 100);

    expect(canvas.width).toBe(200);
  });

  it('fades a particle as it ages', () => {
    const context = fakeContext();
    const layer = new ParticleLayer(fakeCanvas(context));
    layer.emit({ x: 0, y: 0, count: 1, life: 100 });
    const alphas = [];
    context.fillRect.mockImplementation(() => alphas.push(context.globalAlpha));

    layer.render(transformAt(0, 0));
    layer.update(50);
    layer.render(transformAt(0, 0));

    expect(alphas[0]).toBeCloseTo(1, 6);
    expect(alphas[1]).toBeCloseTo(0.5, 6);
  });

  it('draws one shape per live particle', () => {
    const context = fakeContext();
    const layer = new ParticleLayer(fakeCanvas(context));
    layer.emit({ x: 0, y: 0, count: 7 });

    layer.render(transformAt(0, 0));

    expect(context.fillRect).toHaveBeenCalledTimes(7);
  });

  it('accepts an injected system, so a caller can share or seed one', () => {
    const system = new ParticleSystem({ budget: 3, random: () => 0.5 });
    const layer = new ParticleLayer(fakeCanvas(fakeContext()), { system });

    layer.emit({ count: 10 });

    expect(system.count()).toBe(3);
    expect(layer.getSystem()).toBe(system);
  });
});
