import {
  applyDebugFlag,
  isDebugEnabled,
  setAssetsBase,
} from '../index.js';
import * as engine from '../index.js';
import {
  buildFamilyIndex,
  filterAndSortCatalogEntries,
  groupByFamily,
  parseCatalogState,
  serializeCatalogState,
} from './catalog-navigation.js';
import { getCatalogEntries } from './catalog-registry.js';
import { getStageMetrics } from './preview-layout.js';

applyDebugFlag();
setAssetsBase('/engine/images');

const summaryNode = document.querySelector('[data-catalog-summary]');
const galleryNode = document.querySelector('[data-catalog-gallery]');
const filterNode = document.querySelector('[data-catalog-filter]');
const kindNode = document.querySelector('[data-catalog-kind]');
const zoneNode = document.querySelector('[data-catalog-zone]');
const sortNode = document.querySelector('[data-catalog-sort]');
const indexNode = document.querySelector('[data-catalog-index]');
const emptyNode = document.querySelector('[data-catalog-empty]');

const catalogEntries = getCatalogEntries(engine).map((entry) => buildEntryMetadata(entry));
const familyDescriptors = buildFamilyIndex(catalogEntries);
const familySections = buildFamilySections(familyDescriptors, galleryNode);
const cardCache = new Map();

buildFamilyNav(familyDescriptors, indexNode);

let state = parseCatalogState(new URLSearchParams(window.location.search));
syncControls(state);
applyState(state, false);

filterNode.addEventListener('input', () => {
  state = {
    ...state,
    query: filterNode.value,
  };
  applyState(state, true);
});

kindNode.addEventListener('change', () => {
  state = {
    ...state,
    kind: kindNode.value,
  };
  applyState(state, true);
});

zoneNode.addEventListener('change', () => {
  state = {
    ...state,
    zone: zoneNode.value,
  };
  applyState(state, true);
});

sortNode.addEventListener('change', () => {
  state = {
    ...state,
    sort: sortNode.value,
  };
  applyState(state, true);
});

window.addEventListener('popstate', () => {
  state = parseCatalogState(new URLSearchParams(window.location.search));
  syncControls(state);
  applyState(state, false);
});

/**
 * @param {Array<{family: string, count: number}>} families
 * @param {HTMLElement} container
 * @returns {Map<string, {section: HTMLElement, heading: HTMLHeadingElement, count: HTMLSpanElement, grid: HTMLElement, total: number}>}
 */
function buildFamilySections(families, container) {
  const sections = new Map();
  families.forEach((familyDescriptor) => {
    const sectionDescriptor = buildFamilySection(familyDescriptor.family, familyDescriptor.count);
    container.append(sectionDescriptor.section);
    sections.set(familyDescriptor.family, sectionDescriptor);
  });
  return sections;
}

/**
 * @param {string} family
 * @param {number} familyCount
 * @returns {{section: HTMLElement, heading: HTMLHeadingElement, count: HTMLSpanElement, grid: HTMLElement, total: number}}
 */
function buildFamilySection(family, familyCount) {
  const section = document.createElement('section');
  section.className = 'catalog-family';
  section.id = toFamilyAnchor(family);

  const heading = document.createElement('h2');
  heading.className = 'catalog-family__title';
  heading.textContent = family;

  const count = document.createElement('span');
  count.className = 'catalog-family__count';
  count.textContent = `${familyCount}`;
  heading.append(count);

  const grid = document.createElement('div');
  grid.className = 'catalog-grid';
  grid.setAttribute('aria-label', `${family} elements`);

  section.append(heading, grid);
  return {
    section,
    heading,
    count,
    grid,
    total: familyCount,
  };
}

/**
 * @param {ReturnType<typeof parseCatalogState>} nextState
 * @param {boolean} persist
 */
