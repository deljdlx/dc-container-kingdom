import {
  applyDebugFlag,
  isDebugEnabled,
  setAssetsBase,
} from '../index.js';
import * as engine from '../index.js';
import { getCatalogEntries } from './catalog-registry.js';

applyDebugFlag();
setAssetsBase('/engine/images');

const catalogEntries = getCatalogEntries(engine);
const summaryNode = document.querySelector('[data-catalog-summary]');
const galleryNode = document.querySelector('[data-catalog-gallery]');

summaryNode.textContent = `${catalogEntries.length} public visual elements available from engine/index.js.`;

catalogEntries.forEach((entry) => {
  galleryNode.append(buildCard(entry));
});

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
