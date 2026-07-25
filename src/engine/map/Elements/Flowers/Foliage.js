import { SpriteElement } from '../../SpriteElement.js';
import { cell } from './atlas.js';

/**
 * Leafy plants of the `flowers-00` atlas.
 *
 * Each class is a one-line declaration: `cell(col, row)` derives the whole
 * descriptor from the sprite's place in the atlas' 32 px grid. Tints are not
 * encoded in the names — browse `/engine/catalog/` to pick one.
 */

/* Green foliage: grass tufts, ferns and leafy plants. */
export class Plant00 extends SpriteElement { static descriptor = cell(0, 5); }
export class Plant01 extends SpriteElement { static descriptor = cell(1, 5); }
export class Plant02 extends SpriteElement { static descriptor = cell(2, 5); }
export class Plant03 extends SpriteElement { static descriptor = cell(3, 5); }
export class Plant04 extends SpriteElement { static descriptor = cell(0, 6); }
export class Plant05 extends SpriteElement { static descriptor = cell(1, 6); }
export class Plant06 extends SpriteElement { static descriptor = cell(2, 6); }
export class Plant07 extends SpriteElement { static descriptor = cell(3, 6); }
export class Plant08 extends SpriteElement { static descriptor = cell(4, 6); }
export class Plant09 extends SpriteElement { static descriptor = cell(5, 6); }
export class Plant10 extends SpriteElement { static descriptor = cell(6, 6); }
export class Plant11 extends SpriteElement { static descriptor = cell(0, 8); }

/* Dried foliage: straw ferns, wheat and dead grass. */
export class DryPlant00 extends SpriteElement { static descriptor = cell(5, 4); }
export class DryPlant01 extends SpriteElement { static descriptor = cell(0, 7); }
export class DryPlant02 extends SpriteElement { static descriptor = cell(1, 7); }
export class DryPlant03 extends SpriteElement { static descriptor = cell(2, 7); }
export class DryPlant04 extends SpriteElement { static descriptor = cell(3, 7); }
export class DryPlant05 extends SpriteElement { static descriptor = cell(5, 7); }

/* Broad leaves crowned with one large bloom. */
export class Hosta00 extends SpriteElement { static descriptor = cell(13, 6); }
export class Hosta01 extends SpriteElement { static descriptor = cell(14, 6); }
export class Hosta02 extends SpriteElement { static descriptor = cell(13, 7); }
export class Hosta03 extends SpriteElement { static descriptor = cell(14, 7); }
export class Hosta04 extends SpriteElement { static descriptor = cell(15, 7); }
export class Hosta05 extends SpriteElement { static descriptor = cell(13, 8); }
export class Hosta06 extends SpriteElement { static descriptor = cell(14, 8); }
export class Hosta07 extends SpriteElement { static descriptor = cell(15, 8); }

/* Spike flowers (lupins), in a small and a large variant per tint. */
export class Lupin00 extends SpriteElement { static descriptor = cell(11, 3); }
export class Lupin01 extends SpriteElement { static descriptor = cell(12, 3); }
export class Lupin02 extends SpriteElement { static descriptor = cell(11, 4); }
export class Lupin03 extends SpriteElement { static descriptor = cell(12, 4); }
export class Lupin04 extends SpriteElement { static descriptor = cell(11, 5); }
export class Lupin05 extends SpriteElement { static descriptor = cell(12, 5); }
export class Lupin06 extends SpriteElement { static descriptor = cell(11, 6); }
export class Lupin07 extends SpriteElement { static descriptor = cell(12, 6); }
export class Lupin08 extends SpriteElement { static descriptor = cell(11, 7); }
export class Lupin09 extends SpriteElement { static descriptor = cell(12, 7); }
