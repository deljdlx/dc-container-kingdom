import { Character } from '../../character/Character.js';

/**
 * A ready-to-use character skinned from column 9, row 4 of the shared 48px
 * sprite sheet (a "woman" base variant). Spawns unpositioned at the origin.
 */
export class Woman02 extends Character
{
  constructor() {
    super(0, 0, 48 * 9, 48 * 4);
  }
}