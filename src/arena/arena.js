/**
 * Arena — a portrait lane defence, built on the RPG engine.
 *
 * The engine's fourth host, and the first that is a **game**: the other three
 * demonstrate it. Nothing here reaches into the engine's internals — the only
 * import is its public barrel, which is what makes the boundary a proof rather
 * than a claim.
 *
 * Deliberately, the game's own state (hit points, costs, scores) is **local to
 * this file**: no `blueprint`, no `data`, no engine event. Replacing that
 * bookkeeping with the engine's contract is the next ticket, and the friction of
 * doing so is the measurement.
 */
import {
  Application,
  Element,
  Man01,
  Man02,
  Man03,
  Sunflower00,
  Toadstool01,
  SpritePainter,
  FootstepDust,
  setAssetsBase,
  applyDebugFlag,
} from '../engine/index.js';

applyDebugFlag();
setAssetsBase('/engine/images');

// ── The field ────────────────────────────────────────────────────────────────
// Vertical lanes: in portrait the screen gives HEIGHT, and a defence needs
// DEPTH — the time an attacker takes to cross is the game. Lanes running down
// also mean the axis of progress is the axis of depth, so the painter's
// algorithm sorts attackers in front of the plants they walk past for free.
const CELL = 32;
const COLUMNS = 4;
const ROWS = 10;
const WORLD_W = COLUMNS * CELL;
const WORLD_H = ROWS * CELL;

/** The line they must not cross, in world coordinates. */
const BREACH_Y = WORLD_H;

// Scale the board up: 32 px sprites are unplayable at 1:1 on a phone. The
// viewport is sized in CSS pixels, the transform does the zoom.
//
// Fitting on **both** axes matters more than it sounds: sized on width alone,
// the board grew taller than the window and pushed its own HUD and pad off the
// screen — on a phone, where neither can be scrolled to.
const CHROME = 260;   // HUD, pad and hint, in CSS pixels
const available = {
  width: Math.min(window.innerWidth - 16, 460),
  height: window.innerHeight - CHROME,
};
const scale = Math.max(1.4, Math.min(3.4,
  available.width / WORLD_W,
  available.height / WORLD_H,
));
document.documentElement.style.setProperty('--arena-width', `${Math.round(WORLD_W * scale)}px`);

const app = new Application('#viewport', WORLD_W * scale, WORLD_H * scale);
const viewport = app.getViewport();
const board = viewport.getBoard();
const clock = app.getClock();
const scheduler = app.getScheduler();

board.initialize();
viewport.getTransform().scale(scale);

// ── Layers ───────────────────────────────────────────────────────────────────
// What each thing IS, and what it may touch. This is what replaces naming
// individuals: attackers walk through each other and through the hero (contact
// is damage, not a wall), everything is stopped by the edges, and a pea ignores
// the plant that fired it without anyone being excluded by name.
const WALL = 'wall';
const ENEMY = 'enemy';
const TOWER = 'tower';
const PLAYER = 'player';

// ── State, deliberately local to the host ────────────────────────────────────
const COST = { seeder: 25, shooter: 50 };
const SEED_START = 50;
const SEED_INTERVAL = 5000;
const SEED_YIELD = 25;
const SHOOTER_INTERVAL = 1400;
const PEA_SPEED = 90;
const PEA_DAMAGE = 1;
const CHEW_INTERVAL = 900;

const game = {
  running: false,
  seeds: SEED_START,
  score: 0,
  wave: 1,
  towers: new Map(),      // element → { kind, hp, tasks: [] }
  attackers: new Map(),   // element → { hp, speed, chewing, elapsed }
  edges: [],
  waveTask: null,
  spawnTask: null,
};

const dom = {
  seeds: document.querySelector('#seeds'),
  wave: document.querySelector('#wave'),
  score: document.querySelector('#score'),
  overlay: document.querySelector('#overlay'),
  overlayTitle: document.querySelector('#overlay-title'),
  overlayText: document.querySelector('#overlay-text'),
  restart: document.querySelector('#restart'),
  seeder: document.querySelector('#plant-seeder'),
  shooter: document.querySelector('#plant-shooter'),
};

