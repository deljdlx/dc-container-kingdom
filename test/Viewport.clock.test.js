// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { Application, EngineEvents } from '../src/engine/index.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

/** An application with a player standing in the world, at a known place. */
function createWorld() {
  const application = new Application('#app', 900, 560);
  const viewport = application.getViewport();
  viewport.enableMainCharacter(300, 200);

  return { application, viewport };
}

/** Run `count` frames of 16 ms of real time, as the loop would. @returns {number} the last timestamp */
function run(viewport, count, from = 1000) {
  let timestamp = from;
  for (let i = 0; i <= count; i++) {
    viewport.update(timestamp);
    timestamp += 16;
  }

  return timestamp;
}

describe('the viewport runs on the clock', () => {
  it('moves the player by game time, not by real time', () => {
    const { viewport } = createWorld();
    viewport.press('right');

    const before = viewport.getCharacter().x();
    run(viewport, 10);

    expect(viewport.getCharacter().x()).toBeGreaterThan(before);
  });

  it('freezes the world under pause, and lets it go again', () => {
    const { application, viewport } = createWorld();
    viewport.press('right');
    let timestamp = run(viewport, 10);

    application.getClock().pause();
    const frozen = viewport.getCharacter().x();
    timestamp = run(viewport, 10, timestamp);

    expect(viewport.getCharacter().x()).toBe(frozen);

    application.getClock().resume();
    run(viewport, 10, timestamp);

    expect(viewport.getCharacter().x()).toBeGreaterThan(frozen);
  });

  it('keeps painting while paused — a paused game still has a screen', () => {
    const { application, viewport } = createWorld();
    run(viewport, 5);

    application.getClock().pause();
    const framesBefore = application.getClock().frame();
    run(viewport, 5);

    // The loop ran, the clock counted the frames, and time stood still.
    expect(application.getClock().frame()).toBeGreaterThan(framesBefore);
    expect(application.getClock().dt()).toBe(0);
  });

  it('slows the world down by the scale', () => {
    const { viewport } = createWorld();
    viewport.press('right');
    const start = viewport.getCharacter().x();
    run(viewport, 20);
    const fullSpeed = viewport.getCharacter().x() - start;

    const slow = createWorld();
    slow.application.getClock().scale(0.25);
    slow.viewport.press('right');
    const slowStart = slow.viewport.getCharacter().x();
    run(slow.viewport, 20);
    const quarterSpeed = slow.viewport.getCharacter().x() - slowStart;

    // Within a pixel, not to the decimal: the viewport spends whole pixels and
    // banks the remainder, so a quarter of 95 px lands on 23 rather than 23.75.
    expect(quarterSpeed).toBeLessThan(fullSpeed);
    expect(Math.abs(quarterSpeed - fullSpeed / 4)).toBeLessThanOrEqual(1);
  });

  it('tells the stylesheet what the clock is doing', () => {
    const { application, viewport } = createWorld();
    const container = document.querySelector('#app');
    run(viewport, 2);

    expect(container.classList.contains('engine--frozen')).toBe(false);
    expect(container.style.getPropertyValue('--engine-step-duration')).toBe('200ms');

    application.getClock().scale(0.5);
    run(viewport, 2);

    // Half speed, so a step the engine now takes twice as long must be eased
    // over twice as long — otherwise the browser finishes without the engine.
    expect(container.style.getPropertyValue('--engine-step-duration')).toBe('400ms');

    application.getClock().pause();
    run(viewport, 2);

    expect(container.classList.contains('engine--frozen')).toBe(true);
    expect(container.style.getPropertyValue('--engine-step-duration')).toBe('0ms');
  });
});

describe('events are stamped with game time', () => {
  it('dates an event with the clock, not the wall', () => {
    const { application, viewport } = createWorld();
    run(viewport, 5);

    const seen = [];
    application.addEventListener(EngineEvents.ELEMENT_DESTROY, event => seen.push(event));
    const clock = application.getClock();
    viewport.getCharacter().handle(EngineEvents.ELEMENT_DESTROY, { element: null });

    expect(seen).toHaveLength(1);
    expect(seen[0].at).toBe(clock.now());
  });

  it('gives two events of the same paused instant the same instant', () => {
    const { application, viewport } = createWorld();
    run(viewport, 5);
    application.getClock().pause();
    run(viewport, 5);

    const seen = [];
    application.addEventListener(EngineEvents.ELEMENT_DESTROY, event => seen.push(event.at));
    viewport.getCharacter().handle(EngineEvents.ELEMENT_DESTROY, { element: null });
    run(viewport, 3);
    viewport.getCharacter().handle(EngineEvents.ELEMENT_DESTROY, { element: null });

    expect(seen[0]).toBe(seen[1]);
  });
});
