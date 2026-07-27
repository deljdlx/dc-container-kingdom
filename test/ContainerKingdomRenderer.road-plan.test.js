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

function serializePlan(plan) {
  return {
    metrics: plan.metrics,
    tiles: plan.tiles
      .map(({ x, y, networks }) => ({
        x,
        y,
        networks: [...networks].sort(),
      }))
      .sort((left, right) => left.x - right.x || left.y - right.y || left.networks.join(',').localeCompare(right.networks.join(','))),
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
    expect([...plan.tiles[0].networks].sort()).toEqual(['mariadb', 'web']);
    expect([...plan.tiles[1].networks].sort()).toEqual(['mariadb', 'web']);
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

  it('ignores the API order when building the road topology', () => {
    const web = [containerAt(0, 0), containerAt(4, 0), containerAt(4, 4), containerAt(8, 4)];
    const mariadb = [containerAt(1, 1), containerAt(3, 1), containerAt(3, 5), containerAt(7, 5)];

    const forward = ContainerKingdomRenderer.buildNetworksRoadPlan(
      {
        web,
        mariadb,
      },
      10,
      10,
      10,
      10,
    );

    const reversed = ContainerKingdomRenderer.buildNetworksRoadPlan(
      {
        mariadb: [...mariadb].reverse(),
        web: [...web].reverse(),
      },
      10,
      10,
      10,
      10,
    );

    expect(serializePlan(reversed)).toEqual(serializePlan(forward));
  });
});
