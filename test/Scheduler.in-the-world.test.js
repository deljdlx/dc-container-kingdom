// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application, Element } from '../src/engine/index.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

function createWorld() {
  const application = new Application('#app', 900, 560);

  return { application, viewport: application.getViewport(), board: application.getViewport().getBoard() };
}

/** Run `count` frames of 16 ms of real time, as the loop would. */
function run(viewport, count, from = 1000) {
  let timestamp = from;
  for (let i = 0; i <= count; i++) {
    viewport.update(timestamp);
    timestamp += 16;
  }
}

describe('the scheduler in the world', () => {
  it('is ticked by the game loop, with no wiring from the host', () => {
    const { application, viewport } = createWorld();
    const done = vi.fn();
    application.getScheduler().after(100, done);

    run(viewport, 10);

    expect(done).toHaveBeenCalledTimes(1);
  });

  it('freezes with the clock — a cooldown does not run out behind a menu', () => {
    const { application, viewport } = createWorld();
    const done = vi.fn();
    application.getScheduler().after(100, done);
    application.getClock().pause();

    run(viewport, 60);

    expect(done).not.toHaveBeenCalled();

    application.getClock().resume();
    run(viewport, 10, 2000);

    expect(done).toHaveBeenCalledTimes(1);
  });

  it('runs on game time, so slow motion slows it down too', () => {
    const { application, viewport } = createWorld();
    const done = vi.fn();
    application.getClock().scale(0.25);
    application.getScheduler().after(100, done);

    run(viewport, 10);          // 160 ms of real time, 40 ms of game time

    expect(done).not.toHaveBeenCalled();

    run(viewport, 20, 2000);    // enough game time this round

    expect(done).toHaveBeenCalledTimes(1);
  });

  describe('spawning with a lifetime', () => {
    it('despawns the entity when its ttl runs out', () => {
      const { viewport, board } = createWorld();
      const bolt = board.spawn(new Element(0, 0, 8, 8), 100, 100, { ttl: 100 });

      run(viewport, 3);
      expect(board.getEntities()).toContain(bolt);

      run(viewport, 5, 1100);
      expect(board.getEntities()).not.toContain(bolt);
    });

    it('leaves an entity spawned without a ttl alone — the engine culls nothing', () => {
      const { viewport, board } = createWorld();
      const rock = board.spawn(new Element(0, 0, 8, 8), 100, 100);

      run(viewport, 60);

      expect(board.getEntities()).toContain(rock);
    });

    it('drops the pending despawn when the entity dies another way', () => {
      const { application, viewport, board } = createWorld();
      const bolt = board.spawn(new Element(0, 0, 8, 8), 100, 100, { ttl: 500 });

      board.despawn(bolt);
      run(viewport, 2);

      // Nothing left holding a dead element until its timer would have fired.
      expect(application.getScheduler().count()).toBe(0);
    });
  });
});
