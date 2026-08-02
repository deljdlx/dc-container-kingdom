import { SpriteElement } from '../../scene/SpriteElement.js';
import { cell, GROUND, SPAN_2X2 } from './atlas.js';

/**
 * Large flower masses and flowering ground of the `flowers-00` atlas.
 *
 * Each class is a one-line declaration: `cell(col, row)` derives the whole
 * descriptor from the sprite's place in the atlas' 32 px grid. Tints are not
 * encoded in the names — browse `/engine/catalog/` to pick one.
 */

/* Large 64x64 flower fields. */
export class FlowerField00 extends SpriteElement { static descriptor = cell(14, 9, SPAN_2X2); }
export class FlowerField01 extends SpriteElement { static descriptor = cell(11, 10, SPAN_2X2); }
export class FlowerField02 extends SpriteElement { static descriptor = cell(13, 11, SPAN_2X2); }
export class FlowerField03 extends SpriteElement { static descriptor = cell(7, 12, SPAN_2X2); }
export class FlowerField04 extends SpriteElement { static descriptor = cell(9, 12, SPAN_2X2); }
export class FlowerField05 extends SpriteElement { static descriptor = cell(7, 14, SPAN_2X2); }
export class FlowerField06 extends SpriteElement { static descriptor = cell(9, 14, SPAN_2X2); }

/* Flowering grass bands that tile edge to edge — ground cover. */
export class FlowerGrass00 extends SpriteElement { static descriptor = cell(0, 9, GROUND); }
export class FlowerGrass01 extends SpriteElement { static descriptor = cell(1, 9, GROUND); }
export class FlowerGrass02 extends SpriteElement { static descriptor = cell(2, 9, GROUND); }
export class FlowerGrass03 extends SpriteElement { static descriptor = cell(3, 9, GROUND); }
export class FlowerGrass04 extends SpriteElement { static descriptor = cell(4, 9, GROUND); }
export class FlowerGrass05 extends SpriteElement { static descriptor = cell(5, 9, GROUND); }
