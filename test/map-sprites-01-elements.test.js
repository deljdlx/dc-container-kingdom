import { describe, expect, it } from 'vitest';
import * as engine from '../src/engine/index.js';
import { getCatalogEntries } from '../src/engine/catalog/catalog-registry.js';

const SHEET_WIDTH = 1920;
const SHEET_HEIGHT = 3360;
const LEGACY_NAMES = ['Tree00', 'Ground00', 'Fountain00', 'Sunflower00', 'Fence00H', 'Fence00V'];
const TREE_FAMILY_COUNTS = {
  Conifer: 36,
  LeafTree: 27,
  CanopyTree: 24,
  TallTree: 30,
  DeadTree: 25,
  SaplingTree: 6,
};

const mapSprites01 = Object.entries(engine)
  .filter(([, exported]) => typeof exported === 'function'
    && exported.descriptor?.atlas === 'map/map-sprites-01.png')
  .map(([name, ElementClass]) => ({ name, descriptor: ElementClass.descriptor, ElementClass }));

const treePack = mapSprites01
  .filter(({ name }) => /^(Conifer|LeafTree|CanopyTree|TallTree|DeadTree|SaplingTree)\d{2}$/.test(name));

function toRect(descriptor) {
  const [frameX, frameY] = descriptor.frame;
  const x = -frameX;
  const y = -frameY;
  return {
    x0: x,
    y0: y,
    x1: x + descriptor.width,
    y1: y + descriptor.height,
  };
}

function overlaps(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

describe('map-sprites-01 autonomous tree pack', () => {
  it('exposes the historical elements unchanged', () => {
    expect(engine.Tree00.descriptor).toMatchObject({
      width: 64,
      height: 64,
      atlas: 'map/map-sprites-01.png',
      frame: [-256, 0],
      collision: [24, 34, 16, 24],
    });

    expect(engine.Ground00.descriptor).toMatchObject({
      width: 50,
      height: 50,
      atlas: 'map/map-sprites-01.png',
      frame: [-1790, -800],
      manualZ: true,
      shadow: false,
    });

    expect(engine.Fountain00.descriptor).toMatchObject({
      width: 80,
      height: 64,
      atlas: 'map/map-sprites-01.png',
      frame: [-1170, -2754],
      collision: [4, 5, 70, 59],
    });

    expect(engine.Sunflower00.descriptor).toMatchObject({
      width: 16,
      height: 24,
      atlas: 'map/map-sprites-01.png',
      frame: [-1760, -1256],
    });

    expect(engine.Fence00H.descriptor).toMatchObject({
      width: 16,
      height: 16,
      atlas: 'map/map-sprites-01.png',
      frame: [-1520, -1520],
      collision: [0, 0, 16, 16],
    });

    expect(engine.Fence00V.descriptor).toMatchObject({
      width: 8,
      height: 16,
      atlas: 'map/map-sprites-01.png',
      frame: [-1504, -1504],
      collision: [0, 0, 8, 16],
    });
  });

  it('publishes a large autonomous tree set by family', () => {
    expect(treePack).toHaveLength(148);

    const byFamily = treePack.reduce((acc, { name }) => {
      const family = name.replace(/\d{2}$/, '');
      acc.set(family, (acc.get(family) ?? 0) + 1);
      return acc;
    }, new Map());

    expect(Object.fromEntries(byFamily)).toEqual(TREE_FAMILY_COUNTS);
  });

  it('keeps all map-sprites-01 cuts inside the sheet bounds', () => {
    const outside = mapSprites01.filter(({ descriptor }) => {
      const [x, y] = descriptor.frame;
      const left = -x;
      const top = -y;
      return left < 0
        || top < 0
        || left + descriptor.width > SHEET_WIDTH
        || top + descriptor.height > SHEET_HEIGHT;
    });

    expect(outside.map(({ name }) => name)).toEqual([]);
  });

  it('keeps the autonomous tree cuts non-overlapping', () => {
    const clashes = [];

    treePack.forEach((left, i) => {
      const leftRect = toRect(left.descriptor);
      treePack.slice(i + 1).forEach((right) => {
        const rightRect = toRect(right.descriptor);
        if (overlaps(leftRect, rightRect)) {
          clashes.push(`${left.name} overlaps ${right.name}`);
        }
      });
    });

    expect(clashes).toEqual([]);
  });

  it('marks every new tree sprite as blocking and keeps legacy names', () => {
    const missingCollision = treePack
      .filter(({ descriptor }) => !descriptor.collision)
      .map(({ name }) => name);

    expect(missingCollision).toEqual([]);

    LEGACY_NAMES.forEach((name) => {
      expect(mapSprites01.some((entry) => entry.name === name)).toBe(true);
    });
  });

  it('surfaces every autonomous tree in the catalog', () => {
    const byName = new Set(getCatalogEntries(engine).map((entry) => entry.name));

    const missing = treePack
      .filter(({ name }) => !byName.has(name))
      .map(({ name }) => name);

    expect(missing).toEqual([]);
  });
});