function refreshHud() {
  dom.seeds.textContent = `🌱 ${game.seeds}`;
  dom.wave.textContent = `Wave ${game.wave}`;
  dom.score.textContent = String(game.score);
  dom.seeder.disabled = game.seeds < COST.seeder;
  dom.shooter.disabled = game.seeds < COST.shooter;
}

// ── Surfaces and the hero ────────────────────────────────────────────────────
// The FX canvas first: everything temporary is painted there, peas included.
viewport.enableParticles();
const sprites = viewport.getParticles().addPainter(new SpritePainter());

buildEdges();
viewport.enableMainCharacter(CELL, WORLD_H - CELL * 2);
const hero = viewport.getCharacter();
hero.moveSpeed(110);

// One fixed screen: the camera is parked instead of following the hero — a lane
// defence has nothing to scroll to. It must be parked **after**
// `enableMainCharacter`, which makes the camera follow the player it creates.
//
// And parking it is not only a taste here: the camera centres its target using
// the viewport's size in **CSS pixels** while the world is drawn through a
// ×2.7 transform, so a zoomed host gets a centring that is off by the zoom
// factor — the hero landed at the very bottom edge, out of sight until it
// moved. Noted as a gap; parking the camera side-steps it entirely.
// `moveTo` alone is not enough: it moves the camera but does not stop it
// following, so the target overwrites the position on the very next frame.
// Letting go of the target has no name of its own — it is `follow(null)`.
viewport.getCamera().follow(null).moveTo(0, 0);
// Only the edges stop the hero: attackers and plants are walked over, and that
// is a mask, not a special case in the movement code.
hero.getCollisionZones('collision').forEach(zone => {
  zone.layer(PLAYER);
  zone.mask([WALL]);
});
viewport.addBehavior(new FootstepDust(viewport.getGroundParticles(), {
  follow: hero,
  offset: { x: 16, y: 30 },
}));

// ── Building the field ───────────────────────────────────────────────────────

/**
 * A solid, invisible edge. The hero is stopped by these and by nothing else —
 * not by plants, not by attackers — which is a **mask**, not a special case in
 * the movement code.
 * @param {number} x world
 * @param {number} y world
 * @param {number} width
 * @param {number} height
 */
function addEdge(x, y, width, height) {
  const edge = new Element(0, 0, width, height);
  edge.createCollisionZone(0, 0, width, height, 'collision', { layer: WALL });
  board.spawn(edge, x, y);
  game.edges.push(edge);
}

/** Left, right and bottom: nothing walks off the field. */
function buildEdges() {
  addEdge(-CELL, -CELL * 3, CELL, WORLD_H + CELL * 4);        // left
  addEdge(WORLD_W, -CELL * 3, CELL, WORLD_H + CELL * 4);      // right
  addEdge(-CELL, WORLD_H - 4, WORLD_W + CELL * 2, CELL);      // bottom
}

/** @returns {number} the column (0…COLUMNS-1) a world x falls in */
function columnAt(x) {
  return Math.max(0, Math.min(COLUMNS - 1, Math.floor(x / CELL)));
}

/** @returns {number} the row a world y falls in */
function rowAt(y) {
  return Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL)));
}

/** @returns {?{x: number, y: number}} the free cell the hero stands on */
function cellUnderHero() {
  const column = columnAt(hero.x() + 16);
  const row = rowAt(hero.y() + 24);
  const x = column * CELL;
  const y = row * CELL;
  const taken = [...game.towers.keys()].some(
    tower => columnAt(tower.x() + 16) === column && rowAt(tower.y() + 16) === row,
  );

  return taken ? null : { x, y };
}

// ── Towers ───────────────────────────────────────────────────────────────────

const TOWER_KINDS = {
  seeder: { Class: Sunflower00, hp: 4 },
  shooter: { Class: Toadstool01, hp: 3 },
};

