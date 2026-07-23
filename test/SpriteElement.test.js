// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, House00, Tree00, Ground00, Flower00 } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

describe('SpriteElement — declarative appearance', () => {
  it('declares its look as pure data (no DOM, no render override)', () => {
    // Readable without constructing → the model is view-agnostic.
    expect(House00.descriptor).toMatchObject({
      width: 130,
      height: 130,
      atlas: 'map/map-sprites-02.png',
      frame: [-1734, -2390],
      collision: [10, 50, 110, 70],
    });
    expect(Ground00.descriptor.shadow).toBe(false);
  });

  it('paints the atlas frame from the descriptor', () => {
    const house = new House00();
    house.render();
    const sprite = house.getDom().querySelector('.map-element__sprite');
    expect(sprite.style.backgroundPosition).toBe('-1734px -2390px');
  });

  it('adds a shadow by default, skips it when shadow:false', () => {
    const house = new House00();
    house.render();
    expect(house.getDom().querySelectorAll('.map-element__shadow').length).toBe(1);

    const ground = new Ground00();
    ground.render();
    expect(ground.getDom().querySelectorAll('.map-element__shadow').length).toBe(0);
  });

  it('applies custom shadow overrides (Tree)', () => {
    const tree = new Tree00();
    tree.render();
    const shadow = tree.getDom().querySelector('.map-element__shadow');
    expect(shadow.style.height).toBe('30px');
    expect(shadow.style.borderRadius).toBe('100%');
  });

  it('builds a trigger zone from the descriptor (Flower)', () => {
    const flower = new Flower00();
    expect(flower.getCollisionZones('trigger').length).toBe(1);
  });

  it('opts out of y-based depth via manualZ (Ground)', () => {
    expect(new Ground00().manualZ).toBe(true);
  });
});