function applyState(nextState, persist) {
  const visibleEntries = filterAndSortCatalogEntries(catalogEntries, nextState);
  const groupedEntries = groupByFamily(visibleEntries);

  familySections.forEach((sectionDescriptor, family) => {
    const familyEntries = groupedEntries.get(family) ?? [];
    sectionDescriptor.section.hidden = familyEntries.length === 0;
    sectionDescriptor.count.textContent = familyEntries.length === sectionDescriptor.total
      ? `${sectionDescriptor.total}`
      : `${familyEntries.length} / ${sectionDescriptor.total}`;
    sectionDescriptor.grid.replaceChildren(...familyEntries.map((entry) => getCard(entry)));
  });

  updateFamilyIndex(groupedEntries);

  const total = catalogEntries.length;
  const visible = visibleEntries.length;
  emptyNode.hidden = visible !== 0;
  summaryNode.textContent = buildSummaryText(visible, total, nextState.query);

  if (persist) {
    const params = serializeCatalogState(nextState);
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }
}

/**
 * @param {Map<string, Array<{name: string}>>} groupedEntries
 */
function updateFamilyIndex(groupedEntries) {
  indexNode.querySelectorAll('a[data-family-link]').forEach((linkNode) => {
    const family = linkNode.getAttribute('data-family-link');
    if (!family) {
      return;
    }

    const countNode = linkNode.querySelector('[data-family-count]');
    const visibleCount = groupedEntries.get(family)?.length ?? 0;
    if (countNode) {
      countNode.textContent = String(visibleCount);
    }

    linkNode.classList.toggle('catalog-index__link--hidden', visibleCount === 0);
    linkNode.setAttribute('aria-disabled', visibleCount === 0 ? 'true' : 'false');
    linkNode.tabIndex = visibleCount === 0 ? -1 : 0;
  });
}

/**
 * @param {Array<{family: string, count: number}>} families
 * @param {HTMLElement} container
 */
function buildFamilyNav(families, container) {
  const list = document.createElement('ul');
  list.className = 'catalog-index__list';

  families.forEach((familyDescriptor) => {
    const item = document.createElement('li');

    const link = document.createElement('a');
    link.className = 'catalog-index__link';
    link.href = `#${toFamilyAnchor(familyDescriptor.family)}`;
    link.setAttribute('data-family-link', familyDescriptor.family);

    const label = document.createElement('span');
    label.textContent = familyDescriptor.family;

    const count = document.createElement('span');
    count.className = 'catalog-index__count';
    count.setAttribute('data-family-count', '');
    count.textContent = String(familyDescriptor.count);

    link.append(label, count);
    item.append(link);
    list.append(item);
  });

  container.append(list);
}

/**
 * @param {string} family
 * @returns {string}
 */
