import { describe, it, expect } from 'vitest';
import { ContainerGrid } from '../src/container-kingdom/js/ContainerGrid.js';
import containers from '../mock/fixtures/containers.json' with { type: 'json' };

describe('ContainerGrid (placement)', () => {
  it('places every container inside the grid bounds and is deterministic', () => {
    const grid = new ContainerGrid(15, 15);
    grid.computeBounds(containers);

    for (const container of containers) {
      const a = grid.computeContainerCoords(container);
      const b = grid.computeContainerCoords(container);
      expect(a).toEqual(b); // deterministic
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.x).toBeLessThan(15);
      expect(a.y).toBeGreaterThanOrEqual(0);
      expect(a.y).toBeLessThan(15);
    }
  });

  describe('occupancy', () => {
    it('marks a cell as taken', () => {
      const grid = new ContainerGrid(15, 15);
      expect(grid.isPositionValid(5, 5, 0)).toBe(true);
      grid.occupy(5, 5);
      expect(grid.isPositionValid(5, 5, 0)).toBe(false);
    });

    it('enforces the minimum spacing around an occupied cell', () => {
      const grid = new ContainerGrid(15, 15);
      grid.occupy(5, 5);
      expect(grid.isPositionValid(5, 6, 1)).toBe(false); // neighbour, too close
      expect(grid.isPositionValid(5, 7, 1)).toBe(true);  // two cells away, ok
    });

    it('rejects out-of-bounds cells', () => {
      const grid = new ContainerGrid(15, 15);
      expect(grid.isPositionValid(-1, 0, 0)).toBe(false);
      expect(grid.isPositionValid(0, 15, 0)).toBe(false);
    });
  });

  describe('getClosestFreeCoords', () => {
    it('returns the start cell when it is already free', () => {
      const grid = new ContainerGrid(15, 15);
      expect(grid.getClosestFreeCoords(5, 5, 0)).toEqual({ x: 5, y: 5 });
    });

    it('spirals to a neighbouring free cell when the start is taken', () => {
      const grid = new ContainerGrid(15, 15);
      grid.occupy(5, 5);
      const found = grid.getClosestFreeCoords(5, 5, 0);
      expect(found).not.toBeNull();
      expect(found).not.toEqual({ x: 5, y: 5 });
      expect(grid.isPositionValid(found.x, found.y, 0)).toBe(true);
    });

    it('returns null when no cell can satisfy the spacing', () => {
      const grid = new ContainerGrid(3, 3);
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          grid.occupy(x, y);
        }
      }
      expect(grid.getClosestFreeCoords(1, 1, 0)).toBeNull();
    });
  });
});
