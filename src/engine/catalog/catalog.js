import {
  applyDebugFlag,
  isDebugEnabled,
  setAssetsBase,
} from '../index.js';
import * as engine from '../index.js';
import { getCatalogEntries } from './catalog-registry.js';

applyDebugFlag();
setAssetsBase('/engine/images');

/** Preview side, in px, a magnified sprite aims to fill. */
const PREVIEW_TARGET = 128;
const MAX_PREVIEW_ZOOM = 4;

const catalogEntries = getCatalogEntries(engine);
const summaryNode = document.querySelector('[data-catalog-summary]');
const galleryNode = document.querySelector('[data-catalog-gallery]');
const filterNode = document.querySelector('[data-catalog-filter]');

const cards = buildFamilySections(catalogEntries, galleryNode);
applyFilter('');

filterNode.addEventListener('input', () => applyFilter(filterNode.value));

/**
 * Render one section per family, and return the cards with what they filter on.
 * @param {ReturnType<typeof getCatalogEntries>} entries
 * @param {HTMLElement} container
 * @returns {Array<{haystack: string, node: HTMLElement, section: HTMLElement}>}
 */
function buildFamilySections(entries, container) {
  const built = [];
  let section = null;
  let grid = null;
  let family = null;

  entries.forEach((entry) => {
    if (entry.family !== family) {
      family = entry.family;
      const familyEntries = entries.filter((candidate) => candidate.family === family);
      ({ section, grid } = buildFamilySection(family, familyEntries));
      container.append(section);
    }

    const node = buildCard(entry);
    grid.append(node);
    built.push({
      haystack: `${entry.name} ${entry.family} ${entry.kindLabel}`.toLowerCase(),
      node,
      section,
    });
  });

  return built;
}

/**
 * @param {string} family
 * @param {ReturnType<typeof getCatalogEntries>} familyEntries
 * @returns {{section: HTMLElement, grid: HTMLElement}}
 */
function buildFamilySection(family, familyEntries) {
  const section = document.createElement('section');
  section.className = 'catalog-family';

  const heading = document.createElement('h2');
  heading.className = 'catalog-family__title';
  heading.textContent = family;

  const count = document.createElement('span');
  count.className = 'catalog-family__count';
  count.textContent = `${familyEntries.length}`;
  heading.append(count);

  const grid = document.createElement('div');
  grid.className = 'catalog-grid';
  grid.setAttribute('aria-label', `${family} elements`);

  section.append(heading, grid);
  return { section, grid };
}

/**
 * Show the cards matching `query`, hide the rest, and keep the summary honest.
 * @param {string} query
 */
function applyFilter(query) {
  const needle = query.trim().toLowerCase();
  const visibleSections = new Set();
  let visible = 0;

  cards.forEach((card) => {
    const matches = needle === '' || card.haystack.includes(needle);
    card.node.hidden = !matches;
    if (matches) {
      visible += 1;
      visibleSections.add(card.section);
    }
  });

  galleryNode.querySelectorAll('.catalog-family').forEach((section) => {
    section.hidden = !visibleSections.has(section);
  });

  const total = cards.length;
  summaryNode.textContent = needle === ''
    ? `${total} public visual elements available from engine/index.js.`
    : `${visible} of ${total} public visual elements match "${query.trim()}".`;
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

  const zoom = previewZoom(stageMetrics);
  const meta = document.createElement('p');
  meta.className = 'catalog-card__meta';
  meta.textContent = zoom === 1
    ? `${formatSize(element.width(), element.height())} footprint`
    : `${formatSize(element.width(), element.height())} footprint, shown at ${zoom}x`;

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
  if (zoom !== 1) {
    renderedTree.style.transform = `scale(${zoom})`;
  }
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
 * @param {import('../index.js').Element} element
 * @returns {{width: number, height: number, contentWidth: number, contentHeight: number, offsetX: number, offsetY: number}}
 */
function getStageMetrics(element) {
  const bounds = element.getBoundingBox();
  const collisionBounds = element.getCollisionBoundingBox();
  const left = minDefined(0, bounds.x0(), collisionBounds.x0());
  const top = minDefined(0, bounds.y0(), collisionBounds.y0());
  const right = maxDefined(element.width(), bounds.x1(), collisionBounds.x1());
  const bottom = maxDefined(element.height(), bounds.y1(), collisionBounds.y1());

  const contentWidth = Math.max(1, right - left);
  const contentHeight = Math.max(1, bottom - top);
  const paddedWidth = Math.max(160, contentWidth + 32);
  const paddedHeight = Math.max(160, contentHeight + 32);

  return {
    width: paddedWidth,
    height: paddedHeight,
    contentWidth,
    contentHeight,
    offsetX: ((paddedWidth - contentWidth) / 2) - left,
    offsetY: ((paddedHeight - contentHeight) / 2) - top,
  };
}

/**
 * Integer magnification that fills the preview with a small sprite — most of
 * the built-in elements are 32 px pixel-art, unreadable at 1:1 on a screen.
 * @param {{contentWidth: number, contentHeight: number}} stageMetrics
 * @returns {number}
 */
function previewZoom({ contentWidth, contentHeight }) {
  const fit = Math.floor(PREVIEW_TARGET / Math.max(contentWidth, contentHeight));
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(1, fit));
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

/**
 * @param {...(number|null)} values
 * @returns {number}
 */
function minDefined(...values) {
  return Math.min(...values.filter((value) => value !== null));
}

/**
 * @param {...(number|null)} values
 * @returns {number}
 */
function maxDefined(...values) {
  return Math.max(...values.filter((value) => value !== null));
}
