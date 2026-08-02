import { Character } from '../../character/Character.js';

/**
 * A ready-to-use character skinned from column 6, row 4 of the shared 48px
 * sprite sheet. Spawns unpositioned at the origin.
 */
export class Man04 extends Character
{
  constructor() {
    super(0, 0, 48 * 6, 48 * 4);
  }
}