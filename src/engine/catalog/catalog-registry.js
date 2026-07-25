import { Character, Element, SpriteElement } from '../index.js';

const EXCLUDED_ELEMENT_EXPORTS = new Set([
  'Area',
  'Board',
  'Character',
  'Element',
  'SpriteElement',
]);

const KIND_LABELS = {
  sprite: 'Sprite',
  character: 'Character',
  composite: 'Composite',
};

const KIND_ORDER = {
  sprite: 0,
  character: 1,
  composite: 2,
};

/**
 * Whether a public export is a built-in visual element worth cataloguing.
 * @param {unknown} exportedValue
 * @param {string} exportName
 * @returns {boolean}
 */
export function isCatalogElementClass(exportedValue, exportName) {
  if (typeof exportedValue !== 'function') {
    return false;
  }

  if (EXCLUDED_ELEMENT_EXPORTS.has(exportName)) {
    return false;
  }

  return exportedValue.prototype instanceof Element;
}

/**
 * @param {Function} ElementClass
 * @returns {'sprite'|'character'|'composite'}
 */
export function getCatalogKind(ElementClass) {
  if (ElementClass.prototype instanceof Character) {
    return 'character';
  }

  if (ElementClass.prototype instanceof SpriteElement) {
    return 'sprite';
  }

  return 'composite';
}

/**
 * @param {'sprite'|'character'|'composite'} kind
 * @returns {string}
 */
export function getCatalogKindLabel(kind) {
  return KIND_LABELS[kind];
}

/**
 * Family an element belongs to: its name minus the variant suffix, so that
 * `Blossom07` and `Blossom08` share the `Blossom` family, and `Fence00H` /
 * `Fence00V` share `Fence`. A name without a suffix is its own family.
 * @param {string} name
 * @returns {string}
 */
export function getCatalogFamily(name) {
  const match = /^(.+?)(\d+[A-Za-z]*)$/.exec(name);
  return match ? match[1] : name;
}

/**
 * Collect the public element classes exposed by the engine barrel, grouped by
 * kind then family so the catalogue reads as an inventory rather than a list.
 * @param {Record<string, unknown>} engineApi
 * @returns {Array<{name: string, family: string, kind: 'sprite'|'character'|'composite', kindLabel: string, ElementClass: Function}>}
 */
export function getCatalogEntries(engineApi) {
  return Object.entries(engineApi)
    .filter(([name, exportedValue]) => isCatalogElementClass(exportedValue, name))
    .map(([name, ElementClass]) => {
      const kind = getCatalogKind(/** @type {Function} */ (ElementClass));
      return {
        name,
        family: getCatalogFamily(name),
        kind,
        kindLabel: getCatalogKindLabel(kind),
        ElementClass: /** @type {Function} */ (ElementClass),
      };
    })
    .sort((left, right) => {
      const kindDelta = KIND_ORDER[left.kind] - KIND_ORDER[right.kind];
      if (kindDelta !== 0) {
        return kindDelta;
      }
      const familyDelta = left.family.localeCompare(right.family);
      if (familyDelta !== 0) {
        return familyDelta;
      }
      return left.name.localeCompare(right.name);
    });
}
