/**
 * Arena — a last stand, built on the RPG engine.
 *
 * The engine's fourth host, and the first that is a **game**: the other three
 * demonstrate it. Nothing here reaches into the engine's internals — the only
 * import is its public barrel, which is what makes the boundary a proof rather
 * than a claim.
 *
 * One hero, planted at the bottom of the field. **The pad does not move him: it
 * aims.** He fires on his own, at the nearest target *inside the arc he faces*,
 * so turning your back on a flank is letting it through. That single decision —
 * which threat to cover, and which to accept — is the whole game.
 *
 * Deliberately, the game's own state (hit points, damage, score) is **local to
 * this file**: no `blueprint`, no `data`, no engine event. Replacing that
 * bookkeeping with the engine's contract is the next ticket, and the friction of
 * doing so is the measurement.
 */
import {
  Application,
  Man01,
  Man02,
  Man03,
  SpritePainter,
  setAssetsBase,
  applyDebugFlag,
} from '../engine/index.js';

applyDebugFlag();
setAssetsBase('/engine/images');

// ── The field ────────────────────────────────────────────────────────────────
// Portrait, one screen, no scrolling: the hero stands at the bottom and they
// come down at him. Depth is what gives him time to fire, which is why the field
// is tall — and since progress is downwards, the painter's algorithm sorts the
// wave for free.
const WORLD_W = 208;
const WORLD_H = 288;
const HERO = { x: Math.round(WORLD_W / 2 - 24), y: WORLD_H - 72 };

// They **descend before they close in**, and that is the difference between a
// game and a demo. Converging from birth put every approach inside a 34° pencil
// — measured — so a hero facing north covered the whole field and took no damage
// in forty seconds. Falling straight down first means the one born on the far
// left arrives from due **west**: an angle the north-facing cone cannot hold.
const ENGAGE_OFFSET = 40;

