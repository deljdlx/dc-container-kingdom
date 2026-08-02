/**
 * Shared descriptor helpers for the `flowers-00` sprite sheet.
 *
 * The sheet is a plain 16x16 grid of 32 px cells, so a sprite is fully
 * described by the cell it sits on. {@link cell} turns those grid coordinates
 * into a {@link import('../../SpriteElement.js').SpriteDescriptor}, which keeps
 * every element of the atlas a one-line declaration and makes the whole sheet
 * checkable by tests (bounds, overlaps, duplicates).
 */

/** Atlas path of the sheet, relative to the assets base. */
export const FLOWERS_00_ATLAS = 'map/flowers-00.png';

/** Side of one atlas cell, in px. */
export const FLOWERS_00_CELL = 32;

/**
 * Descriptor extras for a sprite spanning 2x2 cells (64x64).
 * @type {Partial<import('../../SpriteElement.js').SpriteDescriptor>}
 */
export const SPAN_2X2 = { width: 64, height: 64 };

/**
 * Descriptor extras for flat ground cover (carpets, slabs): it lies under
 * everything and never takes part in y-based depth sorting.
 * @type {Partial<import('../../SpriteElement.js').SpriteDescriptor>}
 */
export const GROUND = { manualZ: true };

/**
 * Builds the descriptor of the sprite anchored at the atlas cell (col, row).
 *
 * The sheet paints its own drop shadows, so `shadow` is off by default; pass
 * `{ shadow: true }` to opt back into the engine's shadow.
 *
 * @param {number} col zero-based column in the 32 px grid
 * @param {number} row zero-based row in the 32 px grid
 * @param {Partial<import('../../SpriteElement.js').SpriteDescriptor>} [extra]
 *   descriptor overrides: size ({@link SPAN_2X2}), zones, {@link GROUND}…
 * @returns {import('../../SpriteElement.js').SpriteDescriptor}
 */
export function cell(col, row, extra = {}) {
  return {
    width: FLOWERS_00_CELL,
    height: FLOWERS_00_CELL,
    atlas: FLOWERS_00_ATLAS,
    frame: [offset(col), offset(row)],
    shadow: false,
    ...extra,
  };
}

/**
 * Grid index to `background-position` offset. The `|| 0` keeps column/row 0 a
 * plain `0` rather than `-0`.
 * @param {number} index
 * @returns {number}
 */
function offset(index) {
  return -index * FLOWERS_00_CELL || 0;
}
