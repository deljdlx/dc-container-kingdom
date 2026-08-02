import { SpriteElement } from '../../scene/SpriteElement.js';
import { cell } from './atlas.js';

/**
 * Mushrooms of the `flowers-00` atlas, from small clumps to giant caps.
 *
 * Each class is a one-line declaration: `cell(col, row)` derives the whole
 * descriptor from the sprite's place in the atlas' 32 px grid. Tints are not
 * encoded in the names — browse `/engine/catalog/` to pick one.
 */

/* Clumps of small round mushrooms. */
export class Mushroom00 extends SpriteElement { static descriptor = cell(5, 1); }
export class Mushroom01 extends SpriteElement { static descriptor = cell(6, 1); }
export class Mushroom02 extends SpriteElement { static descriptor = cell(5, 2); }
export class Mushroom03 extends SpriteElement { static descriptor = cell(6, 2); }
export class Mushroom04 extends SpriteElement { static descriptor = cell(7, 2); }
export class Mushroom05 extends SpriteElement { static descriptor = cell(6, 3); }
export class Mushroom06 extends SpriteElement { static descriptor = cell(7, 3); }
export class Mushroom07 extends SpriteElement { static descriptor = cell(6, 4); }
export class Mushroom08 extends SpriteElement { static descriptor = cell(7, 4); }
export class Mushroom09 extends SpriteElement { static descriptor = cell(5, 5); }
export class Mushroom10 extends SpriteElement { static descriptor = cell(6, 5); }

/* Bunches of thin-stemmed toadstools. */
export class Toadstool00 extends SpriteElement { static descriptor = cell(7, 5); }
export class Toadstool01 extends SpriteElement { static descriptor = cell(7, 6); }
export class Toadstool02 extends SpriteElement { static descriptor = cell(6, 7); }
export class Toadstool03 extends SpriteElement { static descriptor = cell(7, 7); }

/* A single large mushroom, cap and stem. */
export class GiantMushroom00 extends SpriteElement { static descriptor = cell(11, 14); }
export class GiantMushroom01 extends SpriteElement { static descriptor = cell(12, 14); }
export class GiantMushroom02 extends SpriteElement { static descriptor = cell(13, 14); }
export class GiantMushroom03 extends SpriteElement { static descriptor = cell(14, 14); }
export class GiantMushroom04 extends SpriteElement { static descriptor = cell(15, 14); }
export class GiantMushroom05 extends SpriteElement { static descriptor = cell(11, 15); }
export class GiantMushroom06 extends SpriteElement { static descriptor = cell(12, 15); }
export class GiantMushroom07 extends SpriteElement { static descriptor = cell(13, 15); }
export class GiantMushroom08 extends SpriteElement { static descriptor = cell(14, 15); }
export class GiantMushroom09 extends SpriteElement { static descriptor = cell(15, 15); }
