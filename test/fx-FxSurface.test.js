import { describe, expect, it, vi } from 'vitest';
import { FxSurface, SpritePainter } from '../src/engine/index.js';

/**
 * A 2d context that records what it is told, with a **real** save/restore stack
 * — the point of several tests here is that state does not leak from one painter
 * to the next.
 */
function recorder() {
  const calls = [];
  const stack = [];
  const context = {
    calls,
    globalAlpha: 1,
    fillStyle: null,
    setTransform: (...args) => calls.push(['setTransform', ...args]),
    clearRect: (...args) => calls.push(['clearRect', ...args]),
    fillRect: (...args) => calls.push(['fillRect', ...args]),
    drawImage: (...args) => calls.push(['drawImage', args[0]]),
    beginPath: () => calls.push(['beginPath']),
    ellipse: (...args) => calls.push(['ellipse', ...args]),
    fill: () => calls.push(['fill']),
    translate: (...args) => calls.push(['translate', ...args]),
    rotate: (...args) => calls.push(['rotate', ...args]),
    save: () => { stack.push({ globalAlpha: context.globalAlpha }); calls.push(['save']); },
    restore: () => { Object.assign(context, stack.pop()); calls.push(['restore']); },
  };

  return context;
}

function surfaceWith(...painters) {
  const context = recorder();
  const canvas = { width: 100, height: 100, style: {}, getContext: () => context };
  const surface = new FxSurface(canvas);
  painters.forEach(painter => surface.addPainter(painter));

  return { surface, context };
}

/** A painter that always draws one rectangle. */
function painterDrawing(mark) {
  return { hasWork: () => true, paint: context => context.fillRect(mark, 0, 1, 1) };
}

describe('FxSurface', () => {
  it('knows nothing about what it paints — it runs painters', () => {
    const { surface, context } = surfaceWith(painterDrawing(1), painterDrawing(2));

    surface.render();

    expect(context.calls.filter(([name]) => name === 'fillRect')).toEqual([
      ['fillRect', 1, 0, 1, 1],
      ['fillRect', 2, 0, 1, 1],
    ]);
  });

  it('draws painters in the order they were added, and lets one leave', () => {
    const first = painterDrawing(1);
    const second = painterDrawing(2);
    const { surface, context } = surfaceWith(first, second);

    expect(surface.removePainter(first)).toBe(true);
    expect(surface.removePainter(first)).toBe(false);
    surface.render();

    expect(context.calls.filter(([name]) => name === 'fillRect')).toEqual([['fillRect', 2, 0, 1, 1]]);
  });

  it('tells a painter which surface it joined, so it can bake sprites there', () => {
    const painter = { attach: vi.fn(), hasWork: () => false, paint: () => null };
    const { surface } = surfaceWith(painter);

    expect(painter.attach).toHaveBeenCalledWith(surface);
  });

  describe('idleness stays free', () => {
    it('does not even clear when nothing is alive and nothing was painted', () => {
      const { surface, context } = surfaceWith({ hasWork: () => false, paint: () => null });

      surface.render();

      expect(context.calls).toEqual([]);
    });

    it('clears exactly once after the last thing goes away', () => {
      const painter = { alive: true, hasWork() { return this.alive; }, paint: () => null };
      const { surface, context } = surfaceWith(painter);

      surface.render();
      painter.alive = false;
      surface.render();
      const afterCleanup = context.calls.length;
      surface.render();

      expect(context.calls.filter(([name]) => name === 'clearRect')).toHaveLength(2);
      expect(context.calls).toHaveLength(afterCleanup);
    });
  });

  describe('painters are isolated', () => {
    it('a painter that leaves globalAlpha askew does not dim the next one', () => {
      const sloppy = { hasWork: () => true, paint: context => { context.globalAlpha = 0.1; } };
      let seen = null;
      const next = { hasWork: () => true, paint: context => { seen = context.globalAlpha; } };
      const { surface } = surfaceWith(sloppy, next);

      surface.render();

      expect(seen).toBe(1);
    });

    it('wraps each painter in save/restore', () => {
      const { surface, context } = surfaceWith(painterDrawing(1), painterDrawing(2));

      surface.render();

      expect(context.calls.filter(([name]) => name === 'save')).toHaveLength(2);
      expect(context.calls.filter(([name]) => name === 'restore')).toHaveLength(2);
    });
  });

  it('paints nothing and throws nothing when the host has no context', () => {
    const surface = new FxSurface({ getContext: () => null, style: {} });
    surface.addPainter(painterDrawing(1));

    expect(() => surface.render()).not.toThrow();
  });
});

describe('SpritePainter', () => {
  it('is idle until something is added', () => {
    const painter = new SpritePainter();

    expect(painter.hasWork()).toBe(false);

    const sprite = painter.add({ x: 0, y: 0, width: 4, height: 4, color: '#fff' });

    expect(painter.hasWork()).toBe(true);
    expect(painter.remove(sprite)).toBe(true);
    expect(painter.hasWork()).toBe(false);
  });

  it('draws a coloured sprite centred on its world position', () => {
    const painter = new SpritePainter();
    painter.add({ x: 100, y: 50, width: 8, height: 6, color: '#ffd166' });
    const { surface, context } = surfaceWith(painter);

    surface.render();

    expect(context.calls).toContainEqual(['fillRect', 96, 47, 8, 6]);
  });

  it('rotates around the sprite, not around the world origin', () => {
    const painter = new SpritePainter();
    painter.add({ x: 100, y: 50, width: 8, height: 8, color: '#fff', rotation: Math.PI / 2 });
    const { surface, context } = surfaceWith(painter);

    surface.render();

    expect(context.calls).toContainEqual(['translate', 100, 50]);
    expect(context.calls).toContainEqual(['rotate', Math.PI / 2]);
    expect(context.calls).toContainEqual(['fillRect', -4, -4, 8, 8]);
  });

  it('honours alpha, and skips what is fully transparent', () => {
    const painter = new SpritePainter();
    painter.add({ x: 0, y: 0, width: 4, height: 4, color: '#fff', alpha: 0 });
    const { surface, context } = surfaceWith(painter);

    surface.render();

    expect(context.calls.some(([name]) => name === 'fillRect')).toBe(false);
  });

  it('skips an image that has not arrived, rather than throwing', () => {
    const painter = new SpritePainter();
    const pending = { complete: false, naturalWidth: 0 };
    const ready = { complete: true, naturalWidth: 16 };
    painter.add({ x: 0, y: 0, width: 8, height: 8, image: pending });
    painter.add({ x: 20, y: 0, width: 8, height: 8, image: ready });
    const { surface, context } = surfaceWith(painter);

    surface.render();

    expect(context.calls.filter(([name]) => name === 'drawImage')).toEqual([['drawImage', ready]]);
  });

  it('keeps sprites by reference, so moving one is an assignment', () => {
    const painter = new SpritePainter();
    const sprite = painter.add({ x: 0, y: 0, width: 4, height: 4, color: '#fff' });
    const { surface, context } = surfaceWith(painter);

    sprite.x = 40;
    surface.render();

    expect(context.calls).toContainEqual(['fillRect', 38, -2, 4, 4]);
  });
});
