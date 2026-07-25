import { Character } from '../../Character.js';

/**
 * A ready-to-use character skinned from column 3, row 4 of the shared 48px
 * sprite sheet. Spawns unpositioned at the origin.
 */
export class Man03 extends Character
{
  constructor() {
    super(0, 0, 48 * 3, 48 * 4);
  }
}