import { SpriteElement } from '../../SpriteElement.js';
import { cell } from './atlas.js';

/**
 * Massed flowers of the `flowers-00` atlas — clusters, bouquets and beds.
 *
 * Each class is a one-line declaration: `cell(col, row)` derives the whole
 * descriptor from the sprite's place in the atlas' 32 px grid. Tints are not
 * encoded in the names — browse `/engine/catalog/` to pick one.
 */

/* Loose flower clusters, in a small and a large variant per tint. */
export class FlowerCluster00 extends SpriteElement { static descriptor = cell(8, 5); }
export class FlowerCluster01 extends SpriteElement { static descriptor = cell(9, 5); }
export class FlowerCluster02 extends SpriteElement { static descriptor = cell(8, 6); }
export class FlowerCluster03 extends SpriteElement { static descriptor = cell(9, 6); }
export class FlowerCluster04 extends SpriteElement { static descriptor = cell(8, 7); }
export class FlowerCluster05 extends SpriteElement { static descriptor = cell(9, 7); }
export class FlowerCluster06 extends SpriteElement { static descriptor = cell(8, 8); }
export class FlowerCluster07 extends SpriteElement { static descriptor = cell(9, 8); }
export class FlowerCluster08 extends SpriteElement { static descriptor = cell(11, 8); }
export class FlowerCluster09 extends SpriteElement { static descriptor = cell(12, 8); }
export class FlowerCluster10 extends SpriteElement { static descriptor = cell(8, 9); }
export class FlowerCluster11 extends SpriteElement { static descriptor = cell(9, 9); }
export class FlowerCluster12 extends SpriteElement { static descriptor = cell(12, 9); }
export class FlowerCluster13 extends SpriteElement { static descriptor = cell(13, 9); }

/* Dense flower clusters heaped into a mound. */
export class FlowerMound00 extends SpriteElement { static descriptor = cell(6, 10); }
export class FlowerMound01 extends SpriteElement { static descriptor = cell(7, 10); }
export class FlowerMound02 extends SpriteElement { static descriptor = cell(8, 10); }
export class FlowerMound03 extends SpriteElement { static descriptor = cell(9, 10); }
export class FlowerMound04 extends SpriteElement { static descriptor = cell(7, 11); }
export class FlowerMound05 extends SpriteElement { static descriptor = cell(8, 11); }

/* Compact round bouquets. */
export class Bouquet00 extends SpriteElement { static descriptor = cell(0, 11); }
export class Bouquet01 extends SpriteElement { static descriptor = cell(1, 11); }
export class Bouquet02 extends SpriteElement { static descriptor = cell(0, 12); }
export class Bouquet03 extends SpriteElement { static descriptor = cell(1, 12); }
export class Bouquet04 extends SpriteElement { static descriptor = cell(0, 13); }
export class Bouquet05 extends SpriteElement { static descriptor = cell(1, 13); }
export class Bouquet06 extends SpriteElement { static descriptor = cell(0, 14); }
export class Bouquet07 extends SpriteElement { static descriptor = cell(1, 14); }
export class Bouquet08 extends SpriteElement { static descriptor = cell(0, 15); }
export class Bouquet09 extends SpriteElement { static descriptor = cell(1, 15); }

/* Loose bunches of large corollas. */
export class FlowerBunch00 extends SpriteElement { static descriptor = cell(2, 11); }
export class FlowerBunch01 extends SpriteElement { static descriptor = cell(3, 11); }
export class FlowerBunch02 extends SpriteElement { static descriptor = cell(2, 12); }
export class FlowerBunch03 extends SpriteElement { static descriptor = cell(3, 12); }
export class FlowerBunch04 extends SpriteElement { static descriptor = cell(2, 13); }
export class FlowerBunch05 extends SpriteElement { static descriptor = cell(3, 13); }
export class FlowerBunch06 extends SpriteElement { static descriptor = cell(2, 14); }
export class FlowerBunch07 extends SpriteElement { static descriptor = cell(3, 14); }
export class FlowerBunch08 extends SpriteElement { static descriptor = cell(2, 15); }
export class FlowerBunch09 extends SpriteElement { static descriptor = cell(3, 15); }

/* Four large roses over broad leaves. */
export class Rose00 extends SpriteElement { static descriptor = cell(4, 11); }
export class Rose01 extends SpriteElement { static descriptor = cell(4, 12); }
export class Rose02 extends SpriteElement { static descriptor = cell(4, 13); }
export class Rose03 extends SpriteElement { static descriptor = cell(4, 14); }
export class Rose04 extends SpriteElement { static descriptor = cell(5, 14); }
export class Rose05 extends SpriteElement { static descriptor = cell(4, 15); }
export class Rose06 extends SpriteElement { static descriptor = cell(5, 15); }
export class Rose07 extends SpriteElement { static descriptor = cell(6, 15); }

/* Flower beds laid out in a staggered grid. */
export class FlowerBed00 extends SpriteElement { static descriptor = cell(5, 11); }
export class FlowerBed01 extends SpriteElement { static descriptor = cell(6, 11); }
export class FlowerBed02 extends SpriteElement { static descriptor = cell(5, 12); }
export class FlowerBed03 extends SpriteElement { static descriptor = cell(6, 12); }
export class FlowerBed04 extends SpriteElement { static descriptor = cell(5, 13); }
export class FlowerBed05 extends SpriteElement { static descriptor = cell(6, 13); }
export class FlowerBed06 extends SpriteElement { static descriptor = cell(6, 14); }
