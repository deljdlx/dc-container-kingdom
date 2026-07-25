import { describe, expect, it } from 'vitest';
import * as engine from '../src/engine/index.js';
import {
  getCatalogEntries,
  getCatalogKind,
  isCatalogElementClass,
} from '../src/engine/catalog/catalog-registry.js';

describe('catalog-registry', () => {
  it('includes built-in public visual elements and excludes engine infrastructure', () => {
    expect(isCatalogElementClass(engine.House00, 'House00')).toBe(true);
    expect(isCatalogElementClass(engine.FenceGroup00, 'FenceGroup00')).toBe(true);
    expect(isCatalogElementClass(engine.Woman01, 'Woman01')).toBe(true);

    expect(isCatalogElementClass(engine.Element, 'Element')).toBe(false);
    expect(isCatalogElementClass(engine.SpriteElement, 'SpriteElement')).toBe(false);
    expect(isCatalogElementClass(engine.Character, 'Character')).toBe(false);
    expect(isCatalogElementClass(engine.Board, 'Board')).toBe(false);
    expect(isCatalogElementClass(engine.Application, 'Application')).toBe(false);
  });

  it('classifies public elements by rendering kind', () => {
    expect(getCatalogKind(engine.House00)).toBe('sprite');
    expect(getCatalogKind(engine.Man00)).toBe('character');
    expect(getCatalogKind(engine.House01)).toBe('composite');
  });

  it('returns a stable, grouped list of public catalog entries', () => {
    const entries = getCatalogEntries(engine);
    const names = entries.map((entry) => entry.name);

    expect(names).toContain('Ground00');
    expect(names).toContain('House01');
    expect(names).toContain('Woman02');
    expect(names).not.toContain('Element');
    expect(names).not.toContain('Board');

    const firstCharacter = entries.findIndex((entry) => entry.kind === 'character');
    const firstComposite = entries.findIndex((entry) => entry.kind === 'composite');
    expect(firstCharacter).toBeGreaterThan(0);
    expect(firstComposite).toBeGreaterThan(firstCharacter);
  });
});
