import { Character } from '../../character/Character.js';

/**
 * A ready-to-use character skinned from column 0, row 0 of the shared 48px
 * sprite sheet. Spawns unpositioned at the origin.
 */
export class Man01 extends Character
{
  constructor() {
    super(0, 0, 48 * 0, 48 * 0);
  }
}