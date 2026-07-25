import { describe, expect, it } from 'vitest';
import * as engine from '../src/engine/index.js';
import { getCatalogEntries } from '../src/engine/catalog/catalog-registry.js';

const SHEET_WIDTH = 1920;
const SHEET_HEIGHT = 3360;
const TREE_NAMES = Array.from({ length: 30 }, (_unused, index) => `Tree${String(index + 1).padStart(2, '0')}`);

const mapSprites02 = TREE_NAMES.map((name) => ({ name, descriptor: engine[name].descriptor }));

function toRect(descriptor) {
  const [frameX, frameY] = descriptor.frame;
  const left = -frameX;
  const top = -frameY;

  return {
    left,
    top,
    right: left + descriptor.width,
    bottom: top + descriptor.height,
  };
}

function overlaps(left, right) {
  return left.left < right.right
    && left.right > right.left
    && left.top < right.bottom
    && left.bottom > right.top;
}

describe('map-sprites-02 vegetation lot', () => {
  it('keeps the historical map-sprites-01 Tree00 untouched', () => {
    expect(engine.Tree00.descriptor).toMatchObject({
      width: 64,
      height: 64,
      atlas: 'map/map-sprites-01.png',
      frame: [-256, 0],
      collision: [24, 34, 16, 24],
    });
  });

  it('exposes the first autonomous vegetation lot from map-sprites-02', () => {
    expect(mapSprites02).toHaveLength(30);
    expect(mapSprites02.map(({ name }) => name)).toEqual(TREE_NAMES);
  });

  it('cuts every sprite inside the atlas bounds', () => {
    const outside = mapSprites02.filter(({ descriptor }) => {
      const rect = toRect(descriptor);
      return rect.left < 0
        || rect.top < 0
        || rect.right > SHEET_WIDTH
        || rect.bottom > SHEET_HEIGHT;
    });

    expect(outside).toEqual([]);
  });

  it('keeps the lot non-overlapping', () => {
    const clashes = [];

    mapSprites02.forEach((left, index) => {
      const leftRect = toRect(left.descriptor);
      mapSprites02.slice(index + 1).forEach((right) => {
        if (overlaps(leftRect, toRect(right.descriptor))) {
          clashes.push(`${left.name} overlaps ${right.name}`);
        }
      });
    });

    expect(clashes).toEqual([]);
  });

  it('marks every new tree as blocking and shadowless', () => {
    const missingCollision = mapSprites02.filter(({ descriptor }) => !descriptor.collision).map(({ name }) => name);
    const shadowed = mapSprites02.filter(({ descriptor }) => descriptor.shadow !== false).map(({ name }) => name);

    expect(missingCollision).toEqual([]);
    expect(shadowed).toEqual([]);
  });

  it('surfaces every new tree in the catalog', () => {
    const byName = new Set(getCatalogEntries(engine).map((entry) => entry.name));
    const missing = TREE_NAMES.filter((name) => !byName.has(name));

    expect(missing).toEqual([]);
  });
});