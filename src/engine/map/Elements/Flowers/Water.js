import { SpriteElement } from '../../SpriteElement.js';
import { cell } from './atlas.js';

/**
 * Water plants of the `flowers-00` atlas.
 *
 * Each class is a one-line declaration: `cell(col, row)` derives the whole
 * descriptor from the sprite's place in the atlas' 32 px grid. Tints are not
 * encoded in the names — browse `/engine/catalog/` to pick one.
 */

/* Lily pads floating without a flower. */
export class LilyPad00 extends SpriteElement { static descriptor = cell(8, 0); }
export class LilyPad01 extends SpriteElement { static descriptor = cell(10, 0); }
export class LilyPad02 extends SpriteElement { static descriptor = cell(11, 0); }
export class LilyPad03 extends SpriteElement { static descriptor = cell(13, 0); }
export class LilyPad04 extends SpriteElement { static descriptor = cell(8, 1); }
export class LilyPad05 extends SpriteElement { static descriptor = cell(10, 1); }
export class LilyPad06 extends SpriteElement { static descriptor = cell(11, 1); }
export class LilyPad07 extends SpriteElement { static descriptor = cell(13, 1); }
export class LilyPad08 extends SpriteElement { static descriptor = cell(8, 2); }
export class LilyPad09 extends SpriteElement { static descriptor = cell(10, 2); }
export class LilyPad10 extends SpriteElement { static descriptor = cell(11, 2); }
export class LilyPad11 extends SpriteElement { static descriptor = cell(13, 2); }
export class LilyPad12 extends SpriteElement { static descriptor = cell(8, 3); }
export class LilyPad13 extends SpriteElement { static descriptor = cell(10, 3); }
export class LilyPad14 extends SpriteElement { static descriptor = cell(8, 4); }
export class LilyPad15 extends SpriteElement { static descriptor = cell(10, 4); }

/* Lily pads carrying water-lily blooms. */
export class WaterLily00 extends SpriteElement { static descriptor = cell(9, 0); }
export class WaterLily01 extends SpriteElement { static descriptor = cell(12, 0); }
export class WaterLily02 extends SpriteElement { static descriptor = cell(9, 1); }
export class WaterLily03 extends SpriteElement { static descriptor = cell(12, 1); }
export class WaterLily04 extends SpriteElement { static descriptor = cell(9, 2); }
export class WaterLily05 extends SpriteElement { static descriptor = cell(12, 2); }
export class WaterLily06 extends SpriteElement { static descriptor = cell(9, 3); }
export class WaterLily07 extends SpriteElement { static descriptor = cell(9, 4); }
