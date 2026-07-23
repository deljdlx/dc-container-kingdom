import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContainerRepository } from '../src/container-kingdom/assets/js/ContainerRepository.js';
import { makeStats } from '../mock/docker-mock.js';
import containers from '../mock/fixtures/containers.json' with { type: 'json' };

/**
 * A fake Docker client. `getAllContainersStats` advances a virtual clock each
 * call so two successive samples let the CPU calculation produce a real value.
 */
function makeClient(descriptors = containers) {
  let t = 1_000_000_000_000;
  return {
    getContainersDescriptors: vi.fn().mockResolvedValue(descriptors),
    getAllContainersStats: vi.fn(async () => {
      t += 5000;
      return descriptors.map(d => ({ id: d.Id, ...makeStats(d.Id, t) }));
    }),
  };
}

let repo;

beforeEach(() => {
  // ContainerView starts a watch() setTimeout on construction; fake timers keep
  // the suite from leaking real timers.
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ContainerRepository', () => {
  it('builds containers, one view each, plus network and compose indexes', async () => {
    repo = new ContainerRepository(makeClient());
    await repo.loadContainers();

    const list = repo.getContainers(true);
    expect(list.length).toBe(containers.length);
    expect(repo.getContainerView(list[0].getId())).toBeDefined();
    expect(Object.keys(repo.getNetworks()).length).toBeGreaterThan(0);
    expect(Object.keys(repo.getComposes()).length).toBeGreaterThan(0);
  });

  it('sorts composes by container count, descending', async () => {
    repo = new ContainerRepository(makeClient());
    await repo.loadContainers();

    const sizes = Object.values(repo.getComposes()).map(c => c.length());
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
  });

  it('aggregates memory and CPU once stats are loaded', async () => {
    repo = new ContainerRepository(makeClient());
    await repo.loadContainers();
    await repo.loadContainersStats(); // first sample
    await repo.loadContainersStats(); // second sample enables CPU

    expect(repo.getTotalMemoryUsage()).toBeGreaterThan(0);
    expect(repo.getGlobalCpuUsage()).toBeGreaterThan(0);
  });

  it('reports failure when the stats client throws', async () => {
    const client = makeClient();
    client.getAllContainersStats = vi.fn().mockRejectedValue(new Error('down'));
    repo = new ContainerRepository(client);
    await repo.loadContainers();

    expect(await repo.loadContainersStats()).toBe(false);
  });

  it('keeps a stable checksum across identical reloads', async () => {
    repo = new ContainerRepository(makeClient());
    await repo.loadContainers();
    const checksum = repo.lastContainersChecksum;
    await repo.loadContainers();

    expect(repo.lastContainersChecksum).toBe(checksum);
  });

  it('prunes containers that vanished and stops their watch', async () => {
    const client = makeClient();
    repo = new ContainerRepository(client);
    await repo.loadContainers();

    const removedId = containers[0].Id;
    const stopWatch = vi.spyOn(repo.getContainerView(removedId), 'stopWatch');

    client.getContainersDescriptors.mockResolvedValue(containers.slice(1));
    await repo.loadContainers();

    expect(repo.getContainers()[removedId]).toBeUndefined();
    expect(stopWatch).toHaveBeenCalled();
  });
});
