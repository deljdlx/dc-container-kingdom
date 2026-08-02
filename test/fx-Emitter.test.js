import { describe, expect, it, vi } from 'vitest';
import { Emitter, FootstepDust, FountainSpray } from '../src/engine/index.js';

/** A layer double: records what would be spawned, without a canvas in sight. */
function fakeLayer() {
  return { bursts: [], emit(descriptor) { this.bursts.push(descriptor); } };
}

/** An element double: only `offsetX`/`offsetY` are ever asked for. */
function movingElement(x, y) {
  return { x, y, offsetX() { return this.x; }, offsetY() { return this.y; } };
}

class Steady extends Emitter {
  static descriptor = { count: 4, color: '#fff' };
  static interval = 100;
}

describe('Emitter - cadence', () => {
  it('waits for its interval before the first burst', () => {
    const layer = fakeLayer();
    const emitter = new Steady(layer, { at: { x: 0, y: 0 } });

    emitter.update(60);
    expect(layer.bursts).toHaveLength(0);

    emitter.update(40);
    expect(layer.bursts).toHaveLength(1);
  });

  it('emits once per interval, not once per frame', () => {
    const layer = fakeLayer();
    const emitter = new Steady(layer, { at: { x: 0, y: 0 } });

    for (let frame = 0; frame < 60; frame += 1) {
      emitter.update(16);   // ~960ms at 60fps
    }

    // 960 / 100 ≈ 9 bursts, never 60.
    expect(layer.bursts.length).toBeGreaterThanOrEqual(8);
    expect(layer.bursts.length).toBeLessThanOrEqual(10);
  });

  // A backgrounded tab hands back one huge dt; the backlog must not fire as a
  // single monstrous burst.
  it('does not replay the backlog after a long freeze', () => {
    const layer = fakeLayer();
    const emitter = new Steady(layer, { at: { x: 0, y: 0 } });

    emitter.update(10_000);

    expect(layer.bursts).toHaveLength(1);
  });

  it('stops and restarts on demand', () => {
    const layer = fakeLayer();
    const emitter = new Steady(layer, { at: { x: 0, y: 0 } });

    emitter.stop();
    emitter.update(500);
    expect(layer.bursts).toHaveLength(0);
    expect(emitter.isRunning()).toBe(false);

    emitter.start().update(500);
    expect(layer.bursts).toHaveLength(1);
  });
});

describe('Emitter - where it spawns', () => {
  it('spawns at a fixed world point', () => {
    const layer = fakeLayer();
    new Steady(layer, { at: { x: 224, y: 438 } }).update(100);

    expect(layer.bursts[0]).toMatchObject({ x: 224, y: 438, count: 4, color: '#fff' });
  });

  // This is what makes an emitter follow a walking character while the camera
  // scrolls: the position is resolved every burst, not captured once.
  it('follows a moving element, resolved at each burst', () => {
    const layer = fakeLayer();
    const player = movingElement(100, 100);
    const emitter = new Steady(layer, { follow: player });

    emitter.update(100);
    player.x = 340;
    player.y = 512;
    emitter.update(100);

    expect(layer.bursts[0]).toMatchObject({ x: 100, y: 100 });
    expect(layer.bursts[1]).toMatchObject({ x: 340, y: 512 });
  });

  it('shifts the spawn point by the offset, so dust lands at the feet', () => {
    const layer = fakeLayer();
    new Steady(layer, { follow: movingElement(10, 20), offset: { x: 24, y: 44 } }).update(100);

    expect(layer.bursts[0]).toMatchObject({ x: 34, y: 64 });
  });

  it('lets a caller override the descriptor and the cadence', () => {
    const layer = fakeLayer();
    const emitter = new Steady(layer, {
      at: { x: 0, y: 0 }, descriptor: { color: '#f0f' }, interval: 10,
    });

    emitter.update(10);

    expect(layer.bursts[0]).toMatchObject({ color: '#f0f', count: 4 });
  });
});

describe('Emitter - shouldEmit', () => {
  it('skips the burst when the effect says to stay silent', () => {
    const layer = fakeLayer();
    const emitter = new Steady(layer, { at: { x: 0, y: 0 } });
    vi.spyOn(emitter, 'shouldEmit').mockReturnValue(false);

    emitter.update(500);

    expect(layer.bursts).toHaveLength(0);
  });
});

describe('Named effects', () => {
  it('FountainSpray throws droplets upwards, pulled back down', () => {
    const layer = fakeLayer();
    new FountainSpray(layer, { at: { x: 224, y: 438 } }).update(FountainSpray.interval);

    expect(layer.bursts[0]).toMatchObject({
      x: 224, y: 438, direction: -Math.PI / 2, gravity: 220, color: '#9fe4ff',
    });
  });

  it('FootstepDust only rises under a character that moves', () => {
    const layer = fakeLayer();
    let walking = false;
    const dust = new FootstepDust(layer, {
      follow: movingElement(0, 0), isMoving: () => walking,
    });

    dust.update(FootstepDust.interval);
    expect(layer.bursts).toHaveLength(0);

    walking = true;
    dust.update(FootstepDust.interval);
    expect(layer.bursts).toHaveLength(1);
  });

  // Dusting a statue is the wrong default: without a predicate, stay silent.
  it('FootstepDust stays silent when no predicate is given', () => {
    const layer = fakeLayer();
    new FootstepDust(layer, { at: { x: 0, y: 0 } }).update(1_000);

    expect(layer.bursts).toHaveLength(0);
  });
});
