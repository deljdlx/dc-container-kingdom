import { describe, expect, it } from 'vitest';
import { ContainerKingdomRenderer } from '../src/container-kingdom/js/ContainerKingdomRenderer.js';

function containerAt(x, y) {
  return {
    rpgEngine: {
      data: {
        coords: { x, y },
      },
    },
  };
}

describe('ContainerKingdomRenderer road planning', () => {
  it('deduplicates overlapping tiles and tracks all owning networks', () => {
    const plan = ContainerKingdomRenderer.buildNetworksRoadPlan(
      {
        web: [containerAt(0, 0), containerAt(2, 0)],
        mariadb: [containerAt(0, 0), containerAt(2, 0)],
      },
      10,
      10,
      10,
      10,
    );

    expect(plan.metrics).toEqual({
      attemptedTiles: 4,
      distinctTiles: 2,
      duplicateTiles: 2,
    });

    expect(plan.tiles).toHaveLength(2);
    expect([...plan.tiles[0].networks]).toEqual(['web', 'mariadb']);
    expect([...plan.tiles[1].networks]).toEqual(['web', 'mariadb']);
  });

  it('returns no tiles for a one-container network', () => {
    const plan = ContainerKingdomRenderer.buildNetworksRoadPlan(
      {
        solo: [containerAt(4, 4)],
      },
      10,
      10,
      10,
      10,
    );

    expect(plan.metrics).toEqual({
      attemptedTiles: 0,
      distinctTiles: 0,
      duplicateTiles: 0,
    });
    expect(plan.tiles).toEqual([]);
  });
});
