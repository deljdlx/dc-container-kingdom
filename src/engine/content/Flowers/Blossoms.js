import { SpriteElement } from '../../scene/SpriteElement.js';
import { cell, GROUND } from './atlas.js';

/**
 * Flowering bushes and standing flowers of the `flowers-00` atlas.
 *
 * Each class is a one-line declaration: `cell(col, row)` derives the whole
 * descriptor from the sprite's place in the atlas' 32 px grid. Tints are not
 * encoded in the names — browse `/engine/catalog/` to pick one.
 */

/* Small flowering bushes: one rosette of blooms over a leaf clump. */
export class Blossom00 extends SpriteElement { static descriptor = cell(0, 0); }
export class Blossom01 extends SpriteElement { static descriptor = cell(1, 0); }
export class Blossom02 extends SpriteElement { static descriptor = cell(2, 0); }
export class Blossom03 extends SpriteElement { static descriptor = cell(3, 0); }
export class Blossom04 extends SpriteElement { static descriptor = cell(4, 0); }
export class Blossom05 extends SpriteElement { static descriptor = cell(5, 0); }
export class Blossom06 extends SpriteElement { static descriptor = cell(6, 0); }
export class Blossom07 extends SpriteElement { static descriptor = cell(7, 0); }
export class Blossom08 extends SpriteElement { static descriptor = cell(0, 1); }
export class Blossom09 extends SpriteElement { static descriptor = cell(1, 1); }
export class Blossom10 extends SpriteElement { static descriptor = cell(2, 1); }
export class Blossom11 extends SpriteElement { static descriptor = cell(3, 1); }
export class Blossom12 extends SpriteElement { static descriptor = cell(4, 1); }
export class Blossom13 extends SpriteElement { static descriptor = cell(7, 1); }

/* Upright tulip-like flowers over a leaf clump. */
export class Tulip00 extends SpriteElement { static descriptor = cell(0, 2); }
export class Tulip01 extends SpriteElement { static descriptor = cell(1, 2); }
export class Tulip02 extends SpriteElement { static descriptor = cell(2, 2); }
export class Tulip03 extends SpriteElement { static descriptor = cell(3, 2); }
export class Tulip04 extends SpriteElement { static descriptor = cell(4, 2); }

/* Dense round flowering bushes. */
export class Flower00 extends SpriteElement { static descriptor = cell(0, 3, { shadow: true, trigger: [0, 0, 32, 32] }); }
export class Flower01 extends SpriteElement { static descriptor = cell(1, 3); }
export class Flower02 extends SpriteElement { static descriptor = cell(2, 3); }
export class Flower03 extends SpriteElement { static descriptor = cell(3, 3); }
export class Flower04 extends SpriteElement { static descriptor = cell(4, 3); }
export class Flower05 extends SpriteElement { static descriptor = cell(5, 3); }

/* Speckled flower carpets that tile edge to edge — ground cover. */
export class FlowerPatch00 extends SpriteElement { static descriptor = cell(0, 4, GROUND); }
export class FlowerPatch01 extends SpriteElement { static descriptor = cell(1, 4, GROUND); }
export class FlowerPatch02 extends SpriteElement { static descriptor = cell(2, 4, GROUND); }
export class FlowerPatch03 extends SpriteElement { static descriptor = cell(3, 4, GROUND); }
export class FlowerPatch04 extends SpriteElement { static descriptor = cell(4, 4, GROUND); }

/* A single flower on a tall leafy stem. */
export class StemFlower00 extends SpriteElement { static descriptor = cell(0, 10); }
export class StemFlower01 extends SpriteElement { static descriptor = cell(1, 10); }
export class StemFlower02 extends SpriteElement { static descriptor = cell(2, 10); }
export class StemFlower03 extends SpriteElement { static descriptor = cell(3, 10); }
export class StemFlower04 extends SpriteElement { static descriptor = cell(4, 10); }
export class StemFlower05 extends SpriteElement { static descriptor = cell(5, 10); }

/* Small sprigs of three to five blooms. */
export class FlowerSprig00 extends SpriteElement { static descriptor = cell(13, 4); }
export class FlowerSprig01 extends SpriteElement { static descriptor = cell(14, 4); }
export class FlowerSprig02 extends SpriteElement { static descriptor = cell(15, 4); }
export class FlowerSprig03 extends SpriteElement { static descriptor = cell(13, 5); }
export class FlowerSprig04 extends SpriteElement { static descriptor = cell(14, 5); }
export class FlowerSprig05 extends SpriteElement { static descriptor = cell(15, 5); }
export class FlowerSprig06 extends SpriteElement { static descriptor = cell(15, 6); }
export class FlowerSprig07 extends SpriteElement { static descriptor = cell(15, 12); }
export class FlowerSprig08 extends SpriteElement { static descriptor = cell(11, 13); }
export class FlowerSprig09 extends SpriteElement { static descriptor = cell(12, 13); }
export class FlowerSprig10 extends SpriteElement { static descriptor = cell(13, 13); }
export class FlowerSprig11 extends SpriteElement { static descriptor = cell(14, 13); }
export class FlowerSprig12 extends SpriteElement { static descriptor = cell(15, 13); }
