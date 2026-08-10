/**
 * Paints **temporary things** in world coordinates: a projectile in flight, an
 * explosion, a decal, a floating number.
 *
 * This is the canvas side of the engine's routing rule — the DOM carries what is
 * alive or persistent, the canvas carries what is temporary by design. A bolt
 * drawn here costs one `drawImage`, where a DOM element costs three nodes and a
 * layout.
 *
 * It holds **plain objects the host owns and mutates**. There is deliberately no
 * animation here: moving a sprite is one assignment, and timing belongs to the
 * scheduler.
 *
 * ```js
 * const bolt = painter.add({ x, y, width: 8, height: 8, color: '#ffd166', shape: 'circle' });
 * scheduler.tween(600, progress => { bolt.x = from + progress * range; });
 * painter.remove(bolt);
 * ```
 *
 * @typedef {Object} FxSprite
 * @property {number} x world position of the centre
 * @property {number} y world position of the centre
 * @property {number} width
 * @property {number} height
 * @property {number} [rotation] radians, around the centre
 * @property {number} [alpha] 0…1, defaults to 1
 * @property {string} [color] fill, when there is no image
 * @property {'rect'|'circle'} [shape] how a colour is filled; defaults to `rect`
 * @property {Object} [image] an already-resolved image; skipped while incomplete
 */
export class SpritePainter
{
  /** @type {Array<FxSprite>} */
  _sprites = [];

  /**
   * Add a sprite. The object is kept **by reference** — the caller keeps
   * mutating it, which is what makes movement free.
   * @param {FxSprite} sprite
   * @returns {FxSprite} the same object
   */
  add(sprite) {
    this._sprites.push(sprite);

    return sprite;
  }

  /**
   * @param {FxSprite} sprite
   * @returns {boolean} whether it was being painted
   */
  remove(sprite) {
    const index = this._sprites.indexOf(sprite);
    if (index === -1) {
      return false;
    }
    this._sprites.splice(index, 1);

    return true;
  }

  /** Drop everything — a world being torn down takes its effects with it. */
  clear() {
    this._sprites = [];
  }

  /** @returns {Array<FxSprite>} what is currently painted */
  getSprites() {
    return this._sprites;
  }

  /** @returns {boolean} */
  hasWork() {
    return this._sprites.length > 0;
  }

  /**
   * @param {Object} context 2d context, already transformed into world space
   */
  paint(context) {
    for (const sprite of this._sprites) {
      const alpha = sprite.alpha ?? 1;
      if (alpha <= 0) {
        continue;
      }
      context.globalAlpha = alpha;

      if (sprite.rotation) {
        // Rotating around the sprite's centre rather than the world origin —
        // the only reason this needs a matrix at all.
        context.save?.();
        context.translate(sprite.x, sprite.y);
        context.rotate(sprite.rotation);
        this._draw(context, sprite, -sprite.width / 2, -sprite.height / 2);
        context.restore?.();
      } else {
        this._draw(context, sprite, sprite.x - sprite.width / 2, sprite.y - sprite.height / 2);
      }
    }
    context.globalAlpha = 1;
  }

  /**
   * @param {Object} context
   * @param {FxSprite} sprite
   * @param {number} left top-left corner, already resolved
   * @param {number} top
   */
  _draw(context, sprite, left, top) {
    const { image, width, height } = sprite;

    if (image) {
      // An image that has not arrived yet is **skipped**, not awaited: the canvas
      // resolves nothing on its own, and drawing an incomplete image throws in
      // some browsers and paints nothing in others. One frame without the sprite
      // beats either.
      if (image.complete === false || image.naturalWidth === 0) {
        return;
      }
      context.drawImage(image, left, top, width, height);

      return;
    }

    if (!sprite.color) {
      return;
    }
    context.fillStyle = sprite.color;

    if (sprite.shape === 'circle') {
      context.beginPath();
      context.ellipse?.(left + width / 2, top + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      context.fill();

      return;
    }
    context.fillRect(left, top, width, height);
  }
}
