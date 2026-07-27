const SORT_OPTIONS = new Set(['family', 'name', 'footprint']);
const KIND_FILTERS = new Set(['all', 'sprite', 'character', 'composite']);
const ZONE_FILTERS = new Set(['all', 'collision', 'trigger']);

/**
 * @typedef {{
 *   query: string,
 *   kind: 'all'|'sprite'|'character'|'composite',
 *   zone: 'all'|'collision'|'trigger',
 *   sort: 'family'|'name'|'footprint',
 * }} CatalogState
 */

/**
 * @param {string | null} value
 * @param {Set<string>} allowed
 * @param {string} fallback
 * @returns {string}
 */
function safeValue(value, allowed, fallback) {
  if (!value || !allowed.has(value)) {
    return fallback;
  }
  return value;
}

/**
 * @param {URLSearchParams} params
 * @returns {CatalogState}
 */
export function parseCatalogState(params) {
  return {
    query: (params.get('q') ?? '').trim(),
    kind: /** @type {CatalogState['kind']} */ (safeValue(params.get('kind'), KIND_FILTERS, 'all')),
    zone: /** @type {CatalogState['zone']} */ (safeValue(params.get('zone'), ZONE_FILTERS, 'all')),
    sort: /** @type {CatalogState['sort']} */ (safeValue(params.get('sort'), SORT_OPTIONS, 'family')),
  };
}

/**
 * @param {CatalogState} state
 * @returns {URLSearchParams}
 */
export function serializeCatalogState(state) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.kind !== 'all') params.set('kind', state.kind);
  if (state.zone !== 'all') params.set('zone', state.zone);
  if (state.sort !== 'family') params.set('sort', state.sort);
  return params;
}

/**
 * @param {{name: string, family: string, kind: string, kindLabel: string, collisionCount?: number, triggerCount?: number, footprint?: number}[]} entries
 * @param {CatalogState} state
 * @returns {typeof entries}
 */
export function filterAndSortCatalogEntries(entries, state) {
  const queryNeedle = state.query.trim().toLowerCase();

  const filtered = entries.filter((entry) => {
    if (state.kind !== 'all' && entry.kind !== state.kind) {
      return false;
    }

    if (state.zone === 'collision' && (entry.collisionCount ?? 0) === 0) {
      return false;
    }

    if (state.zone === 'trigger' && (entry.triggerCount ?? 0) === 0) {
      return false;
    }

    if (queryNeedle === '') {
      return true;
    }

    const haystack = `${entry.name} ${entry.family} ${entry.kindLabel}`.toLowerCase();
    return haystack.includes(queryNeedle);
  });

  return filtered.sort((left, right) => {
    if (state.sort === 'name') {
      return left.name.localeCompare(right.name);
    }

    if (state.sort === 'footprint') {
      const rightFootprint = right.footprint ?? 0;
      const leftFootprint = left.footprint ?? 0;
      if (rightFootprint !== leftFootprint) {
        return rightFootprint - leftFootprint;
      }
      return left.name.localeCompare(right.name);
    }

    const familyDelta = left.family.localeCompare(right.family);
    if (familyDelta !== 0) {
      return familyDelta;
    }
    return left.name.localeCompare(right.name);
  });
}

/**
 * @param {{family: string}[]} entries
 * @returns {Array<{family: string, count: number}>}
 */
export function buildFamilyIndex(entries) {
  const counts = new Map();
  entries.forEach((entry) => {
    counts.set(entry.family, (counts.get(entry.family) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((left, right) => left.family.localeCompare(right.family));
}

/**
 * @param {{family: string}[]} entries
 * @returns {Map<string, typeof entries>}
 */
export function groupByFamily(entries) {
  const grouped = new Map();
  entries.forEach((entry) => {
    if (!grouped.has(entry.family)) {
      grouped.set(entry.family, []);
    }
    grouped.get(entry.family).push(entry);
  });
  return grouped;
}
