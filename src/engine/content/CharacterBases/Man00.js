import { Character } from '../../character/Character.js';

/**
 * A ready-to-use character skinned from column 6 of the shared 48px sprite
 * sheet (the "man" base). Spawns unpositioned at the origin.
 */
export class Man00 extends Character
{
  constructor() {
    super(0, 0, 48 * 6);
  }
}