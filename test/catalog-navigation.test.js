import { describe, expect, it } from 'vitest';
import {
  buildFamilyIndex,
  filterAndSortCatalogEntries,
  groupByFamily,
  parseCatalogState,
  serializeCatalogState,
} from '../src/engine/catalog/catalog-navigation.js';

const SAMPLE_ENTRIES = [
  {
    name: 'Tree00',
    family: 'Tree',
    kind: 'sprite',
    kindLabel: 'Sprite',
    collisionCount: 1,
    triggerCount: 0,
    footprint: 900,
  },
  {
    name: 'Tree01',
    family: 'Tree',
    kind: 'sprite',
    kindLabel: 'Sprite',
    collisionCount: 0,
    triggerCount: 0,
    footprint: 400,
  },
  {
    name: 'Guard00',
    family: 'Guard',
    kind: 'character',
    kindLabel: 'Character',
    collisionCount: 1,
    triggerCount: 1,
    footprint: 500,
  },
  {
    name: 'Fountain00',
    family: 'Fountain',
    kind: 'composite',
    kindLabel: 'Composite',
    collisionCount: 1,
    triggerCount: 0,
    footprint: 1600,
  },
];

describe('catalog navigation helpers', () => {
  it('parses and serializes URL state with safe defaults', () => {
    const parsed = parseCatalogState(new globalThis.URLSearchParams('q=tree&kind=sprite&zone=collision&sort=footprint'));
    expect(parsed).toEqual({
      query: 'tree',
      kind: 'sprite',
      zone: 'collision',
      sort: 'footprint',
    });

    const unsafe = parseCatalogState(new globalThis.URLSearchParams('kind=unknown&zone=bad&sort=boom'));
    expect(unsafe).toEqual({
      query: '',
      kind: 'all',
      zone: 'all',
      sort: 'family',
    });

    expect(serializeCatalogState(parsed).toString()).toBe('q=tree&kind=sprite&zone=collision&sort=footprint');
    expect(serializeCatalogState(unsafe).toString()).toBe('');
  });

  it('combines query, kind and zone filters', () => {
    const filtered = filterAndSortCatalogEntries(SAMPLE_ENTRIES, {
      query: 'guard',
      kind: 'character',
      zone: 'trigger',
      sort: 'family',
    });

    expect(filtered.map((entry) => entry.name)).toEqual(['Guard00']);
  });

  it('sorts by footprint descending then by name', () => {
    const filtered = filterAndSortCatalogEntries(SAMPLE_ENTRIES, {
      query: '',
      kind: 'all',
      zone: 'all',
      sort: 'footprint',
    });

    expect(filtered.map((entry) => entry.name)).toEqual([
      'Fountain00',
      'Tree00',
      'Guard00',
      'Tree01',
    ]);
  });

  it('builds family index and grouped map', () => {
    const families = buildFamilyIndex(SAMPLE_ENTRIES);
    expect(families).toEqual([
      { family: 'Fountain', count: 1 },
      { family: 'Guard', count: 1 },
      { family: 'Tree', count: 2 },
    ]);

    const grouped = groupByFamily(SAMPLE_ENTRIES);
    expect(grouped.get('Tree')?.length).toBe(2);
    expect(grouped.get('Fountain')?.[0].name).toBe('Fountain00');
  });
});
