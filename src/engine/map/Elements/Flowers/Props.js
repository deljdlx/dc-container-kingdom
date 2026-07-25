import { SpriteElement } from '../../SpriteElement.js';
import { cell, GROUND } from './atlas.js';

/**
 * Non-plant props of the `flowers-00` atlas.
 *
 * Each class is a one-line declaration: `cell(col, row)` derives the whole
 * descriptor from the sprite's place in the atlas' 32 px grid. Tints are not
 * encoded in the names — browse `/engine/catalog/` to pick one.
 */

/* Tree stumps, bare and mossy — solid. */
export class Stump00 extends SpriteElement { static descriptor = cell(4, 5, { collision: [5, 17, 20, 10] }); }
export class Stump01 extends SpriteElement { static descriptor = cell(4, 7, { collision: [4, 19, 24, 10] }); }

/* Boulders and geodes — solid. */
export class Rock00 extends SpriteElement { static descriptor = cell(10, 5, { collision: [7, 19, 19, 10] }); }
export class Rock01 extends SpriteElement { static descriptor = cell(10, 6, { collision: [8, 16, 19, 10] }); }
export class Rock02 extends SpriteElement { static descriptor = cell(10, 7, { collision: [8, 17, 19, 10] }); }
export class Rock03 extends SpriteElement { static descriptor = cell(10, 8, { collision: [8, 15, 19, 10] }); }

/* Scattered petals, for use as ground particles. */
export class Petals00 extends SpriteElement { static descriptor = cell(3, 8); }
export class Petals01 extends SpriteElement { static descriptor = cell(4, 8); }
export class Petals02 extends SpriteElement { static descriptor = cell(5, 8); }
export class Petals03 extends SpriteElement { static descriptor = cell(6, 8); }
export class Petals04 extends SpriteElement { static descriptor = cell(7, 8); }
export class Petals05 extends SpriteElement { static descriptor = cell(6, 9); }

/* Flat stone slabs laid on the ground — walkable. */
export class StoneSlab00 extends SpriteElement { static descriptor = cell(1, 8, GROUND); }

/* A stone well — solid. */
export class Well00 extends SpriteElement { static descriptor = cell(2, 8, { collision: [3, 14, 26, 16] }); }

/* Mossy hollow logs sprouting mushrooms — solid. */
export class HollowLog00 extends SpriteElement { static descriptor = cell(7, 9, { collision: [2, 15, 28, 15] }); }
export class HollowLog01 extends SpriteElement { static descriptor = cell(10, 9, { collision: [2, 16, 28, 15] }); }
export class HollowLog02 extends SpriteElement { static descriptor = cell(11, 9, { collision: [2, 16, 28, 15] }); }
