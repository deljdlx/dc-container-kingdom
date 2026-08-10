import { Board } from '../world/Board.js';
import { Camera } from './Camera.js';
import { Clock } from '../time/Clock.js';
import { Scheduler } from '../time/Scheduler.js';
import { Character } from '../character/Character.js';
import { DirectionalInput } from './DirectionalInput.js';
import { EngineEvents, makeEvent } from '../events/EngineEvents.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { Geometry } from '../scene/Geometry.js';
import { FxBinder } from '../fx/FxBinder.js';
import { ParticleLayer } from '../fx/ParticleLayer.js';
import { ParticleSystem } from '../fx/ParticleSystem.js';
import { FX_DEPTH, GROUND_FX_DEPTH } from '../render/Renderer.js';
import { MainCharacterRenderer } from '../render/MainCharacterRenderer.js';
import { ViewportRenderer } from '../render/ViewportRenderer.js';
import { ViewportTransform } from './ViewportTransform.js';

/**
 * The rendered window onto the world: owns the {@link Board}, the {@link Camera}
 * and (optionally) the player {@link Character}, and drives the single rAF game
 * loop that moves the player, streams areas, ticks NPC behaviors and renders.
 */
export class Viewport
{

  /**
   * @type {import('./Application.js').Application}
   */
  _application;

  /**
   * @type {DirectionalInput} which directions are currently held — the single
   * source of truth for "is the player moving, and where to"
   */
  _input = new DirectionalInput();

