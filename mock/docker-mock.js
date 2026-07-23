/**
 * Framework-agnostic mock of the Docker Engine API subset used by the app.
 *
 * Shared by the Vite dev-server middleware (so the app runs without a real
 * Docker daemon) and by the Vitest suite (so `DockerApiClient` can be tested
 * against realistic payloads). Pure functions only — no I/O, no HTTP types.
 */

import containers from './fixtures/containers.json' with { type: 'json' };

const ONLINE_CPUS = 8;

/**
 * Deterministic 32-bit hash of a string. Used to derive stable per-container
 * mock values (memory footprint, CPU target) from a container id.
 * @param {string} value
 * @returns {number} unsigned 32-bit integer
 */
function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * @returns {Array<object>} the captured container descriptors
 */
export function getContainers() {
  return containers;
}

/**
 * Build a Docker-compatible stats payload for a container.
 *
 * `system_cpu_usage` grows monotonically with wall-clock time and
 * `total_usage` is a fixed fraction of it, so two successive calls yield
 * `(totalDiff / systemDiff) * cores * 100 ≈ targetPercent` — the exact formula
 * the app uses in {@link Container#setStats}.
 *
 * @param {string} id container id
 * @param {number} [now] wall-clock ms (injectable for deterministic tests)
 * @returns {object} stats payload
 */
export function makeStats(id, now = Date.now()) {
  const seed = hash(id);
  const targetPercent = 1 + (seed % 4000) / 100; // 1%..41%
  const memoryMb = 20 + (seed % 780); // 20..800 MB

  const systemUsage = now * 1e6 * ONLINE_CPUS;
  const jitter = 1 + (((seed >> 8) % 100) - 50) / 5000; // ±1%
  const totalUsage = (systemUsage * (targetPercent / 100) / ONLINE_CPUS) * jitter;

  return {
    // Real Docker stats carry the container id; the app matches stats to
    // containers by `stats.id`, so the mock must include it too.
    id,
    cpu_stats: {
      cpu_usage: { total_usage: totalUsage },
      system_cpu_usage: systemUsage,
      online_cpus: ONLINE_CPUS,
    },
    memory_stats: { usage: memoryMb * 1024 * 1024 },
  };
}

/**
 * Route a Docker API request to a mock response.
 * @param {string} method HTTP method
 * @param {string} path request path, e.g. `/containers/json` (proxy prefix stripped)
 * @param {number} [now] injectable clock for stats
 * @returns {{status: number, body: (object|string)}|null} response, or null if unmatched
 */
export function handleDockerRequest(method, path, now = Date.now()) {
  const clean = path.split('?')[0].replace(/\/+$/, '');

  if (method === 'GET' && clean === '/containers/json') {
    return { status: 200, body: getContainers() };
  }

  const statsMatch = clean.match(/^\/containers\/([^/]+)\/stats$/);
  if (method === 'GET' && statsMatch) {
    return { status: 200, body: makeStats(statsMatch[1], now) };
  }

  const logsMatch = clean.match(/^\/containers\/([^/]+)\/logs$/);
  if (method === 'GET' && logsMatch) {
    const name = logsMatch[1];
    return {
      status: 200,
      body: [
        `[mock] booting ${name}...`,
        `[mock] ${name} listening`,
        `[mock] ${name} ready`,
      ].join('\n'),
    };
  }

  if (method === 'POST' && /^\/containers\/[^/]+\/(start|stop|restart)$/.test(clean)) {
    return { status: 204, body: '' };
  }

  if (method === 'DELETE' && /^\/containers\/[^/]+$/.test(clean)) {
    return { status: 204, body: '' };
  }

  return null;
}
