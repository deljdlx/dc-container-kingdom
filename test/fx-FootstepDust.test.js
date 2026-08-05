// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Character, Element, FootstepDust } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

/** A layer double: records bursts, no canvas anywhere. */
const fakeLayer = () => ({ bursts: [], emit(descriptor) { this.bursts.push(descriptor); } });

/** Run the emitter long enough for at least one burst window to elapse. */
function tick(emitter, times = 1) {
  for (let i = 0; i < times; i += 1) {
    emitter.update(FootstepDust.interval);
  }
}

describe('Character - the walking signal', () => {
  it('is false before anything moves', () => {
    expect(new Character(0, 0).isWalking()).toBe(false);
  });

  it('is true on a frame that covered ground', () => {
    const character = new Character(0, 0);
    character.update(12);

    expect(character.isWalking()).toBe(true);
  });

  it('falls back to false on the very next still frame', () => {
    const character = new Character(0, 0);
    character.update(12);
    character.update(0);

    // One frame wide on purpose: dust must stop when the feet do, not trail.
    expect(character.isWalking()).toBe(false);
  });

  it('ignores a nonsense distance rather than latching on it', () => {
    const character = new Character(0, 0);
    character.update(Number.NaN);

    expect(character.isWalking()).toBe(false);
  });
});

describe('FootstepDust - asking what it follows', () => {
  it('emits under a walking character without being told how to check', () => {
    const layer = fakeLayer();
    const character = new Character(0, 0);
    const dust = new FootstepDust(layer, { follow: character });

    character.update(12);
    tick(dust);

    // The point of the ticket: no `isMoving` wired by the host, so the same
    // effect works under an NPC as under the player.
    expect(layer.bursts.length).toBeGreaterThan(0);
  });

  it('stays silent under a character standing still', () => {
    const layer = fakeLayer();
    const character = new Character(0, 0);
    const dust = new FootstepDust(layer, { follow: character });

    character.update(0);
    tick(dust);

    expect(layer.bursts).toEqual([]);
  });

  it('stays silent when what it follows cannot answer', () => {
    const layer = fakeLayer();
    const dust = new FootstepDust(layer, { follow: new Element(0, 0, 32, 32) });

    tick(dust, 3);

    // Better mute than dust under a statue.
    expect(layer.bursts).toEqual([]);
  });

  it('lets an explicit predicate win over the followed element', () => {
    const layer = fakeLayer();
    const character = new Character(0, 0);
    const dust = new FootstepDust(layer, { follow: character, isMoving: () => false });

    character.update(12);
    tick(dust);

    expect(layer.bursts).toEqual([]);
  });

  it('spawns on the ground layer, under what stands in front', () => {
    const layer = fakeLayer();
    const character = new Character(0, 0);
    const dust = new FootstepDust(layer, { follow: character });

    character.update(12);
    tick(dust);

    expect(layer.bursts[0].layer).toBe('ground');
  });
});