  /**
   * @type {Object<string, string>} keyboard keys mapped to directions. Anything
   * absent from this table is not a movement key and is left alone.
   */
  static KEY_DIRECTIONS = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  };

  /**
   * @type {number}
   */
  interval = 4;

  /**
   * Fallback clock, for a viewport built without an application (tests, probes).
   * A viewport that has one reads **its** clock — two worlds must not share a
   * pause.
   * @type {Clock}
   */
  _ownClock = new Clock();

  /**
   * @type {Scheduler} registered as a behavior in the constructor — scheduling
   * only means anything where there is a loop to tick it
   */
  _scheduler = new Scheduler();


  /**
   * @type {Geometry}
   */
  geometry;

  /**
   * @type {Camera}
   */
  _camera;

  /** @type {{x: number, y: number}|null} last area the streaming ran for */
  _lastAreaCoords = null;

  /** @type {Array<{update: (dt: number) => void}>} behaviors ticked each frame */
  _behaviors = [];

  /**
   * @type {number} sub-pixel distance owed to the character along x, carried
   * between frames so walking speed stays independent of the refresh rate
   */
  _moveRemainderX = 0;

  /**
   * @type {number} sub-pixel distance owed along y — banked per axis, which is
   * also what normalises diagonal speed without a second rounding step
   */
  _moveRemainderY = 0;

  loop;

  // pixels per second
  speed = 300;

  /**
   * @type {Board}
   */
  board;

  /**
   * @type {ViewportRenderer}
   */
  renderer;

  /**
   * @type {DomElement}
   */
  container;


  /**
   * @type {Character}
   */
  character;

  /**
   * @type {ParticleLayer|null} optional FX surface over the board
   */
  _particles = null;

  /**
   * @type {ParticleLayer|null} FX surface **under** the entities, inside the board
   */
  _groundParticles = null;

  /**
   * @type {ParticleSystem|null} shared by both surfaces: one global budget
   */
  _fxSystem = null;

  /**
   * @type {FxBinder|null} wires the effects elements declare, once FX are on
   */
  _fxBinder = null;

  /**
   * @type {ViewportTransform} the single owner of world ↔ screen. The camera
   * feeds it; a host driving its own pan/zoom feeds it instead.
   */
  _transform = new ViewportTransform({ pixelRatio: globalThis.devicePixelRatio ?? 1 });

  /**
   * @type {EventEmitter}
   */
  _events = new EventEmitter();


  /**
   * @param {import('./Application.js').Application} application
   * @param {DomElement} container host DOM node the viewport renders into
   * @param {number} [width]
   * @param {number} [height]
   */
  constructor(
    application,
    container,
    width = 500,
    height = 500,
  ) {
    this._application = application;

    this.container = container;
    this.geometry = new Geometry(0, 0);
    this.geometry.x(0);
    this.geometry.y(0);
    this.geometry.width(width);

    this.geometry.height(height);
    this._camera = new Camera(width, height);
    this.renderer = new ViewportRenderer(this);

    this.board = new Board(this);
    this.addBehavior(this._scheduler);
  }

  /** @returns {ViewportTransform} the world ↔ screen relation for this viewport */
  getTransform() {
    return this._transform;
  }

  /**
   * @returns {Camera}
   */
  getCamera() {
    return this._camera;
  }

  /**
   * Register a behavior to be ticked every frame by the game loop. Behaviors
   * (NPC wander, patrol…) run on the single rAF clock with the frame's `dt`
   * instead of their own timers.
   * @param {{update: (dt: number) => void}} behavior
   */
  addBehavior(behavior) {
    if (!this._behaviors.includes(behavior)) {
      this._behaviors.push(behavior);
    }
  }

  /** Stop ticking a behavior. @param {{update: (dt: number) => void}} behavior */
  removeBehavior(behavior) {
    const index = this._behaviors.indexOf(behavior);
    if (index !== -1) {
      this._behaviors.splice(index, 1);
    }
  }

  /**
   * Create the player character, wire its renderer/app, place it (defaults to the
   * viewport centre) and have the camera follow it.
   * @param {number|null} [mainCharacterX] defaults to half the viewport width
   * @param {number|null} [mainCharacterY] defaults to half the viewport height
   */
  enableMainCharacter(mainCharacterX, mainCharacterY) {
    this.character = new Character();
    this.character.setRenderer(new MainCharacterRenderer(this.character));
    if(mainCharacterX == null) {
      mainCharacterX = this.width() / 2;
    }
    if(mainCharacterY == null) {
      mainCharacterY = this.height() / 2;
    }
    this.character.moveSpeed(300);
    this.character.setApplication(this.getApplication());

    // The player joins the world like any other entity: on the board's entity
    // layer, in world coordinates, belonging to no tile.
    //
    // It used to be attached to **nothing** — a detector that no one could
    // detect. The player saw the world; the world did not see the player, so
    // every NPC that had to react to it kept an explicit reference and tested
    // against it by name (`FleeBehavior`, `PatrolBehavior`) — or forgot to, and
    // walked straight through (`CharacterBehavior`). Being in the tree makes the
    // broad phase find it like anything else, which is also what «who hit whom»
    // will need.
    this.getBoard().spawn(this.character, mainCharacterX, mainCharacterY);

    // The camera keeps the player centred.
    this._camera.follow(this.character);
  }

  /**
   * Mount a canvas over the board for particle effects, and return it.
   *
   * The canvas is a **sibling of the board**, raised to {@link FX_DEPTH}: the
   * board is an element like any other and carries its own painter depth, so
   * coming later in DOM order is *not* enough to sit above it. Emitters speak
   * world coordinates; the layer applies the camera itself.
   * @param {Object} [options] forwarded to {@link ParticleLayer}
   * @returns {ParticleLayer}
   */
  enableParticles(options = {}) {
    // Enabling twice replaces the binder; the one being dropped must let go of
    // the bus, or its subscription outlives it — the very leak this bus is
    // built to make impossible.
    this._fxBinder?.dispose();

    // One system, two surfaces: the particle budget stays a single ceiling, and
    // each surface paints only the particles that named it.
    this._fxSystem = options.system ?? new ParticleSystem();

    const canvas = document.createElement('canvas');
    canvas.className = 'map-fx-layer';
    // The board carries its own painter depth, so being a later sibling is not
    // enough to sit above it — see FX_DEPTH.
    canvas.style.zIndex = FX_DEPTH;
    this._particles = new ParticleLayer(canvas, {
      pixelRatio: this._transform.pixelRatio(),
      ...options,
      system: this._fxSystem,
      layer: 'above',
    });
    this._particles.resize(this.width(), this.height());
    this.container.append(canvas);

    // The ground surface lives INSIDE the board: a sibling could only be above
    // the whole map or below its grass (the board is a stacking context).
    const groundCanvas = document.createElement('canvas');
    groundCanvas.className = 'map-fx-layer map-fx-layer--ground';
    groundCanvas.style.zIndex = GROUND_FX_DEPTH;
    this._groundParticles = new ParticleLayer(groundCanvas, {
      pixelRatio: this._transform.pixelRatio(),
      ...options,
      system: this._fxSystem,
      layer: 'ground',
    });
    this.board.getRenderer().getDom().append(groundCanvas);

    // Elements already in the world get their declared effects now; those that
    // stream in later are bound by `_streamAreas`.
    this._fxBinder = new FxBinder({
      layer: this._particles,
      groundLayer: this._groundParticles,
      viewport: this,
    });
    this._fxBinder.bind(this.board);

    return this._particles;
  }

  /** @returns {ParticleLayer|null} the surface painting over the map */
  getParticles() {
    return this._particles;
  }

  /** @returns {ParticleLayer|null} the surface painting on the ground, under the entities */
  getGroundParticles() {
    return this._groundParticles;
  }

  /** @returns {FxBinder|null} the binder wiring element-declared effects */
  getFxBinder() {
    return this._fxBinder;
  }

  /** Clear the viewport renderer and the board. */
  clear() {
    this.renderer.clear();
    this.board.clear();
  }

  // ===========================
  /**
   * Subscribe to a viewport-level event.
   * @param {string} name one of {@link EngineEvents}
   * @param {Function} callback
   * @returns {() => void} unsubscribe
   */
  addEventListener(name, callback) {
    return this._events.on(name, callback);
  }

  /**
   * Stamp the envelope, emit on the viewport bus, then relay to the application
   * bus. Stays silent rather than throwing when no application is wired.
   * @param {string} name one of {@link EngineEvents}
   * @param {Object} [data]
   */
  handle(name, data = {}) {
    const event = makeEvent(name, this, data);
    this._events.emit(name, event);
    this.getApplication()?.handle(name, event);
  }

  // ===========================

  /**
   * @returns {import('./Application.js').Application}
   */
  getApplication() {
    return this._application;
  }

  /**
   * @returns {Character}
   */
  getCharacter(){
    return this.character;
  }

  /**
   * @returns {Board}
   */
  getBoard() {
    return this.board;
  }

  /**
   * @returns {DomElement}
   */
  getContainer() {
    return this.container;
  }

  /**
   * @returns {{x: number, y: number}}
   */
  getCurrentAreaCoordinates() {
    const x = Math.floor(this.character.x() / this.board.width());
    const y = Math.floor((this.character.y() + 48) / this.board.height());
    return {
      x: x,
      y: y
    };
  }

  /**
   * @returns {import('./Area.js').Area}
   */
  getCurrentArea() {
    const at = this.getCurrentAreaCoordinates();
    return this.board.getAreaAt(at.x, at.y)
  }

  /**
   * @returns {Boolean}
   */
  currentAreaExists() {
    const at = this.getCurrentAreaCoordinates();
    return this.board.areaExistsAt(at.x, at.y);
  }

  /**
   * Ensure the (2·radius+1)² window of areas around the character is loaded.
   * @param {number} [radius] 3 → a 7×7 window
   */
  loadAreasFromCurrentPosition(radius = 3) {
    const at = this.getCurrentAreaCoordinates();
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        this.board.loadArea(at.x + dx, at.y + dy);
      }
    }
  }

  /**
   * Free any loaded area farther than `radius` from the character (Chebyshev
   * distance). Keeping it one ring beyond the load window gives hysteresis, so
   * areas aren't thrashed when walking along a boundary.
   * @param {number} [radius] 4 → keep up to 9×9 before freeing
   */
  freeAreasFromCurrentPosition(radius = 4) {
    const at = this.getCurrentAreaCoordinates();
    const areas = this.board.getAreas();
    Object.keys(areas).forEach(x => {
      Object.keys(areas[x]).forEach(y => {
        const distance = Math.max(Math.abs(x - at.x), Math.abs(y - at.y));
        if (distance > radius) {
          this.board.freeArea(Number(x), Number(y));
        }
      });
    });
  }

  // ===========================

  /** Start the requestAnimationFrame game loop. */
  startLoop() {
    this.tick();
  }

  /** Schedule the next frame: run one update, then re-arm. */
  tick() {
    requestAnimationFrame((timestamp) => {
      this.update(timestamp);
      this.tick();
    })
  }

  // ===========================

  /**
   * Advance the world by one frame: move the player, stream areas, tick NPC
   * behaviors and let the camera and renderer catch up.
   * @param {number} timestamp rAF high-resolution timestamp (ms)
   */
  update(timestamp) {
    // The clock owns the whole time policy — the cap that stops a backgrounded
    // tab from teleporting the character, the scale, and the pause. Pause is
    // simply `dt = 0`: everything below owes nothing, and the frame is still
    // painted, which is what lets a paused game survive a resize or an overlay.
    const dt = this.getClock().advance(timestamp);

    if(this.character && this._input.isMoving()) {
      // Bank the distance owed on each axis, spend whole pixels only. Rounding
      // each frame in isolation tied the walking speed to the refresh rate — and
      // below one pixel per frame (fast display or slow character) every frame
      // rounded to zero and was dropped, freezing the character for good.
      // Feeding each axis with its share of the UNIT vector is also what keeps a
      // diagonal from covering ~1.41× the distance of a straight line.
      const vector = this._input.getVector();
      const distance = dt * this.character.moveSpeed() / 1000;
      this._moveRemainderX += distance * vector.x;
      this._moveRemainderY += distance * vector.y;

      // Truncate towards zero: flooring a negative remainder would spend a pixel
      // that has not been earned yet.
      const dx = Math.trunc(this._moveRemainderX);
      const dy = Math.trunc(this._moveRemainderY);
      if(dx !== 0 || dy !== 0) {
        this._moveRemainderX -= dx;
        this._moveRemainderY -= dy;
        const walkedDistance = this.moveCharacter(dx, dy);
        this._streamAreas();
        this.character.update(walkedDistance);
      }
    } else {
      // Standing still owes nothing: a banked remainder would surface as a jump
      // on the next step.
      this._moveRemainderX = 0;
      this._moveRemainderY = 0;
    }

    // NPC behaviors run on the same clock as the player.
    this._behaviors.forEach(behavior => behavior.update(dt));

    // The world settles before it is painted. Anything that joined the scene
    // this frame — a streamed area, an entity spawned by a behavior — is mounted
    // here, and nowhere else: attaching an element used to raise the redraw flag
    // that nothing per-frame ever read, so it stayed invisible until the player
    // happened to cross an area boundary.
    //
    // The walk is pruned by that same flag: with nothing dirty, the board's own
    // check is the whole cost, and the tree is never descended.
    this.getBoard().update();

    // The camera follows its target; the viewport renderer applies the offset.
    this._camera.update();
    this.renderer.applyClockState(this.getClock());
    this.renderer.update();

    // Particles paint LAST: drawing before the camera moved would offset them by
    // one frame, and they must sit over what the renderer just placed.
    if(this._particles) {
      // Aged ONCE: both surfaces share the system, so a second update() here
      // would halve every particle's life.
      this._fxSystem.update(dt);
      this._particles.render(this._transform);

      this._groundParticles.placeInWorld(this._transform, this.width(), this.height());
      this._groundParticles.render(this._transform);
    }
  }

  /**
   * Stream the area window, but only when the character actually crosses into a
   * new area — the common case (walking within an area) does no work.
   */
  _streamAreas() {
    const at = this.getCurrentAreaCoordinates();
    if (this._lastAreaCoords
      && at.x === this._lastAreaCoords.x
      && at.y === this._lastAreaCoords.y) {
      return;
    }
    this._lastAreaCoords = at;

    this.loadAreasFromCurrentPosition();
    this.freeAreasFromCurrentPosition();
    // No board update here: loading an area flags the board, and the per-frame
    // walk later in this very frame mounts it. One path, not two.

    // Newly streamed elements declare effects too. Binding is idempotent, so
    // re-walking the board costs nothing for what is already wired.
    if(this._fxBinder) {
      this._fxBinder.bind(this.board);
    }
  }

  /**
   * Move the player through the world by (dx, dy), reverting on collision. The
   * camera follows separately, so the player is no longer glued to centre.
   *
   * A blocked diagonal falls back to each axis on its own ("slide along wall"):
   * without it, walking diagonally into a wall stops the character dead instead
   * of letting it follow the wall.
   * @param {number} dx pixels along x
   * @param {number} dy pixels along y
   * @returns {number} actually walked pixels (0 when blocked on every attempt)
   */
  moveCharacter(dx, dy) {
    if(!this.character) {
      return 0;
    }

    // A straight move has a single candidate; a diagonal degrades to one axis at
    // a time, most complete first.
    const attempts = (dx !== 0 && dy !== 0)
      ? [[dx, dy], [dx, 0], [0, dy]]
      : [[dx, dy]];

    // Move, reverting on a solid collision. The single detection pass also
    // yields the trigger hits, reconciled below at the final position.
    let detected;
    let blocked = true;
    let walkedX = 0;
    let walkedY = 0;
    for(const [attemptX, attemptY] of attempts) {
      blocked = this.character.moveBlocked(attemptX, attemptY, () => {
        detected = this.character.detectCollisionAndTrigger(this.board);
        return detected.collision.length > 0;
      });
      if(!blocked) {
        walkedX = attemptX;
        walkedY = attemptY;
        break;
      }
    }

    this.handle(EngineEvents.MAP_UPDATE, {
      map: this,
      character: this.character,
    });

    // Reconcile triggers at the FINAL position: when blocked, re-detect at the
    // reverted position so a trigger on the wall doesn't phantom-fire; when the
    // move went through, the single-pass hits are already at the final position.
    if(blocked) {
      this.character.getTrigger(this.board);
      return 0;
    }

    this.character.reconcileTrigger(detected.trigger);
    return Math.hypot(walkedX, walkedY);
  }

  /** Render the viewport. @returns {*} the renderer's render result */
  render() {
    return this.renderer.render();
  }

  /** Render debug overlays (zone boxes). @returns {*} the renderer's result */
  renderDebug() {
    return this.renderer.renderDebug();
  }

  // ===========================

  /**
   * @returns {Clock} the application's clock, or this viewport's own when it was
   * built without one
   */
  getClock() {
    return this._application?.getClock?.() ?? this._ownClock;
  }

  /** @returns {Scheduler} the loop's scheduler */
  getScheduler() {
    return this._scheduler;
  }

  /** @returns {DirectionalInput} the directions currently held */
  getInput() {
    return this._input;
  }

  /**
   * Stop the player's movement, whatever is held. The sprite keeps facing where
   * it was: an idle character still looks somewhere.
   */
  stop() {
    this._input.releaseAll();
  }

  /**
   * Move the player in a single direction, dropping anything else held, and
   * orient its sprite accordingly. Kept for hosts that drive the viewport
   * directly; keyboard input goes through {@link press}/{@link release}.
   * @param {string} direction one of 'up' | 'down' | 'left' | 'right'
   */
  move(direction) {
    this._input.releaseAll();
    this.press(direction);
  }

  /**
   * Hold a direction down, adding it to the ones already held (this is what
   * makes diagonals possible).
   * @param {string} direction one of 'up' | 'down' | 'left' | 'right'
   */
  press(direction) {
    if(this._input.press(direction)) {
      this._faceInputDirection();
    }
  }

  /**
   * Release a direction. The character keeps moving as long as another one is
   * still held — this is what killed the "phantom stop".
   * @param {string} direction one of 'up' | 'down' | 'left' | 'right'
   */
  release(direction) {
    if(this._input.release(direction)) {
      this._faceInputDirection();
    }
  }

  /**
   * Point the sprite at the most recent direction still held. Nothing held means
   * the character is idle: it keeps facing where it stopped.
   */
  _faceInputDirection() {
    const facing = this._input.getFacing();
    if(this.character && facing) {
      this.character.setDirection(facing);
    }
  }

  /**
   * Wire keyboard controls (when a player exists) and start the loop if there is
   * anything to drive (a player, or an active camera).
   */
  run() {
    if(this.character) {
      document.body.addEventListener('keydown', (event) => {
        // Auto-repeat re-fires keydown while a key is held; re-pressing would
        // make it the newest input again and steal the facing direction.
        if(event.repeat) {
          return;
        }
        this.press(Viewport.KEY_DIRECTIONS[event.key]);
      });

      document.body.addEventListener('keyup', (event) => {
        this.release(Viewport.KEY_DIRECTIONS[event.key]);
      });
    }

    // Nothing to drive (e.g. the host translates the board itself) → no loop.
    if(this.character || this._camera.isActive()) {
      this.startLoop();
    }
  }

  /** @returns {Geometry} the viewport geometry */
  getGeometry() {
    return this.geometry;
  }

  /** Get or set the viewport x. @param {number|null} [value] @returns {number} */
  x(value = null) {
    return this.geometry.x(value);
  }

  /** Get or set the viewport y. @param {number|null} [value] @returns {number} */
  y(value = null) {
    return this.geometry.y(value);
  }

  /** Get or set the viewport width. @param {number|null} [value] @returns {number} */
  width(value = null) {
    return this.geometry.width(value);
  }

  /** Get or set the viewport height. @param {number|null} [value] @returns {number} */
  height(value = null) {
    return this.geometry.height(value);
  }
}
