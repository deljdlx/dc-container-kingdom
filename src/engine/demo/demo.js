import {
  Application,
  House00,
  House01,
  Tree00,
  Fountain00,
  Sunflower00,
  setAssetsBase,
} from '../index.js';

// The demo page lives under /engine/demo/, so point sprite URLs at an absolute
// engine path rather than the default (which is relative to the host page).
setAssetsBase('/engine/images');

const VIEW_W = 900;
const VIEW_H = 560;

const app = new Application('#viewport', VIEW_W, VIEW_H);
const viewport = app.getViewport();
const board = viewport.getBoard();

// Build a 7×7 grid of areas around the origin.
board.initialize();

/**
 * Drop elements into an area's local space.
 * @param {number} areaX
 * @param {number} areaY
 * @param {Array<[number, number, Function]>} items [xLocal, yLocal, ElementClass]
 */
function populate(areaX, areaY, items) {
  const area = board.getAreaAt(areaX, areaY);
  items.forEach(([x, y, ElementClass]) => {
    area.addElement(x, y, new ElementClass());
  });
}

// Origin area: a little village to walk around (test occlusion by going
// above/below houses and trees).
populate(0, 0, [
  [120, 120, House00],
  [520, 150, House01],
  [300, 320, Tree00],
  [640, 380, Tree00],
  [200, 430, Fountain00],
  [760, 220, Tree00],
  [430, 470, Sunflower00],
]);

// Neighbouring areas — so scrolling crosses area boundaries (where the current
// depth handling gets confused).
populate(1, 0, [
  [140, 180, House00],
  [430, 360, Tree00],
  [640, 240, House01],
]);
populate(0, 1, [
  [220, 120, Tree00],
  [480, 300, House00],
  [120, 440, Sunflower00],
  [700, 460, Tree00],
]);
populate(1, 1, [
  [300, 200, House01],
  [560, 420, Tree00],
]);
populate(-1, 0, [
  [700, 200, House00],
  [420, 380, Tree00],
]);
populate(0, -1, [
  [260, 420, House00],
  [520, 300, Tree00],
]);

// The player. Placed at the viewport centre; the camera keeps it centred.
viewport.enableMainCharacter(VIEW_W / 2, VIEW_H / 2);

viewport.render();
viewport.run();