// Fitting on **both** axes matters more than it sounds: sized on width alone,
// the board grew taller than the window and pushed its own HUD off the screen —
// on a phone, where you cannot scroll to find it.
const CHROME = 250;
const scale = Math.max(1.4, Math.min(3.6,
  Math.min(window.innerWidth - 16, 460) / WORLD_W,
  (window.innerHeight - CHROME) / WORLD_H,
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
// What each thing IS. Attackers are *labelled* rather than masked: their walk is
// scripted (they steer at the hero by assignment), so they never ask the
// collision system anything. The layer is what lets shots and queries find them.
const ENEMY = 'enemy';
const HERO_LAYER = 'hero';

// ── Tuning ───────────────────────────────────────────────────────────────────
// The one number that decides whether this is a game: the arc must NOT let the
// hero cover everything.
//
// 90° was the first guess and it failed, arithmetically. A body falling down the
// outermost column enters **range** while it is still only 38° off his axis —
// inside a 90° cone — so facing north covered the whole field and survived
// thirteen waves without a scratch. At 60° the same body is out of the cone for
// as long as it is in range: the flanks are genuinely unreachable, and buying
// «Arc» buys something real.
const ARC = Math.PI / 3;
// Short on purpose. At 150 he reached the outer columns **while they were still
// falling**, when they are almost due north of him and therefore inside any
// north-facing cone — measured: sixty seconds, zero damage. At 100 the far
// column only comes into range once it is 46° off his axis, i.e. outside it.
const RANGE_BASE = 116;
const FIRE_INTERVAL_BASE = 450;
const SHOT_SPEED = 220;
const SHOT_SIZE = { width: 6, height: 6 };
const HERO_HP = 10;
const CONTACT_RADIUS = 22;
const CONTACT_INTERVAL = 850;   // how often a body in contact hurts

const ATTACKERS = [
  { Class: Man01, hp: 2, speed: 15, bounty: 5 },
  { Class: Man02, hp: 5, speed: 10, bounty: 12 },
  { Class: Man03, hp: 3, speed: 24, bounty: 8 },
];

const UPGRADES = [
  { icon: '⚡', label: 'Fire rate', cost: 40, apply: () => { stats.fireInterval *= 0.82; } },
  { icon: '🗡️', label: 'Damage', cost: 55, apply: () => { stats.damage += 1; } },
  // Capped at 120°, and the cap is the point: uncapped, four purchases took the
  // cone past 180° and the hero covered the field again — the one property this
  // game is built on, sold back for gold.
  { icon: '📐', label: 'Arc', cost: 45, apply: () => { stats.arc = Math.min(Math.PI * 2 / 3, stats.arc * 1.18); } },
  { icon: '🎯', label: 'Range', cost: 35, apply: () => { stats.range *= 1.15; } },
  { icon: '❤️', label: 'Repair', cost: 30, apply: () => { stats.hp = Math.min(stats.maxHp, stats.hp + 4); } },
];

// ── State, deliberately local to the host ────────────────────────────────────
const stats = {};
const game = {
  running: false,
  wave: 0,
  gold: 0,
  score: 0,
  attackers: new Map(),   // element → { hp, speed, bounty, x, y, contact }
  spawnTask: null,
  fireTask: null,
  remaining: 0,
};

/** Where the hero looks, as a unit vector. Remembered: releasing keeps the aim. */
const aim = { x: 0, y: -1 };

const dom = {
  hp: document.querySelector('#hp'),
  wave: document.querySelector('#wave'),
  score: document.querySelector('#score'),
  gold: document.querySelector('#gold'),
  overlay: document.querySelector('#overlay'),
  overlayTitle: document.querySelector('#overlay-title'),
  overlayText: document.querySelector('#overlay-text'),
  shop: document.querySelector('#shop'),
  action: document.querySelector('#overlay-action'),
};

// ── Surfaces and the hero ────────────────────────────────────────────────────
viewport.enableParticles();
const sprites = viewport.getParticles().addPainter(new SpritePainter());

viewport.enableMainCharacter(HERO.x, HERO.y);
const hero = viewport.getCharacter();
hero.getCollisionZones('collision').forEach(zone => zone.layer(HERO_LAYER));

// **He must not walk.** The viewport moves the player character whenever a
// direction is held — that coupling is built into the loop, and reading the
// vector as an aim does not undo it: the hero strolled off the top of the map
// with the wave in tow, which is how this was found. Zero speed is the only
// lever a host has, and it works because the loop spends `dt × moveSpeed`.
// Filed as a gap: an input with no walking attached has no name.
hero.moveSpeed(0);

// The camera is parked rather than following: a last stand has nothing to scroll
// to. `follow(null)` comes first — `moveTo` alone does not let go of the target,
// so the position would be overwritten on the very next frame.
viewport.getCamera().follow(null).moveTo(0, 0);

/** @returns {{x: number, y: number}} the hero's centre, in world coordinates */
function heroCentre() {
  return { x: hero.x() + 24, y: hero.y() + 30 };
}

// ── Aiming ───────────────────────────────────────────────────────────────────
// `DirectionalInput` already turns held keys into a **unit** vector, diagonals
// included. Read as an aim rather than as a walk, it is the whole control
// scheme — and it is remembered, so letting go keeps the heading.
//
// The sprite has only four faces (`up`/`down`/`left`/`right`), so the arc is
// continuous while the drawing snaps to the nearest of the four: aiming
// up-and-left shows a hero in profile. Accepted; an eight-faced sheet does not
// exist, and inventing one is not this ticket.
viewport.addBehavior({
  update() {
    const vector = viewport.getInput().getVector();
    if (vector.x === 0 && vector.y === 0) {
      return;
    }
    aim.x = vector.x;
    aim.y = vector.y;
    hero.setDirection(Math.abs(vector.x) > Math.abs(vector.y)
      ? (vector.x > 0 ? 'right' : 'left')
      : (vector.y > 0 ? 'down' : 'up'));
    hero.getRenderer().update();
  },
});

/**
 * The nearest attacker inside the aimed cone.
 *
 * The world is asked by **rectangle** — that is what the engine prunes on — and
 * the cone is applied here, by angle. Asking the engine for a conical query
 * would be a feature nobody has measured a need for.
 * @returns {?{element: Object, at: {x: number, y: number}}}
 */
function targetInArc() {
  const from = heroCentre();
  const reach = stats.range;
  const candidates = board.query({
    x0: from.x - reach, y0: from.y - reach,
    x1: from.x + reach, y1: from.y + reach,
  }, { mask: [ENEMY] });

  const cosineLimit = Math.cos(stats.arc / 2);
  let best = null;
  let bestDistance = Infinity;

  for (const element of candidates) {
    const record = game.attackers.get(element);
    if (!record) {
      continue;
    }
    const at = { x: record.x + 24, y: record.y + 30 };
    const dx = at.x - from.x;
    const dy = at.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance > reach || distance === 0) {
      continue;
    }
    // Inside the cone: the angle between the aim and the target, read off the
    // dot product of two unit vectors.
    if ((dx / distance) * aim.x + (dy / distance) * aim.y < cosineLimit) {
      continue;
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { element, at };
    }
  }

  return best;
}

// ── Shots ────────────────────────────────────────────────────────────────────
// Temporary by design, so they are painted on the canvas and never enter the
// scene graph — the engine's routing rule. Detection does not care: `sweep()`
// speaks in world rectangles, not in elements.

function fire() {
  const target = targetInArc();
  if (!target) {
    return;
  }
  const from = heroCentre();
  const dx = target.at.x - from.x;
  const dy = target.at.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const step = { x: dx / distance, y: dy / distance };

  const shot = sprites.add({ ...from, width: 6, height: 6, color: '#ffe08a', shape: 'circle' });
  // A little past the aim point, so a body that kept walking is still met.
  const flightTime = (distance + 40) / SHOT_SPEED * 1000;
  const travel = distance + 40;

  const flight = scheduler.tween(flightTime, progress => {
    const to = {
      x: from.x + step.x * travel * progress,
      y: from.y + step.y * travel * progress,
    };
    const hit = board.sweep(
      { x: shot.x - 3, y: shot.y - 3 },
      { x: to.x - 3, y: to.y - 3 },
      SHOT_SIZE,
      { mask: [ENEMY] },
    );

    if (hit) {
      flight.cancel();
      sprites.remove(shot);
      damage(hit.element, stats.damage, { x: hit.at.x + 3, y: hit.at.y + 3 });

      return;
    }
    shot.x = to.x;
    shot.y = to.y;
    if (progress >= 1) {
      sprites.remove(shot);
    }
  });
}

/** A short bloom on the canvas — an impact, a death, a wound. */
function pop(x, y, color, size = 12) {
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

// ── The wave ─────────────────────────────────────────────────────────────────

function spawnAttacker() {
  const tier = Math.min(ATTACKERS.length, 1 + Math.floor(game.wave / 2));
  const kind = ATTACKERS[Math.floor(Math.random() * tier)];
  const x = 8 + Math.random() * (WORLD_W - 64);
  const attacker = board.spawn(new kind.Class(), Math.round(x), -48);
  attacker.setDirection('down');
  attacker.getCollisionZones('collision').forEach(zone => zone.layer(ENEMY));

  // `x`/`y` are kept here as FLOATS. Writing a position rounds it to the pixel
  // (`Coordinates`), so a body closing in at 15 px/s would advance 0,25 px a
  // frame, round back to where it was, and stand still for ever. The viewport
  // banks that remainder for the player; nothing offers it to anyone else, so
  // the host banks its own. Filed as a gap.
  game.attackers.set(attacker, {
    hp: kind.hp, speed: kind.speed, bounty: kind.bounty,
    x, y: -48, contact: 0,
  });
}

function damage(attacker, amount, at) {
  const record = game.attackers.get(attacker);
  if (!record) {
    return;
  }
  record.hp -= amount;
  pop(at.x, at.y, '#ffe08a', 8);

  if (record.hp > 0) {
    return;
  }
  game.attackers.delete(attacker);
  pop(record.x + 24, record.y + 32, '#ff8b6b', 24);
  board.despawn(attacker);
  game.gold += record.bounty;
  game.score += record.bounty;
  refreshHud();

  if (game.remaining === 0 && game.attackers.size === 0) {
    endWave();
  }
}

function hurtHero(amount) {
  stats.hp -= amount;
  const centre = heroCentre();
  pop(centre.x, centre.y, '#ff5f5f', 20);
  refreshHud();
  if (stats.hp <= 0) {
    lose();
  }
}

// One behavior for the whole wave rather than one per attacker: they all do the
// same thing, and the loop already ticks this once a frame.
viewport.addBehavior({
  update(dt) {
    if (!game.running || dt <= 0) {
      return;
    }
    const centre = heroCentre();

    for (const [attacker, record] of game.attackers) {
      const dx = centre.x - (record.x + 24);
      const dy = centre.y - (record.y + 30);
      const distance = Math.hypot(dx, dy) || 1;

      if (distance < CONTACT_RADIUS) {
        record.contact += dt;
        if (record.contact >= CONTACT_INTERVAL) {
          record.contact = 0;
          hurtHero(1);
          if (!game.running) {
            return;
          }
        }
        continue;
      }

      const step = record.speed * dt / 1000;
      if (record.y + 30 < centre.y - ENGAGE_OFFSET) {
        record.y += step;                       // falling down its own column
      } else {
        record.x += dx / distance * step;       // closing in, from wherever it is
        record.y += dy / distance * step;
      }
      attacker.x(record.x);   // rounded on the way in — the bank is above
      attacker.y(record.y);
      attacker.update(step);  // feeds the walk animation, which runs on distance
    }
  },
});

// ── Waves, and the shop between them ─────────────────────────────────────────

function startWave() {
  game.wave += 1;
  game.remaining = 3 + game.wave * 2;
  game.running = true;
  dom.overlay.hidden = true;
  refreshHud();
  clock.resume();

  // Density is the other half of «you cannot cover everything»: a thin trickle
  // is dealt with one body at a time, whatever the geometry says.
  const interval = Math.max(260, 1150 - game.wave * 75);
  game.spawnTask = scheduler.every(interval, () => {
    if (game.remaining <= 0) {
      game.spawnTask.cancel();

      return;
    }
    game.remaining -= 1;
    spawnAttacker();
  });
  game.fireTask = scheduler.every(stats.fireInterval, () => fire());
}

function endWave() {
  game.running = false;
  game.spawnTask?.cancel();
  game.fireTask?.cancel();
  clock.pause();

  dom.overlayTitle.textContent = `Wave ${game.wave} held`;
  dom.overlayText.textContent = `${game.gold} gold to spend.`;
  dom.action.textContent = `Start wave ${game.wave + 1}`;
  dom.shop.hidden = false;
  renderShop();
  dom.overlay.hidden = false;
}

function renderShop() {
  dom.shop.replaceChildren(...UPGRADES.map(upgrade => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'arena-upgrade';
    button.disabled = game.gold < upgrade.cost;

    const icon = document.createElement('span');
    icon.className = 'arena-upgrade__icon';
    icon.textContent = upgrade.icon;
    const label = document.createElement('span');
    label.className = 'arena-upgrade__label';
    label.textContent = upgrade.label;
    const cost = document.createElement('span');
    cost.className = 'arena-upgrade__cost';
    cost.textContent = String(upgrade.cost);
    button.append(icon, label, cost);

    button.addEventListener('click', () => {
      if (game.gold < upgrade.cost) {
        return;
      }
      game.gold -= upgrade.cost;
      upgrade.apply();
      dom.overlayText.textContent = `${game.gold} gold to spend.`;
      refreshHud();
      renderShop();
    });

    return button;
  }));
}

function lose() {
  game.running = false;
  game.spawnTask?.cancel();
  game.fireTask?.cancel();
  clock.pause();

  dom.overlayTitle.textContent = 'Overrun';
  dom.overlayText.textContent = `They got you on wave ${game.wave}. Score ${game.score}.`;
  dom.action.textContent = 'Play again';
  dom.shop.hidden = true;
  dom.overlay.hidden = false;
}

// ── HUD ──────────────────────────────────────────────────────────────────────

function refreshHud() {
  const hearts = Math.max(0, Math.ceil(stats.hp / 2));
  dom.hp.textContent = hearts ? '❤️'.repeat(hearts) : '💀';
  dom.wave.textContent = `Wave ${game.wave}`;
  dom.score.textContent = String(game.score);
  dom.gold.textContent = `🪙 ${game.gold}`;
}

// ── Starting over ────────────────────────────────────────────────────────────

function reset() {
  [...game.attackers.keys()].forEach(attacker => board.despawn(attacker));
  game.attackers.clear();
  game.spawnTask?.cancel();
  game.fireTask?.cancel();
  sprites.clear();

  Object.assign(stats, {
    hp: HERO_HP, maxHp: HERO_HP, damage: 1,
    arc: ARC, range: RANGE_BASE, fireInterval: FIRE_INTERVAL_BASE,
  });
  game.wave = 0;
  game.gold = 0;
  game.score = 0;
  aim.x = 0;
  aim.y = -1;
  hero.setDirection('up');
  hero.getRenderer().update();

  refreshHud();
  startWave();
}

// ── Input ────────────────────────────────────────────────────────────────────

document.body.addEventListener('keydown', event => {
  if (event.code === 'KeyP' && !event.repeat) {
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

dom.action.addEventListener('click', () => {
  if (stats.hp > 0) {
    startWave();
  }
  else {
    reset();
  }
});

// ── Go ───────────────────────────────────────────────────────────────────────

viewport.render();
viewport.run();
viewport.renderDebug();
reset();
