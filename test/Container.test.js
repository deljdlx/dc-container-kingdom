import { describe, it, expect, vi } from 'vitest';
import { Container } from '../src/container-kingdom/assets/js/Container.js';
import { makeStats } from '../mock/docker-mock.js';
import containers from '../mock/fixtures/containers.json' with { type: 'json' };

const descriptor = containers[0];

/** A Container built from real fixture data, with a stub Docker client. */
function makeContainer(overrides = {}, client = {}) {
  return new Container(client, { ...descriptor, ...overrides });
}

describe('Container (domain model)', () => {
  it('exposes descriptor fields through getters', () => {
    const c = makeContainer();
    expect(c.getId()).toBe(descriptor.Id);
    expect(c.getName()).toBe(descriptor.Names[0]);
    expect(c.getStatus()).toBe(descriptor.Status);
    expect(c.getImage()).toBe(descriptor.Image);
    expect(c.getComposeName()).toBe(descriptor.Labels['com.docker.compose.project']);
    expect(c.getNetworks()).toEqual(Object.keys(descriptor.NetworkSettings.Networks));
  });

  it('reports running state from State', () => {
    expect(makeContainer({ State: 'running' }).isRunning()).toBe(true);
    expect(makeContainer({ State: 'exited' }).isRunning()).toBe(false);
  });

  it('does not touch the DOM on construction (pure model)', () => {
    // No document in the node test env; constructing must not throw.
    expect(() => makeContainer()).not.toThrow();
    expect(typeof globalThis.document).toBe('undefined');
  });

  describe('CPU usage', () => {
    it('stays 0 until two samples are seen', () => {
      const c = makeContainer();
      c.setStats(makeStats(c.getId(), 1_000_000_000_000));
      expect(c.getCpuUsage()).toBe(0);
    });

    it('computes a percentage from two successive samples', () => {
      const c = makeContainer();
      const t0 = 1_000_000_000_000;
      c.setStats(makeStats(c.getId(), t0));
      c.setStats(makeStats(c.getId(), t0 + 5000));
      expect(c.getCpuUsage()).toBeGreaterThan(0);
      expect(c.getCpuUsage()).toBeLessThan(60);
    });
  });

  describe('memory usage', () => {
    it('returns N/A / 0 when no stats', () => {
      const c = makeContainer();
      expect(c.getMemoryUsage(true)).toBe('N/A');
      expect(c.getMemoryUsage()).toBe(0);
    });

    it('formats bytes as MB when human-readable', () => {
      const c = makeContainer();
      c.setStats({ memory_stats: { usage: 100 * 1024 * 1024 } });
      expect(c.getMemoryUsage()).toBe(100 * 1024 * 1024);
      expect(c.getMemoryUsage(true)).toBe('100.00 MB');
    });
  });

  describe('getCpuUsageThreshold', () => {
    it('maps low usage to the smallest bucket', () => {
      const c = makeContainer();
      expect(c.getCpuUsageThreshold().css).toBe('xxs');
    });

    it('maps very high usage to critical', () => {
      const c = makeContainer();
      c.cpuUsage = 95;
      expect(c.getCpuUsageThreshold().css).toBe('critical');
    });
  });

  describe('getDemoUrl', () => {
    it('extracts the host from a Traefik Host(...) label', () => {
      const c = makeContainer({
        Labels: { 'traefik.http.routers.x.rule': 'Host(`demo.example.com`)' },
      });
      expect(c.getDemoUrl()).toBe('demo.example.com');
    });

    it('returns false when no Host label is present', () => {
      const c = makeContainer({ Labels: { foo: 'bar' } });
      expect(c.getDemoUrl()).toBe(false);
    });
  });

  describe('getChecksum', () => {
    it('is stable for identical descriptors', async () => {
      const a = await makeContainer().getChecksum();
      const b = await makeContainer().getChecksum();
      expect(a).toBe(b);
      expect(a).toMatch(/^[0-9a-f]{64}$/);
    });

    it('changes when a tracked field changes', async () => {
      const a = await makeContainer().getChecksum();
      const b = await makeContainer({ State: 'exited' }).getChecksum();
      expect(a).not.toBe(b);
    });
  });

  describe('actions delegate to the Docker client', () => {
    it('start() calls startContainer with the id', async () => {
      const client = { startContainer: vi.fn().mockResolvedValue('ok') };
      await makeContainer({}, client).start();
      expect(client.startContainer).toHaveBeenCalledWith(descriptor.Id);
    });

    it('destroy() calls destroyContainer with the id', async () => {
      const client = { destroyContainer: vi.fn().mockResolvedValue('ok') };
      await makeContainer({}, client).destroy();
      expect(client.destroyContainer).toHaveBeenCalledWith(descriptor.Id);
    });
  });
});
