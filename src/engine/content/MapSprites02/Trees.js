import { SpriteElement } from '../../scene/SpriteElement.js';
import { sprite, treeCollision } from './atlas.js';

/**
 * Tree-like autonomous vegetation cut from `map-sprites-02`.
 *
 * This first lot keeps only clearly identifiable, stand-alone vegetation from
 * the upper-left part of the atlas. The rest of the sheet is intentionally left
 * for later lots when the assembly fragments have been triaged more finely.
 */

export class Tree01 extends SpriteElement { static descriptor = sprite(352, 18, 48, 77, { collision: treeCollision(48, 77) }); }
export class Tree02 extends SpriteElement { static descriptor = sprite(11, 19, 42, 61, { collision: treeCollision(42, 61) }); }
export class Tree03 extends SpriteElement { static descriptor = sprite(77, 19, 38, 61, { collision: treeCollision(38, 61) }); }
export class Tree04 extends SpriteElement { static descriptor = sprite(140, 19, 40, 61, { collision: treeCollision(40, 61) }); }
export class Tree05 extends SpriteElement { static descriptor = sprite(206, 19, 36, 61, { collision: treeCollision(36, 61) }); }
export class Tree06 extends SpriteElement { static descriptor = sprite(258, 22, 28, 57, { collision: treeCollision(28, 57) }); }
export class Tree07 extends SpriteElement { static descriptor = sprite(450, 23, 30, 56, { collision: treeCollision(30, 56) }); }
export class Tree08 extends SpriteElement { static descriptor = sprite(490, 23, 30, 56, { collision: treeCollision(30, 56) }); }
export class Tree09 extends SpriteElement { static descriptor = sprite(404, 29, 44, 97, { collision: treeCollision(44, 97) }); }
export class Tree10 extends SpriteElement { static descriptor = sprite(290, 33, 28, 46, { collision: treeCollision(28, 46) }); }
export class Tree11 extends SpriteElement { static descriptor = sprite(320, 34, 32, 46, { collision: treeCollision(32, 46) }); }
export class Tree12 extends SpriteElement { static descriptor = sprite(32, 80, 16, 79, { collision: treeCollision(16, 79) }); }
export class Tree13 extends SpriteElement { static descriptor = sprite(80, 81, 32, 30, { collision: treeCollision(32, 30) }); }
export class Tree14 extends SpriteElement { static descriptor = sprite(53, 86, 22, 25, { collision: treeCollision(22, 25) }); }
export class Tree15 extends SpriteElement { static descriptor = sprite(448, 86, 30, 57, { collision: treeCollision(30, 57) }); }
export class Tree16 extends SpriteElement { static descriptor = sprite(488, 86, 30, 57, { collision: treeCollision(30, 57) }); }
export class Tree17 extends SpriteElement { static descriptor = sprite(209, 91, 46, 53, { collision: treeCollision(46, 53) }); }
export class Tree18 extends SpriteElement { static descriptor = sprite(113, 92, 30, 19, { collision: treeCollision(30, 19) }); }
export class Tree19 extends SpriteElement { static descriptor = sprite(352, 96, 32, 15, { collision: treeCollision(32, 15) }); }
export class Tree20 extends SpriteElement { static descriptor = sprite(145, 97, 30, 15, { collision: treeCollision(30, 15) }); }
export class Tree21 extends SpriteElement { static descriptor = sprite(177, 97, 30, 45, { collision: treeCollision(30, 45) }); }
export class Tree22 extends SpriteElement { static descriptor = sprite(80, 113, 32, 30, { collision: treeCollision(32, 30) }); }
export class Tree23 extends SpriteElement { static descriptor = sprite(53, 118, 22, 25, { collision: treeCollision(22, 25) }); }
export class Tree24 extends SpriteElement { static descriptor = sprite(113, 124, 30, 19, { collision: treeCollision(30, 19) }); }
export class Tree25 extends SpriteElement { static descriptor = sprite(145, 129, 30, 15, { collision: treeCollision(30, 15) }); }
export class Tree26 extends SpriteElement { static descriptor = sprite(80, 145, 32, 29, { collision: treeCollision(32, 29) }); }
export class Tree27 extends SpriteElement { static descriptor = sprite(257, 145, 31, 63, { collision: treeCollision(31, 63) }); }
export class Tree28 extends SpriteElement { static descriptor = sprite(289, 145, 31, 63, { collision: treeCollision(31, 63) }); }
export class Tree29 extends SpriteElement { static descriptor = sprite(507, 146, 42, 62, { collision: treeCollision(42, 62) }); }
export class Tree30 extends SpriteElement { static descriptor = sprite(434, 149, 62, 91, { collision: treeCollision(62, 91) }); }
