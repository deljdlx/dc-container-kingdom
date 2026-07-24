import {
  Application,
  House00,
  House01,
  Tree00,
  Fountain00,
  Sunflower00,
  Man00,
  Woman00,
  Woman01,
  Woman02,
  PatrolBehavior,
  FleeBehavior,
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

// A small crowd of collidable NPCs to stress collisions & rendering: 8 that
// patrol back and forth (varied axes/speeds, some paths cross so they collide
// with each other too — overlaps(board) sees the other NPCs) and 2 that stand
// still. Bump the player into any of them to feel the block.
const originArea = board.getAreaAt(0, 0);
const patrols = [];

/**
 * Drop an NPC into the origin area. With `patrolOpts` it wanders back and
 * forth; without, it stands still (still collidable).
 * @param {Function} Base a character-base class
 * @param {number} x local X in the area
 * @param {number} y local Y in the area
 * @param {object|null} [patrolOpts] PatrolBehavior options, or null to stand
 */
function spawnNpc(Base, x, y, patrolOpts = null) {
  const npc = new Base();
  originArea.addElement(x, y, npc);
  if (patrolOpts) {
    patrols.push(new PatrolBehavior(npc, patrolOpts));
  }
}

// 8 moving NPCs.
spawnNpc(Man00,   340, 170, { axis: 'horizontal', distance: 200, speed: 3 });
spawnNpc(Woman00, 380, 90,  { axis: 'horizontal', distance: 220, speed: 4 });
spawnNpc(Woman01, 120, 300, { axis: 'vertical',   distance: 160, speed: 2 });
spawnNpc(Woman02, 610, 470, { axis: 'horizontal', distance: 200, speed: 3 });
spawnNpc(Man00,   410, 300, { axis: 'vertical',   distance: 130, speed: 3 });
spawnNpc(Woman00, 790, 110, { axis: 'vertical',   distance: 220, speed: 2 });
spawnNpc(Woman01, 330, 400, { axis: 'horizontal', distance: 170, speed: 4 });
spawnNpc(Man00,   850, 360, { axis: 'vertical',   distance: 130, speed: 3 });

// 2 immobile NPCs.
spawnNpc(Woman02, 280, 160);
spawnNpc(Man00,   440, 230);

// Deckard Cain — a stationary NPC who greets the player the moment they bump
// into him. Only the player's collision detection fires events (patrols probe
// with a pure overlap test), so the bubble pops on contact with the player.
const cain = new Man00();
originArea.addElement(470, 360, cain);
cain.addEventListener('element.collision', () => {
  if (!cain.isReacting()) {
    cain.quickReaction('Hello my friend, stay a while and listen');
  }
});

// A shy NPC that flees when the player enters its trigger radius (tests
// triggers): approach it and it backs away.
const shy = new Woman01();
originArea.addElement(250, 240, shy);
new FleeBehavior(shy, { radius: 110, speed: 4 }).start();

// The player. Placed at the viewport centre; the camera keeps it centred.
viewport.enableMainCharacter(VIEW_W / 2, VIEW_H / 2);

viewport.render();
viewport.run();
patrols.forEach(patrol => patrol.start());
