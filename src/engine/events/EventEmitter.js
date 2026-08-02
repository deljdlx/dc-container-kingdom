/**
 * Minimal name→callbacks event registry, and the substrate of the engine's
 * event bus. {@link Element} and {@link Application} each own one.
 *
 * Three properties matter, because entities that spawn and die in flight — a
 * projectile, an explosion — subscribe and unsubscribe constantly:
 *
 * 1. **Subscriptions are revocable.** `on()` hands back a function that undoes
 *    it. It used to return an index into a bucket, which the first removal
 *    would have invalidated; nothing ever read it.
 * 2. **Mutating during an emission is safe.** Buckets are **copy-on-write**:
 *    `on()`/`off()` replace the array instead of mutating it, so the loop in
 *    `emit()` keeps iterating the snapshot it started with. A listener that
 *    unsubscribes itself no longer makes the next one be skipped — and `emit()`
 *    allocates nothing to get there.
 * 3. **A listener can watch everything.** {@link onAny} exists for observers
 *    that cannot name what they are waiting for — the event console being the
 *    reason it exists.
 *
 * Snapshot semantics, and they are deliberate: a listener added *during* an
 * emission is not called by that emission, and one removed during it still is.
 *
 * The buckets live in a `Map`, not a plain object: a plain object would have
 * found `Object.prototype` members for names like `constructor` or `toString`.
 */
export class EventEmitter {
  /** @type {Map<string, Array<(data: object) => void>>} name → callbacks */
  _listeners = new Map();

  /** @type {Array<(data: object, name: string) => void>} watchers of every event */
  _anyListeners = [];

  /**
   * Register a callback for the named event.
   * @param {string} name
   * @param {(data: object) => void} callback
   * @returns {() => void} unsubscribe — idempotent, safe to call during an emission
   */
  on(name, callback) {
    const current = this._listeners.get(name);
    // Copy-on-write: never mutate a bucket an emission may be iterating.
    this._listeners.set(name, current ? [...current, callback] : [callback]);

    return () => this.off(name, callback);
  }

  /**
   * Remove a callback from the named event. Removes **every** registration of
   * that callback under that name, should it have been added twice.
   * @param {string} name
   * @param {(data: object) => void} callback
   * @returns {boolean} whether anything was removed
   */
  off(name, callback) {
    const current = this._listeners.get(name);
    if (!current) {
      return false;
    }

    const remaining = current.filter(listener => listener !== callback);
    if (remaining.length === current.length) {
      return false;
    }

    if (remaining.length === 0) {
      this._listeners.delete(name);
    }
    else {
      this._listeners.set(name, remaining);
    }
    return true;
  }

  /**
   * Watch **every** event this emitter fires, whatever its name.
   *
   * Reserved for observers — a console, a recorder, a test probe. A watcher runs
   * on every single emission, so it is opt-in and short-lived by design; when
   * none is registered, {@link emit} does not even look at the list.
   * @param {(data: object, name: string) => void} callback
   * @returns {() => void} unsubscribe
   */
  onAny(callback) {
    this._anyListeners = [...this._anyListeners, callback];

    return () => {
      this._anyListeners = this._anyListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Synchronously invoke every callback registered for the named event, then
   * every watcher.
   * @param {string} name
   * @param {object} [data]
   */
  emit(name, data = {}) {
    const listeners = this._listeners.get(name);
    if (listeners) {
      // Plain indexed loop over the bucket as it stands: copy-on-write already
      // guarantees this array cannot change under us, so no defensive copy.
      for (let index = 0; index < listeners.length; index += 1) {
        listeners[index](data);
      }
    }

    const watchers = this._anyListeners;
    if (watchers.length === 0) {
      return;
    }
    for (let index = 0; index < watchers.length; index += 1) {
      watchers[index](data, name);
    }
  }

  /**
   * @param {string|null} [name] omit to count every listener, watchers excluded
   * @returns {number} how many callbacks are registered
   */
  listenerCount(name = null) {
    if (name !== null) {
      return this._listeners.get(name)?.length ?? 0;
    }

    let total = 0;
    this._listeners.forEach(listeners => { total += listeners.length; });
    return total;
  }
}