function plant(kind) {
  if (!game.running || game.seeds < COST[kind]) {
    return;
  }
  const cell = cellUnderHero();
  if (!cell) {
    return;
  }
  game.seeds -= COST[kind];

  const { Class, hp } = TOWER_KINDS[kind];
  const tower = board.spawn(new Class(), cell.x, cell.y);
  tower.getCollisionZones('collision').forEach(zone => zone.layer(TOWER));
  const record = { kind, hp, tasks: [] };
  game.towers.set(tower, record);

  // `every` on the game clock: a pause freezes production and fire alike, and
  // `{ owner }` means a destroyed plant takes its schedule with it.
  if (kind === 'seeder') {
    record.tasks.push(scheduler.every(SEED_INTERVAL, () => {
      game.seeds += SEED_YIELD;
      pop(tower.x() + 16, tower.y() + 8, '#ffd166');
      refreshHud();
    }, { owner: tower }));
  } else {
    record.tasks.push(scheduler.every(SHOOTER_INTERVAL, () => fire(tower), { owner: tower }));
  }
  refreshHud();
}

function destroyTower(tower) {
  const record = game.towers.get(tower);
  record?.tasks.forEach(task => task.cancel());
  game.towers.delete(tower);
  board.despawn(tower);
}

// ── Peas ─────────────────────────────────────────────────────────────────────
// Temporary by design, so they are painted on the canvas and never enter the
// scene graph — the engine's routing rule. Detection does not care: `sweep()`
// speaks in world rectangles, not in elements.

const PEA_SIZE = { width: 6, height: 6 };

function fire(tower) {
  const from = { x: tower.x() + 16, y: tower.y() + 10 };
  const pea = sprites.add({ ...from, width: 6, height: 6, color: '#c9f27b', shape: 'circle' });
  const travel = from.y + CELL;   // it flies up out of the field
  const flight = scheduler.tween(travel / PEA_SPEED * 1000, progress => {
    const y = from.y - progress * travel;
    const corner = { x: pea.x - 3, y: pea.y - 3 };
    const hit = board.sweep(corner, { x: corner.x, y: y - 3 }, PEA_SIZE, { mask: [ENEMY] });
    if (hit) {
      flight.cancel();
      sprites.remove(pea);
      damage(hit.element, PEA_DAMAGE, hit.at);

      return;
    }
    pea.y = y;
    if (progress >= 1) {
      sprites.remove(pea);
    }
  });
}

/** A short bloom on the canvas — an impact, a harvest. */
function pop(x, y, color, size = 10) {
  const blast = sprites.add({ x, y, width: 4, height: 4, color, shape: 'circle' });
  scheduler.tween(240, progress => {
    blast.width = 4 + progress * size;
    blast.height = blast.width;
    blast.alpha = 1 - progress;
    if (progress >= 1) {
      sprites.remove(blast);
    }
  });
}

// ── Attackers ────────────────────────────────────────────────────────────────

const ATTACKER_KINDS = [
  { Class: Man01, hp: 2, speed: 14 },
  { Class: Man02, hp: 4, speed: 10 },
  { Class: Man03, hp: 3, speed: 20 },
];

function spawnAttacker() {
  const kind = ATTACKER_KINDS[Math.min(
    ATTACKER_KINDS.length - 1,
    Math.floor(Math.random() * Math.min(game.wave, ATTACKER_KINDS.length)),
  )];
  const column = Math.floor(Math.random() * COLUMNS);
  const attacker = board.spawn(new kind.Class(), column * CELL, -CELL);
  attacker.setDirection('down');
  // Labelled, not masked: a lane walker's movement is **scripted** (it advances
  // down its column by assignment), so it never asks the collision system
  // anything. The layer is what lets peas and the tower query find it.
  attacker.getCollisionZones('collision').forEach(zone => zone.layer(ENEMY));
  // `y` is kept here as a FLOAT. Writing a position rounds it to the pixel
  // (`Coordinates`), so an attacker crossing at 14 px/s would advance 0,23 px a
  // frame, round back to where it was, and stand still for ever. The viewport
  // banks that remainder for the player; nothing offers it to anyone else, so
  // the host banks its own. Noted as a gap.
  game.attackers.set(attacker, { hp: kind.hp, speed: kind.speed, chewed: 0, y: -CELL });
}