function toFamilyAnchor(family) {
  return `family-${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * @param {ReturnType<typeof parseCatalogState>} nextState
 */
function syncControls(nextState) {
  filterNode.value = nextState.query;
  kindNode.value = nextState.kind;
  zoneNode.value = nextState.zone;
  sortNode.value = nextState.sort;
}

/**
 * @param {number} visible
 * @param {number} total
 * @param {string} query
 * @returns {string}
 */
function buildSummaryText(visible, total, query) {
  if (!query.trim()) {
    return `${visible} public visual elements available from engine/index.js.`;
  }
  return `${visible} of ${total} public visual elements match "${query.trim()}".`;
}

/**
 * @param {{name: string, family: string, kind: string, kindLabel: string, ElementClass: Function}} entry
 * @returns {{name: string, family: string, kind: string, kindLabel: string, ElementClass: Function, collisionCount: number, triggerCount: number, footprint: number}}
 */
function buildEntryMetadata(entry) {
  const element = new entry.ElementClass();
  const stageMetrics = getStageMetrics(element);

  return {
    ...entry,
    collisionCount: element.getCollisionZones('collision').length,
    triggerCount: element.getCollisionZones('trigger').length,
    footprint: stageMetrics.contentWidth * stageMetrics.contentHeight,
  };
}

/**
 * @param {{name: string, family: string, kind: string, kindLabel: string, ElementClass: Function}} entry
 * @returns {HTMLElement}
 */
function getCard(entry) {
  const cachedCard = cardCache.get(entry.name);
  if (cachedCard) {
    return cachedCard;
  }

  const built = buildCard(entry);
  cardCache.set(entry.name, built);
  return built;
}

/**
 * @param {{name: string, kind: string, kindLabel: string, ElementClass: Function}} entry
 * @returns {HTMLElement}
 */
function buildCard(entry) {
  const element = new entry.ElementClass();
  const stageMetrics = getStageMetrics(element);

  const card = document.createElement('article');
  card.className = 'catalog-card';

  const header = document.createElement('header');
  header.className = 'catalog-card__header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'catalog-card__title-wrap';

  const title = document.createElement('h2');
  title.className = 'catalog-card__title';
  title.textContent = entry.name;

  const kind = document.createElement('span');
  kind.className = `catalog-card__kind catalog-card__kind--${entry.kind}`;
  kind.textContent = entry.kindLabel;

  titleWrap.append(title, kind);

  const meta = document.createElement('p');
  meta.className = 'catalog-card__meta';
  meta.textContent = `${formatSize(element.width(), element.height())} footprint`;

  header.append(titleWrap, meta);

  const preview = document.createElement('div');
  preview.className = 'catalog-preview';

  const frame = document.createElement('div');
  frame.className = 'catalog-preview__frame';

  const canvas = document.createElement('div');
  canvas.className = 'catalog-preview__canvas';
  canvas.style.setProperty('--preview-width', `${stageMetrics.width}px`);
  canvas.style.setProperty('--preview-height', `${stageMetrics.height}px`);

  const renderedTree = renderElementTree(element);
  renderedTree.style.left = `${stageMetrics.offsetX}px`;
  renderedTree.style.top = `${stageMetrics.offsetY}px`;
  canvas.append(renderedTree);

  if (isDebugEnabled()) {
    element.renderCollisionZones();
  }

  frame.append(canvas);
  preview.append(frame);

  const facts = document.createElement('dl');
  facts.className = 'catalog-facts';

  facts.append(
    buildFact('Type', entry.kindLabel),
    buildFact('Bounds', formatSize(stageMetrics.contentWidth, stageMetrics.contentHeight)),
    buildFact('Collision', describeZones(element.getCollisionZones('collision'))),
    buildFact('Trigger', describeZones(element.getCollisionZones('trigger'))),
  );

  if (entry.kind === 'composite') {
    facts.append(buildFact('Children', `${element.getAllChildren().length} nested elements`));
  }

  card.append(header, preview, facts);
  return card;
}

/**
 * @param {import('../index.js').Element} element
 * @returns {HTMLElement}
 */
function renderElementTree(element) {
  const dom = /** @type {HTMLElement} */ (element.render());
  const content = dom.querySelector('.map-element__inner-content');

  element.getChildren().forEach((child) => {
    content.append(renderElementTree(child));
  });

  return dom;
}

/**
 * @param {string} label
 * @param {string} value
 * @returns {DocumentFragment}
 */
function buildFact(label, value) {
  const fragment = document.createDocumentFragment();

  const term = document.createElement('dt');
  term.textContent = label;

  const description = document.createElement('dd');
  description.textContent = value;

  fragment.append(term, description);
  return fragment;
}

/**
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function formatSize(width, height) {
  return `${width} x ${height} px`;
}

/**
 * @param {import('../index.js').BoundingBox[]} zones
 * @returns {string}
 */
function describeZones(zones) {
  if (zones.length === 0) {
    return 'None';
  }

  return zones
    .map((zone) => formatBox(zone))
    .join(', ');
}

/**
 * @param {import('../index.js').BoundingBox} box
 * @returns {string}
 */
function formatBox(box) {
  return `${box.x0()},${box.y0()} ${box.width()}x${box.height()}`;
}
