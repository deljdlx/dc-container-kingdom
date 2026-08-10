import { EngineEvents } from '../events/EngineEvents.js';

/**
 * Runs callbacks on **game time**: after a delay, on a cadence, or spread over a
 * duration.
 *
 * It is a behavior like any other, ticked by the game loop with the loop's `dt`,
 * which is what separates it from `setTimeout`: everything it holds **freezes
 * with the clock** and follows its scale. A cooldown must not run out while the
 * game sits behind a menu, and an explosion must not finish expanding while the
 * world is in slow motion.
 *
 * @example
 * const scheduler = application.getScheduler();
 * scheduler.after(300, () => explode());
 * scheduler.every(1000, () => tickPoison());
 * scheduler.tween(200, progress => flash(1 - progress));
 * scheduler.after(2000, fade, { owner: bolt });   // cancelled if the bolt dies
 */
export class Scheduler
{
  /**
   * Live tasks. Replaced rather than mutated while ticking (copy-on-write), so
   * a callback may cancel itself, cancel its neighbour or schedule more without
   * making the walk skip an entry — the lesson `EventEmitter` already learned.
   * @type {Array<Object>}
   */
  _tasks = [];

  /**
   * Run `callback` once, `delay` game milliseconds from now.
   * @param {number} delay ms of game time
   * @param {() => void} callback
   * @param {Object} [options]
   * @param {Object} [options.owner] element whose destruction cancels this
   * @returns {{cancel: () => void, isDone: () => boolean}} handle
   */
  after(delay, callback, options = {}) {
    return this._add({ interval: Math.max(0, delay), callback, repeat: false }, options);
  }

  /**
   * Run `callback` every `interval` game milliseconds, until cancelled.
   *
   * The cadence does **not drift**: the leftover time is carried over, so
   * `every(1000)` fires at 1000, 2000, 3000 — not at 1016, 2033. A frame longer
   * than the interval fires it as many times as it owes, which is bounded by the
   * clock's own cap on `dt`: the alternative, skipping ticks, would silently
   * drop facts of the game.
   * @param {number} interval ms of game time
   * @param {() => void} callback
   * @param {Object} [options] see {@link after}
   * @returns {{cancel: () => void, isDone: () => boolean}} handle
   */
  every(interval, callback, options = {}) {
    return this._add({ interval: Math.max(1, interval), callback, repeat: true }, options);
  }

  /**
   * Run `callback(progress)` every frame for `duration`, from 0 to 1.
   *
   * The last call is **exactly 1**, always: a tween that stops at 0.97 leaves a
   * sprite at 97 % of its size for the rest of the game. Easing is the caller's
   * business — `progress` is linear, and a curve is one expression away.
   * @param {number} duration ms of game time
   * @param {(progress: number) => void} callback
   * @param {Object} [options] see {@link after}
   * @returns {{cancel: () => void, isDone: () => boolean}} handle
   */
  tween(duration, callback, options = {}) {
    return this._add(
      { interval: Math.max(1, duration), callback, repeat: false, tween: true },
      options,
    );
  }

  /**
   * @param {Object} task
   * @param {Object} options
   * @returns {{cancel: () => void, isDone: () => boolean}} handle
   */
  _add(task, { owner = null } = {}) {
    task.elapsed = 0;
    task.done = false;
    task.handle = {
      cancel: () => this._cancel(task),
      isDone: () => task.done,
    };

    // Dying with what it animates is the point: a fade scheduled on a bolt that
    // is shot down mid-flight has nothing left to fade. Same hook the FxBinder
    // uses — one lifetime mechanism, not two.
    if (owner?.addEventListener) {
      task.release = owner.addEventListener(EngineEvents.ELEMENT_DESTROY, () => this._cancel(task));
    }

    this._tasks = [...this._tasks, task];

    return task.handle;
  }

  /**
   * Retire a task. Idempotent — cancelling twice, or cancelling something that
   * already ran, is a no-op rather than an error.
   * @param {Object} task
   */
  _cancel(task) {
    if (task.done) {
      return;
    }
    task.done = true;
    task.release?.();
    this._tasks = this._tasks.filter(candidate => candidate !== task);
  }

  /**
   * Advance every task by the frame's game milliseconds.
   * @param {number} dt game ms — zero while paused, which freezes everything held here
   */
  update(dt) {
    if (dt <= 0 || this._tasks.length === 0) {
      return;
    }

    // Snapshot: cancelling replaces the array, so a callback that cancels a
    // neighbour cannot make this walk skip one.
    for (const task of this._tasks) {
      if (!task.done) {
        this._run(task, dt);
      }
    }
  }

  /**
   * @param {Object} task
   * @param {number} dt
   */
  _run(task, dt) {
    task.elapsed += dt;

    if (task.tween) {
      const progress = Math.min(1, task.elapsed / task.interval);
      task.callback(progress);
      if (progress >= 1) {
        this._cancel(task);
      }
      return;
    }

    while (!task.done && task.elapsed >= task.interval) {
      task.elapsed -= task.interval;
      if (!task.repeat) {
        // Retired BEFORE the call: a one-shot that schedules its successor must
        // not be cancelled by its own retirement.
        this._cancel(task);
      }
      task.callback();
    }
  }

  /** @returns {number} how many tasks are waiting — for tests and diagnostics */
  count() {
    return this._tasks.length;
  }

  /** Drop everything. Used when a world is torn down. */
  clear() {
    this._tasks.forEach(task => task.release?.());
    this._tasks = [];
  }
}
