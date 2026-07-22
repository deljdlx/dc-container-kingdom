import { describe, it, expect } from 'vitest';
import { handleDockerRequest, makeStats } from '../mock/docker-mock.js';

describe('docker-mock', () => {
  it('serves the container list', () => {
    const res = handleDockerRequest('GET', '/containers/json?all=true');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('produces a ~stable CPU percentage across two successive samples', () => {
    const id = 'container-xyz';
    const t0 = 1_000_000_000_000;
    const a = makeStats(id, t0);
    const b = makeStats(id, t0 + 5000);

    const totalDiff =
      b.cpu_stats.cpu_usage.total_usage - a.cpu_stats.cpu_usage.total_usage;
    const systemDiff =
      b.cpu_stats.system_cpu_usage - a.cpu_stats.system_cpu_usage;
    const cpu = (totalDiff / systemDiff) * b.cpu_stats.online_cpus * 100;

    expect(cpu).toBeGreaterThan(0);
    expect(cpu).toBeLessThan(60);
  });

  it('is deterministic for a given id and clock', () => {
    expect(makeStats('same', 42)).toEqual(makeStats('same', 42));
  });

  it('acks lifecycle actions with 204', () => {
    expect(handleDockerRequest('POST', '/containers/abc/start').status).toBe(204);
    expect(handleDockerRequest('DELETE', '/containers/abc').status).toBe(204);
  });

  it('returns null for unknown routes', () => {
    expect(handleDockerRequest('GET', '/images/json')).toBeNull();
  });
});
