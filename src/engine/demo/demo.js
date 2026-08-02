import {
  Application,
  House00,
  House01,
  Tree00,
  Fountain00,
  Sunflower00,
  Man00,
  Man01,
  Man02,
  Man03,
  Man04,
  Woman00,
  Woman01,
  Woman02,
  Blossom05,
  Bouquet03,
  FlowerField01,
  FlowerField05,
  FlowerGrass00,
  FlowerGrass01,
  FlowerGrass02,
  FlowerGrass03,
  FlowerGrass04,
  FlowerGrass05,
  FlowerPatch00,
  FlowerPatch01,
  FlowerPatch02,
  GiantMushroom00,
  HollowLog01,
  Hosta02,
  LilyPad04,
  Lupin07,
  Plant05,
  Rock00,
  StoneSlab00,
  Stump00,
  Toadstool01,
  WaterLily00,
  Well00,
  PatrolBehavior,
  FleeBehavior,
  FootstepDust,
  setAssetsBase,
  applyDebugFlag,
} from '../index.js';

// Debug visualisation (outlines + collision/trigger zones) when the URL has
// ?debug=1. Applied before rendering so the debug pass sees the flag.
applyDebugFlag();

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
  [500, 480, Fountain00],   // a second one, in open grass: the effect travels with the element
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

// A garden cut entirely out of the `flowers-00` sheet: ground cover laid flat
// under everything (manualZ), solid props to bump into, and decor to walk
// behind. Reach it by walking one area east and two areas south.
populate(1, 2, [
  // A flowering lawn: ground tiles, walked over rather than around.
  [96, 96, FlowerGrass00], [128, 96, FlowerGrass01], [160, 96, FlowerGrass02],
  [96, 128, FlowerGrass03], [128, 128, FlowerGrass04], [160, 128, FlowerGrass05],
  [96, 160, FlowerPatch00], [128, 160, FlowerPatch01], [160, 160, FlowerPatch02],
  [230, 120, StoneSlab00],
  // Solid props — the only blocking elements of the sheet.
  [250, 210, Well00],
  [330, 130, Stump00],
  [400, 200, HollowLog01],
  [310, 270, Rock00],
  // Flower masses (64x64) and scattered decor.
  [480, 110, FlowerField01],
  [610, 170, FlowerField05],
  [700, 300, Bouquet03],
  [180, 300, Lupin07],
  [250, 340, Hosta02],
  [380, 340, GiantMushroom00],
  [440, 390, Toadstool01],
  [520, 330, WaterLily00],
  [570, 370, LilyPad04],
  [650, 430, Blossom05],
  [90, 410, Plant05],
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

// 8 moving NPCs — one per built-in base from the shared character sheet.
spawnNpc(Man00,   340, 170, { axis: 'horizontal', distance: 200, speed: 3 });
spawnNpc(Man01,   380, 90,  { axis: 'horizontal', distance: 220, speed: 4 });
spawnNpc(Man02,   120, 300, { axis: 'vertical',   distance: 160, speed: 2 });
spawnNpc(Man03,   610, 470, { axis: 'horizontal', distance: 200, speed: 3 });
spawnNpc(Man04,   850, 360, { axis: 'vertical',   distance: 130, speed: 3 });
spawnNpc(Woman00, 410, 300, { axis: 'vertical',   distance: 130, speed: 3 });
spawnNpc(Woman01, 790, 110, { axis: 'vertical',   distance: 220, speed: 2 });
spawnNpc(Woman02, 330, 400, { axis: 'horizontal', distance: 170, speed: 4 });

// 2 immobile NPCs.
spawnNpc(Woman02, 280, 160);
spawnNpc(Man02,   440, 230);

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

// A free-roaming NPC — no fixed route: its CharacterBehavior picks a random
// direction every few seconds and turns away whenever it bumps into scenery or
// another character. Added to the area first, since `live()` reaches the game
// loop through the application the area wires up.
const wanderer = new Woman00();
originArea.addElement(180, 60, wanderer);
wanderer.live(3000);

// The player. Placed at the viewport centre; the camera keeps it centred.
viewport.enableMainCharacter(VIEW_W / 2, VIEW_H / 2);

viewport.render();
viewport.run();
viewport.renderDebug(); // draws zone boxes only when ?debug=1
patrols.forEach(patrol => patrol.start());

// ── Particles ────────────────────────────────────────────────────────────────
// A canvas over the board, then two named effects registered as behaviors: they
// ride the single game clock, so they freeze and resume with everything else.
const fx = viewport.enableParticles();

// Nothing to place: `Fountain00` declares its own jet, so every fountain in the
// world sprays from its own basin — `enableParticles()` wired them above.

// Follows a moving element instead: dust tracks the player while the camera
// scrolls, and only while they actually walk.
viewport.addBehavior(new FootstepDust(fx, {
  follow: viewport.getCharacter(),
  offset: { x: 24, y: 44 },
  isMoving: () => viewport.getInput().isMoving(),
}));

// ── Touch D-pad ──────────────────────────────────────────────────────────────
// Dispatch synthetic keyboard events so the viewport's existing keydown/keyup
// handlers pick them up without touching the engine internals.
document.querySelectorAll('.dpad-btn').forEach(btn => {
  const key = btn.dataset.key;

  const press = (e) => {
    e.preventDefault();
    btn.classList.add('pressed');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  };

  const release = () => {
    btn.classList.remove('pressed');
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  };

  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('pointerleave', release);
});
