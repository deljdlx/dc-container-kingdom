import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContainerRepository } from '../src/container-kingdom/js/ContainerRepository.js';
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

  it('does not trigger change callback on first load but does on a state change', async () => {
    const client = makeClient();
    repo = new ContainerRepository(client);
    const onChanged = vi.fn();
    repo.onContainersChanged = onChanged;

    await repo.loadContainers();
    expect(onChanged).not.toHaveBeenCalled();

    const changed = JSON.parse(JSON.stringify(containers));
    changed[0].State = 'exited';
    client.getContainersDescriptors.mockResolvedValue(changed);

    await repo.loadContainers();
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('triggers the change callback when a container appears or vanishes', async () => {
    const client = makeClient();
    repo = new ContainerRepository(client);
    const onChanged = vi.fn();
    repo.onContainersChanged = onChanged;

    await repo.loadContainers();

    const withoutFirst = JSON.parse(JSON.stringify(containers)).slice(1);
    client.getContainersDescriptors.mockResolvedValue(withoutFirst);
    await repo.loadContainers();
    expect(onChanged).toHaveBeenCalledTimes(1);

    client.getContainersDescriptors.mockResolvedValue(
      JSON.parse(JSON.stringify(containers))
    );
    await repo.loadContainers();
    expect(onChanged).toHaveBeenCalledTimes(2);
  });

  // `Status` is Docker's human-readable label and ages on its own ("Up 4
  // seconds" → "Up 9 seconds"). Fingerprinting it made every poll report a
  // change, and the app reloaded itself in a loop.
  it('ignores the Status label ageing on its own', async () => {
    const client = makeClient();
    repo = new ContainerRepository(client);
    const onChanged = vi.fn();
    repo.onContainersChanged = onChanged;

    await repo.loadContainers();
    const baseline = repo.lastContainersChecksum;

    const aged = JSON.parse(JSON.stringify(containers));
    aged.forEach((descriptor, index) => {
      descriptor.Status = `Up ${index + 1} seconds`;
    });
    client.getContainersDescriptors.mockResolvedValue(aged);

    await repo.loadContainers();

    expect(repo.lastContainersChecksum).toBe(baseline);
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('keeps checksum stable when descriptor order changes only', async () => {
    const client = makeClient(containers);
    repo = new ContainerRepository(client);
    await repo.loadContainers();
    const baseline = repo.lastContainersChecksum;

    const reordered = [...containers].reverse();
    client.getContainersDescriptors.mockResolvedValue(reordered);
    await repo.loadContainers();

    expect(repo.lastContainersChecksum).toBe(baseline);
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

  describe('reconciliation across reloads', () => {
    it('reuses the same Container instance (and its view) instead of recreating', async () => {
      repo = new ContainerRepository(makeClient());
      await repo.loadContainers();
      const id = containers[0].Id;
      const container = repo.getContainers()[id];
      const view = repo.getContainerView(id);

      await repo.loadContainers();

      expect(repo.getContainers()[id]).toBe(container);
      expect(repo.getContainerView(id)).toBe(view);
    });

    it('computes CPU across a reload cycle (stats history is preserved)', async () => {
      // Regression: recreating models every reload reset previousStats, so CPU
      // stayed 0. Reconciliation keeps the models, so the second sample counts.
      repo = new ContainerRepository(makeClient());
      await repo.loadContainers();
      await repo.loadContainersStats(); // sample 1
      await repo.loadContainers();      // reload must not wipe the models
      await repo.loadContainersStats(); // sample 2

      expect(repo.getGlobalCpuUsage()).toBeGreaterThan(0);
    });

    it('does not accumulate the network index on identical reloads', async () => {
      repo = new ContainerRepository(makeClient());
      await repo.loadContainers();
      const count = () =>
        Object.values(repo.getNetworks()).reduce((n, arr) => n + arr.length, 0);
      const first = count();

      await repo.loadContainers();

      expect(count()).toBe(first);
    });
  });
});
