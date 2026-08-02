import { Character } from '../../character/Character.js';

/**
 * A ready-to-use character skinned from column 3 of the shared 48px sprite
 * sheet (a "woman" base). Spawns unpositioned at the origin.
 */
export class Woman00 extends Character
{
  constructor() {
    super(0, 0, 48 * 3);
  }
}