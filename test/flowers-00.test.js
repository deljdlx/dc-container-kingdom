import { describe, expect, it } from 'vitest';
import * as engine from '../src/engine/index.js';
import { getCatalogEntries } from '../src/engine/catalog/catalog-registry.js';
import {
  FLOWERS_00_ATLAS,
  FLOWERS_00_CELL,
} from '../src/engine/content/Flowers/atlas.js';

const SHEET_SIZE = 512;
const SPRITE_COUNT = 219;
const OCCUPIED_CELLS = 240;
const FAMILY_COUNT = 29;

/** Every public element cut out of the flowers-00 sheet. */
const sheet = Object.entries(engine)
  .filter(([, exported]) => typeof exported === 'function'
    && exported.descriptor?.atlas === FLOWERS_00_ATLAS)
  .map(([name, ElementClass]) => ({ name, descriptor: ElementClass.descriptor }));

/**
 * Atlas cells covered by a sprite, as `col,row` keys.
 * @param {{descriptor: import('../src/engine/map/SpriteElement.js').SpriteDescriptor}} sprite
 * @returns {string[]}
 */
function cellsOf({ descriptor }) {
  const col = -descriptor.frame[0] / FLOWERS_00_CELL;
  const row = -descriptor.frame[1] / FLOWERS_00_CELL;
  const cols = descriptor.width / FLOWERS_00_CELL;
  const rows = descriptor.height / FLOWERS_00_CELL;

  return Array.from({ length: cols * rows }, (_unused, index) =>
    `${col + (index % cols)},${row + Math.floor(index / cols)}`);
}

describe('flowers-00 sprite sheet', () => {
  it('exposes the whole sheet as public elements', () => {
    expect(sheet).toHaveLength(SPRITE_COUNT);
  });

  it('cuts every sprite on the 32 px grid, inside the sheet', () => {
    const misaligned = sheet.filter(({ descriptor }) =>
      [...descriptor.frame, descriptor.width, descriptor.height]
        .some((value) => value % FLOWERS_00_CELL !== 0));

    const outside = sheet.filter(({ descriptor }) => {
      const [x, y] = descriptor.frame;
      return x > 0 || y > 0
        || descriptor.width - x > SHEET_SIZE
        || descriptor.height - y > SHEET_SIZE;
    });

    expect(misaligned.map(({ name }) => name)).toEqual([]);
    expect(outside.map(({ name }) => name)).toEqual([]);
  });

  it('never cuts the same atlas cell twice', () => {
    const owners = new Map();
    const clashes = [];

    sheet.forEach((sprite) => {
      cellsOf(sprite).forEach((key) => {
        if (owners.has(key)) {
          clashes.push(`cell ${key}: ${owners.get(key)} and ${sprite.name}`);
        }
        owners.set(key, sprite.name);
      });
    });

    expect(clashes).toEqual([]);
    expect(owners.size).toBe(OCCUPIED_CELLS);
  });

  it('keeps Flower00 — public API predating the sheet pass — untouched', () => {
    expect(engine.Flower00.descriptor).toMatchObject({
      width: 32,
      height: 32,
      atlas: 'map/flowers-00.png',
      frame: [0, -96],
      trigger: [0, 0, 32, 32],
    });
    expect(engine.Flower00.descriptor.shadow).not.toBe(false);
  });

  it('makes solid only what should block the player', () => {
    const solid = sheet
      .filter(({ descriptor }) => descriptor.collision)
      .map(({ name }) => name)
      .sort();

    expect(solid).toEqual([
      'HollowLog00', 'HollowLog01', 'HollowLog02',
      'Rock00', 'Rock01', 'Rock02', 'Rock03',
      'Stump00', 'Stump01',
      'Well00',
    ]);
  });

  it('adds no trigger zone beyond the legacy Flower00', () => {
    const triggers = sheet
      .filter(({ descriptor }) => descriptor.trigger)
      .map(({ name }) => name);

    expect(triggers).toEqual(['Flower00']);
  });

  it('opts ground cover out of y-based depth sorting', () => {
    const ground = sheet
      .filter(({ descriptor }) => descriptor.manualZ)
      .map(({ name }) => name)
      .sort();

    expect(ground).toEqual([
      'FlowerGrass00', 'FlowerGrass01', 'FlowerGrass02',
      'FlowerGrass03', 'FlowerGrass04', 'FlowerGrass05',
      'FlowerPatch00', 'FlowerPatch01', 'FlowerPatch02',
      'FlowerPatch03', 'FlowerPatch04',
      'StoneSlab00',
    ]);
  });

  it('lets the art carry its own painted shadow', () => {
    const shadowed = sheet
      .filter(({ descriptor }) => descriptor.shadow !== false)
      .map(({ name }) => name);

    expect(shadowed).toEqual(['Flower00']);
  });

  it('shows up in the catalogue, grouped by family', () => {
    const byName = new Map(getCatalogEntries(engine).map((entry) => [entry.name, entry]));
    const missing = sheet.filter(({ name }) => !byName.has(name)).map(({ name }) => name);

    expect(missing).toEqual([]);

    const families = new Set(sheet.map(({ name }) => byName.get(name).family));
    expect(families.size).toBe(FAMILY_COUNT);
    expect(families).toContain('Flower');
    expect(families).toContain('LilyPad');
    expect(families).toContain('GiantMushroom');
  });
});
