import { SpriteElement } from '../../SpriteElement.js';
import { deadTreeCollision, sprite, treeCollision } from './atlas.js';

/**
 * Tree-like standalone sprites cut from `map-sprites-01`.
 *
 * Selection rule: only autonomous, clearly identifiable objects that can be
 * placed as-is on a map. Assembly fragments are intentionally excluded.
 */

/* Conifer variants extracted from the atlas. */
export class Conifer00 extends SpriteElement { static descriptor = sprite(11, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer01 extends SpriteElement { static descriptor = sprite(75, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer02 extends SpriteElement { static descriptor = sprite(139, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer03 extends SpriteElement { static descriptor = sprite(203, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer04 extends SpriteElement { static descriptor = sprite(267, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer05 extends SpriteElement { static descriptor = sprite(331, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer06 extends SpriteElement { static descriptor = sprite(395, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer07 extends SpriteElement { static descriptor = sprite(459, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer08 extends SpriteElement { static descriptor = sprite(523, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer09 extends SpriteElement { static descriptor = sprite(587, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer10 extends SpriteElement { static descriptor = sprite(651, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer11 extends SpriteElement { static descriptor = sprite(715, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer12 extends SpriteElement { static descriptor = sprite(843, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer13 extends SpriteElement { static descriptor = sprite(907, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer14 extends SpriteElement { static descriptor = sprite(971, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer15 extends SpriteElement { static descriptor = sprite(1035, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer16 extends SpriteElement { static descriptor = sprite(1163, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer17 extends SpriteElement { static descriptor = sprite(1227, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer18 extends SpriteElement { static descriptor = sprite(1291, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer19 extends SpriteElement { static descriptor = sprite(1355, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer20 extends SpriteElement { static descriptor = sprite(1419, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer21 extends SpriteElement { static descriptor = sprite(1483, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer22 extends SpriteElement { static descriptor = sprite(1547, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer23 extends SpriteElement { static descriptor = sprite(1611, 3, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer24 extends SpriteElement { static descriptor = sprite(139, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer25 extends SpriteElement { static descriptor = sprite(203, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer26 extends SpriteElement { static descriptor = sprite(395, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer27 extends SpriteElement { static descriptor = sprite(459, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer28 extends SpriteElement { static descriptor = sprite(651, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer29 extends SpriteElement { static descriptor = sprite(715, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer30 extends SpriteElement { static descriptor = sprite(971, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer31 extends SpriteElement { static descriptor = sprite(1035, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer32 extends SpriteElement { static descriptor = sprite(1291, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer33 extends SpriteElement { static descriptor = sprite(1355, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer34 extends SpriteElement { static descriptor = sprite(1547, 67, 42, 61, { collision: treeCollision(42, 61) }); }
export class Conifer35 extends SpriteElement { static descriptor = sprite(1611, 67, 42, 61, { collision: treeCollision(42, 61) }); }

/* LeafTree variants extracted from the atlas. */
export class LeafTree00 extends SpriteElement { static descriptor = sprite(12, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree01 extends SpriteElement { static descriptor = sprite(140, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree02 extends SpriteElement { static descriptor = sprite(268, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree03 extends SpriteElement { static descriptor = sprite(396, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree04 extends SpriteElement { static descriptor = sprite(524, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree05 extends SpriteElement { static descriptor = sprite(652, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree06 extends SpriteElement { static descriptor = sprite(780, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree07 extends SpriteElement { static descriptor = sprite(844, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree08 extends SpriteElement { static descriptor = sprite(972, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree09 extends SpriteElement { static descriptor = sprite(1100, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree10 extends SpriteElement { static descriptor = sprite(1164, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree11 extends SpriteElement { static descriptor = sprite(1292, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree12 extends SpriteElement { static descriptor = sprite(1420, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree13 extends SpriteElement { static descriptor = sprite(1548, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree14 extends SpriteElement { static descriptor = sprite(1676, 139, 40, 53, { collision: treeCollision(40, 53) }); }
export class LeafTree15 extends SpriteElement { static descriptor = sprite(77, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree16 extends SpriteElement { static descriptor = sprite(205, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree17 extends SpriteElement { static descriptor = sprite(333, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree18 extends SpriteElement { static descriptor = sprite(461, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree19 extends SpriteElement { static descriptor = sprite(589, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree20 extends SpriteElement { static descriptor = sprite(717, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree21 extends SpriteElement { static descriptor = sprite(909, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree22 extends SpriteElement { static descriptor = sprite(1037, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree23 extends SpriteElement { static descriptor = sprite(1229, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree24 extends SpriteElement { static descriptor = sprite(1357, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree25 extends SpriteElement { static descriptor = sprite(1485, 144, 38, 48, { collision: treeCollision(38, 48) }); }
export class LeafTree26 extends SpriteElement { static descriptor = sprite(1613, 144, 38, 48, { collision: treeCollision(38, 48) }); }

/* CanopyTree variants extracted from the atlas. */
export class CanopyTree00 extends SpriteElement { static descriptor = sprite(4, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree01 extends SpriteElement { static descriptor = sprite(68, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree02 extends SpriteElement { static descriptor = sprite(132, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree03 extends SpriteElement { static descriptor = sprite(196, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree04 extends SpriteElement { static descriptor = sprite(260, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree05 extends SpriteElement { static descriptor = sprite(324, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree06 extends SpriteElement { static descriptor = sprite(388, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree07 extends SpriteElement { static descriptor = sprite(452, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree08 extends SpriteElement { static descriptor = sprite(516, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree09 extends SpriteElement { static descriptor = sprite(580, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree10 extends SpriteElement { static descriptor = sprite(644, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree11 extends SpriteElement { static descriptor = sprite(708, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree12 extends SpriteElement { static descriptor = sprite(836, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree13 extends SpriteElement { static descriptor = sprite(900, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree14 extends SpriteElement { static descriptor = sprite(964, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree15 extends SpriteElement { static descriptor = sprite(1028, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree16 extends SpriteElement { static descriptor = sprite(1156, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree17 extends SpriteElement { static descriptor = sprite(1220, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree18 extends SpriteElement { static descriptor = sprite(1284, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree19 extends SpriteElement { static descriptor = sprite(1348, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree20 extends SpriteElement { static descriptor = sprite(1412, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree21 extends SpriteElement { static descriptor = sprite(1476, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree22 extends SpriteElement { static descriptor = sprite(1540, 208, 56, 64, { collision: treeCollision(56, 64) }); }
export class CanopyTree23 extends SpriteElement { static descriptor = sprite(1604, 208, 56, 64, { collision: treeCollision(56, 64) }); }

/* TallTree variants extracted from the atlas. */
export class TallTree00 extends SpriteElement { static descriptor = sprite(5, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree01 extends SpriteElement { static descriptor = sprite(69, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree02 extends SpriteElement { static descriptor = sprite(133, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree03 extends SpriteElement { static descriptor = sprite(197, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree04 extends SpriteElement { static descriptor = sprite(261, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree05 extends SpriteElement { static descriptor = sprite(325, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree06 extends SpriteElement { static descriptor = sprite(389, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree07 extends SpriteElement { static descriptor = sprite(453, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree08 extends SpriteElement { static descriptor = sprite(517, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree09 extends SpriteElement { static descriptor = sprite(581, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree10 extends SpriteElement { static descriptor = sprite(645, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree11 extends SpriteElement { static descriptor = sprite(709, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree12 extends SpriteElement { static descriptor = sprite(773, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree13 extends SpriteElement { static descriptor = sprite(837, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree14 extends SpriteElement { static descriptor = sprite(901, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree15 extends SpriteElement { static descriptor = sprite(965, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree16 extends SpriteElement { static descriptor = sprite(1029, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree17 extends SpriteElement { static descriptor = sprite(1093, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree18 extends SpriteElement { static descriptor = sprite(1157, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree19 extends SpriteElement { static descriptor = sprite(1221, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree20 extends SpriteElement { static descriptor = sprite(1285, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree21 extends SpriteElement { static descriptor = sprite(1349, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree22 extends SpriteElement { static descriptor = sprite(1413, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree23 extends SpriteElement { static descriptor = sprite(1477, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree24 extends SpriteElement { static descriptor = sprite(1541, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree25 extends SpriteElement { static descriptor = sprite(1605, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree26 extends SpriteElement { static descriptor = sprite(1669, 277, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree27 extends SpriteElement { static descriptor = sprite(773, 389, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree28 extends SpriteElement { static descriptor = sprite(1093, 389, 54, 104, { collision: treeCollision(54, 104) }); }
export class TallTree29 extends SpriteElement { static descriptor = sprite(1669, 389, 54, 104, { collision: treeCollision(54, 104) }); }

/* DeadTree variants extracted from the atlas. */
export class DeadTree00 extends SpriteElement { static descriptor = sprite(1804, 401, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree01 extends SpriteElement { static descriptor = sprite(8, 496, 45, 93, { collision: deadTreeCollision(45, 93) }); }
export class DeadTree02 extends SpriteElement { static descriptor = sprite(264, 496, 45, 93, { collision: deadTreeCollision(45, 93) }); }
export class DeadTree03 extends SpriteElement { static descriptor = sprite(520, 496, 45, 93, { collision: deadTreeCollision(45, 93) }); }
export class DeadTree04 extends SpriteElement { static descriptor = sprite(840, 496, 45, 93, { collision: deadTreeCollision(45, 93) }); }
export class DeadTree05 extends SpriteElement { static descriptor = sprite(1160, 496, 45, 93, { collision: deadTreeCollision(45, 93) }); }
export class DeadTree06 extends SpriteElement { static descriptor = sprite(1416, 496, 45, 93, { collision: deadTreeCollision(45, 93) }); }
export class DeadTree07 extends SpriteElement { static descriptor = sprite(76, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree08 extends SpriteElement { static descriptor = sprite(140, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree09 extends SpriteElement { static descriptor = sprite(204, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree10 extends SpriteElement { static descriptor = sprite(332, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree11 extends SpriteElement { static descriptor = sprite(396, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree12 extends SpriteElement { static descriptor = sprite(460, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree13 extends SpriteElement { static descriptor = sprite(588, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree14 extends SpriteElement { static descriptor = sprite(652, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree15 extends SpriteElement { static descriptor = sprite(716, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree16 extends SpriteElement { static descriptor = sprite(908, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree17 extends SpriteElement { static descriptor = sprite(972, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree18 extends SpriteElement { static descriptor = sprite(1036, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree19 extends SpriteElement { static descriptor = sprite(1228, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree20 extends SpriteElement { static descriptor = sprite(1292, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree21 extends SpriteElement { static descriptor = sprite(1356, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree22 extends SpriteElement { static descriptor = sprite(1484, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree23 extends SpriteElement { static descriptor = sprite(1548, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }
export class DeadTree24 extends SpriteElement { static descriptor = sprite(1612, 497, 39, 92, { collision: deadTreeCollision(39, 92) }); }

/* SaplingTree variants extracted from the atlas. */
export class SaplingTree00 extends SpriteElement { static descriptor = sprite(1684, 605, 44, 97, { collision: deadTreeCollision(44, 97) }); }
export class SaplingTree01 extends SpriteElement { static descriptor = sprite(1732, 605, 44, 97, { collision: deadTreeCollision(44, 97) }); }
export class SaplingTree02 extends SpriteElement { static descriptor = sprite(1780, 605, 44, 97, { collision: deadTreeCollision(44, 97) }); }
export class SaplingTree03 extends SpriteElement { static descriptor = sprite(786, 612, 28, 41, { collision: deadTreeCollision(28, 41) }); }
export class SaplingTree04 extends SpriteElement { static descriptor = sprite(1106, 612, 28, 41, { collision: deadTreeCollision(28, 41) }); }
export class SaplingTree05 extends SpriteElement { static descriptor = sprite(1840, 624, 26, 78, { collision: deadTreeCollision(26, 78) }); }