function damage(attacker, amount, at) {
  const record = game.attackers.get(attacker);
  if (!record) {
    return;
  }
  record.hp -= amount;
  pop(at?.x ?? attacker.x() + 16, at?.y ?? attacker.y() + 16, '#c9f27b', 8);

  if (record.hp <= 0) {
    game.attackers.delete(attacker);
    pop(attacker.x() + 16, attacker.y() + 20, '#ff8b6b', 22);
    board.despawn(attacker);
    game.score += 10;
    refreshHud();
  }
}

/** The tower standing in the cell an attacker is about to enter, if any. */
function towerAhead(attacker) {
  const [found] = board.query({
    x0: attacker.x() + 8,
    y0: attacker.y() + 26,
    x1: attacker.x() + 24,
    y1: attacker.y() + 34,
  }, { mask: [TOWER] });

  return found ?? null;
}

// One behavior for the whole wave rather than one per attacker: they all do the
// same thing, and the loop already ticks this once a frame.
viewport.addBehavior({
  update(dt) {
    if (!game.running || dt <= 0) {
      return;
    }
    for (const [attacker, record] of game.attackers) {
      const blocker = towerAhead(attacker);

      if (blocker) {
        record.chewed += dt;
        if (record.chewed >= CHEW_INTERVAL) {
          record.chewed = 0;
          const tower = game.towers.get(blocker);
          if (tower && --tower.hp <= 0) {
            pop(blocker.x() + 16, blocker.y() + 16, '#8b6b4a', 18);
            destroyTower(blocker);
          }
        }
        continue;
      }

      const step = record.speed * dt / 1000;
      record.y += step;
      attacker.y(record.y);    // rounded on the way in — the bank is above
      attacker.update(step);   // feeds the walk animation, which runs on distance

      if (record.y + CELL >= BREACH_Y) {
        lose();

        return;
      }
    }
  },
});

// ── Waves ────────────────────────────────────────────────────────────────────

function startWaves() {
  game.spawnTask = scheduler.every(3200, () => spawnAttacker());
  game.waveTask = scheduler.every(20000, () => {
    game.wave += 1;
    game.spawnTask.cancel();
    game.spawnTask = scheduler.every(Math.max(900, 3200 - game.wave * 320), () => spawnAttacker());
    refreshHud();
  });
}

// ── Losing, and starting over ────────────────────────────────────────────────

function lose() {
  game.running = false;
  clock.pause();
  dom.overlayTitle.textContent = 'Breached';
  dom.overlayText.textContent = `They got through on wave ${game.wave}. Score ${game.score}.`;
  dom.overlay.hidden = false;
}

function reset() {
  [...game.attackers.keys()].forEach(attacker => board.despawn(attacker));
  [...game.towers.keys()].forEach(tower => destroyTower(tower));
  game.attackers.clear();
  game.spawnTask?.cancel();
  game.waveTask?.cancel();
  sprites.clear();

  game.seeds = SEED_START;
  game.score = 0;
  game.wave = 1;
  game.running = true;

  hero.x(CELL);
  hero.y(WORLD_H - CELL * 2);
  dom.overlay.hidden = true;
  refreshHud();
  startWaves();
  clock.resume();
}

// ── Input ────────────────────────────────────────────────────────────────────

document.body.addEventListener('keydown', event => {
  if (event.repeat) {
    return;
  }
  if (event.code === 'KeyA') {
    plant('seeder');
  }
  if (event.code === 'KeyE') {
    plant('shooter');
  }
  if (event.code === 'KeyP') {
    if (clock.isPaused()) {
      clock.resume();
    }
    else {
      clock.pause();
    }
  }
});

// The pad dispatches synthetic keyboard events, so the viewport's own handlers
// pick them up without the host reaching into the engine.
document.querySelectorAll('.arena-dpad__btn').forEach(button => {
  const key = button.dataset.key;
  const press = event => {
    event.preventDefault();
    button.classList.add('pressed');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  };
  const release = () => {
    button.classList.remove('pressed');
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointerleave', release);
  button.addEventListener('pointercancel', release);
});

dom.seeder.addEventListener('click', () => plant('seeder'));
dom.shooter.addEventListener('click', () => plant('shooter'));
dom.restart.addEventListener('click', () => reset());

// ── Go ───────────────────────────────────────────────────────────────────────

viewport.render();
viewport.run();
viewport.renderDebug();
reset();
