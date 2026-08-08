/**
 * The engine's single source of time.
 *
 * Everything that advances — the player's step, NPC behaviors, particle life,
 * anything scheduled — reads its milliseconds from here, and from nowhere else.
 * That is what makes pausing and slow motion possible at all: a subsystem that
 * keeps its own timer keeps running when the game stops.
 *
 * **Only the game loop advances it** ({@link advance}); everything else reads.
 *
 * Pause is expressed as **`dt = 0`**, not as a stopped loop, and that single
 * decision is what keeps the rest of the engine free of pause-handling code:
 * the player owes `dt × speed` pixels, behaviors accumulate `dt`, particles age
 * by `dt` — all of them freeze on their own. The loop keeps running, so the
 * frame is still painted: a paused game must survive a window resize, an
 * overlay, a menu.
 *
 * @example
 * const clock = application.getClock();
 * clock.scale(0.25);   // slow motion
 * clock.pause();       // everything freezes, the frame still paints
 */
export class Clock
{
  /**
   * Largest real step the clock will report, in ms.
   *
   * Restoring a backgrounded tab hands the loop a delta of several seconds
   * (rAF is throttled to a stop when hidden). Spent as-is it teleports the
   * character through walls, since collisions are tested per step. Capping is
   * the standard answer: the world runs slightly slow for one frame, which
   * nobody can see, instead of jumping, which everybody sees.
   */
  static MAX_STEP = 100;

  /** @type {number} game time elapsed, in ms */
  _now = 0;

  /** @type {number} game milliseconds of the current frame */
  _dt = 0;

  /** @type {number} frames advanced since the clock started */
  _frame = 0;

  /** @type {number} time multiplier: 0.25 is slow motion, 2 is fast forward */
  _scale = 1;

  /** @type {boolean} */
  _paused = false;

  /** @type {?number} previous real timestamp, null until the first frame */
  _last = null;

  /**
   * Advance by the real time elapsed since the previous call, capped by
   * {@link MAX_STEP} and multiplied by {@link scale}.
   *
   * The first call establishes the origin and yields `0`: there is no previous
   * timestamp to measure against, and inventing one would spend a frame's worth
   * of movement that was never owed.
   * @param {number} timestamp real time in ms — the rAF timestamp
   * @returns {number} the game milliseconds of this frame
   */
  advance(timestamp) {
    const elapsed = this._last === null
      ? 0
      : Math.min(Math.max(0, timestamp - this._last), Clock.MAX_STEP);
    this._last = timestamp;

    return this._step(this._paused ? 0 : elapsed * this._scale);
  }

  /**
   * Advance by hand, ignoring real time, the pause and the scale.
   *
   * This is how tests and probes drive the world: the game loop runs on
   * `requestAnimationFrame`, which the browser **suspends in a background tab**,
   * so anything waiting on a frame there waits forever. Stepping asks for the
   * frame directly.
   * @param {number} ms game milliseconds to advance
   * @returns {number} the game milliseconds of this frame
   */
  step(ms) {
    return this._step(Math.max(0, ms));
  }

  /**
   * @param {number} dt game milliseconds already scaled and capped
   * @returns {number} that same dt
   */
  _step(dt) {
    this._dt = dt;
    this._now += dt;
    this._frame += 1;

    return dt;
  }

  /**
   * Game time since the clock started. Monotonic, and **frozen while paused** —
   * which is what separates it from `performance.now()` and why events are
   * stamped with it: two things that happened in the same paused instant did
   * happen in the same instant.
   * @returns {number} ms
   */
  now() {
    return this._now;
  }

  /** @returns {number} game milliseconds of the current frame */
  dt() {
    return this._dt;
  }

  /** @returns {number} frames advanced since the clock started */
  frame() {
    return this._frame;
  }

  /**
   * Read or set the time multiplier.
   *
   * A scale of `0` freezes the world exactly like {@link pause} — the
   * difference is intent, and it is readable: `isPaused()` says a game is
   * paused, a scale says how fast it runs. Negative values are refused; running
   * time backwards would need every subsystem to know how to undo a step.
   * @param {?number} [value]
   * @returns {number} the current scale
   */
  scale(value = null) {
    if (value !== null) {
      this._scale = Math.max(0, value);
    }

    return this._scale;
  }

  /** Freeze game time. The loop keeps running and the frame keeps painting. */
  pause() {
    this._paused = true;
  }

  /** Resume game time where it was left. */
  resume() {
    this._paused = false;
  }

  /** @returns {boolean} */
  isPaused() {
    return this._paused;
  }
}
