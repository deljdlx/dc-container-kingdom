// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ParticleLayer, ParticleSystem } from '../src/engine/index.js';

/** A system whose RNG is a scripted sequence, so every draw is pinned down. */
function scripted(values) {
  let index = 0;
  return new ParticleSystem({ random: () => values[index++ % values.length] });
}

describe('ParticleSystem - a palette rather than one colour', () => {
  it('keeps accepting a plain string', () => {
    const system = scripted([0.5]);
    system.emit({ count: 3, color: '#abcdef' });

    expect(system.particles().every(p => p.color === '#abcdef')).toBe(true);
  });

  it('draws one colour per particle from a palette', () => {
    // The RNG feeds `angle` then `color` for each particle, so the draws
    // alternate: 0.5 (angle), 0 (colour), 0.5 (angle), 0.99 (colour)…
    const system = scripted([0.5, 0, 0.5, 0.99, 0.5, 0.5]);
    system.emit({ count: 3, color: ['#aaa', '#bbb', '#ccc'] });

    expect(system.particles().map(p => p.color)).toEqual(['#aaa', '#ccc', '#bbb']);
  });

  it('never runs past the end of the palette', () => {
    const system = scripted([0.5, 0.999999999]);
    system.emit({ count: 1, color: ['#aaa', '#bbb'] });

    expect(system.particles()[0].color).toBe('#bbb');
  });

  it('falls back to the default colour for an empty palette', () => {
    const system = scripted([0.5, 0.5]);
    system.emit({ count: 1, color: [] });

    expect(system.particles()[0].color).toBe(ParticleSystem.DEFAULTS.color);
  });

  it('treats a one-entry palette as the plain case', () => {
    const system = scripted([0.5, 0.5]);
    system.emit({ count: 2, color: ['#123456'] });

    expect(system.particles().every(p => p.color === '#123456')).toBe(true);
  });
});

describe('ParticleSystem - the fade curve', () => {
  it('defaults to the linear fade the layer has always applied', () => {
    const system = scripted([0.5]);
    system.emit({ count: 1 });

    expect(system.particles()[0].fade).toBe(1);
  });

  it('carries an explicit curve through to the particle', () => {
    const system = scripted([0.5]);
    system.emit({ count: 1, fade: 3 });

    expect(system.particles()[0].fade).toBe(3);
  });
});

describe('ParticleLayer - the sprite cache', () => {
  /** A canvas double that records how many offscreen surfaces get baked. */
  function recordingLayer() {
    const baked = [];
    const context = {
      setTransform() {}, clearRect() {}, drawImage() {}, fillRect() {},
      createRadialGradient: () => ({ addColorStop() {} }),
      set fillStyle(value) { this._fill = value; },
      get fillStyle() { return this._fill; },
      set globalAlpha(value) { this._alpha = value; },
      get globalAlpha() { return this._alpha; },
    };
    const makeSurface = () => {
      const surface = { width: 32, height: 32, getContext: () => context };
      baked.push(surface);
      return surface;
    };
    const canvas = {
      width: 900, height: 560, style: {},
      getContext: () => context,
      ownerDocument: { createElement: makeSurface },
    };
    return { layer: new ParticleLayer(canvas, { layer: 'above' }), baked };
  }

  it('bakes one sprite per colour AND size, not per colour alone', () => {
    const { layer, baked } = recordingLayer();
    layer.emit({ count: 1, size: 6, color: '#abcdef' });
    layer.emit({ count: 1, size: 24, color: '#abcdef' });
    layer.render();

    // Same colour, two sizes: sharing the first-baked sprite stretched it, which
    // is exactly what a palette would have made common.
    expect(baked.length).toBe(2);
  });

  it('reuses the sprite for the same colour and size', () => {
    const { layer, baked } = recordingLayer();
    layer.emit({ count: 4, size: 6, color: '#abcdef' });
    layer.render();

    expect(baked.length).toBe(1);
  });
});
