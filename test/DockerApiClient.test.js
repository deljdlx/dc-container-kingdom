import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleDockerRequest } from '../mock/docker-mock.js';
import { DockerApiClient } from '../src/container-kingdom/assets/js/DockerApiClient.js';

/**
 * Wire global fetch to the shared Docker mock, so the client is exercised
 * against the exact payloads the dev server serves.
 */
function installMockFetch() {
  vi.stubGlobal('fetch', async (url, options = {}) => {
    const method = options.method ?? 'GET';
    const path = new URL(url, 'http://local').pathname.replace(/^\/api\/docker/, '');
    const search = new URL(url, 'http://local').search;
    const result = handleDockerRequest(method, path + search, 0);

    if (!result) {
      return new Response('not found', { status: 404 });
    }
    const body =
      typeof result.body === 'string' ? result.body : JSON.stringify(result.body);
    return new Response(result.status === 204 ? null : body, { status: result.status });
  });
}

describe('DockerApiClient', () => {
  let client;

  beforeEach(() => {
    installMockFetch();
    client = new DockerApiClient();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches all container descriptors', async () => {
    const containers = await client.getContainersDescriptors();
    expect(Array.isArray(containers)).toBe(true);
    expect(containers.length).toBeGreaterThan(0);
    expect(containers[0]).toHaveProperty('Id');
    expect(containers[0]).toHaveProperty('Names');
  });

  it('returns an empty array on network failure instead of throwing', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('network down');
    });
    await expect(client.getContainersDescriptors()).resolves.toEqual([]);
  });

  it('loads stats with the fields the app relies on', async () => {
    const { Id } = (await client.getContainersDescriptors())[0];
    const stats = await client.loadContainerStats(Id);
    expect(stats.cpu_stats.cpu_usage.total_usage).toBeTypeOf('number');
    expect(stats.cpu_stats.system_cpu_usage).toBeTypeOf('number');
    expect(stats.cpu_stats.online_cpus).toBeTypeOf('number');
    expect(stats.memory_stats.usage).toBeTypeOf('number');
  });

  it('aggregates stats for every running container', async () => {
    const descriptors = await client.getContainersDescriptors();
    const stats = await client.getAllContainersStats();
    expect(stats.length).toBe(descriptors.length);
  });

  it('starts a container and resolves the response', async () => {
    const response = await client.startContainer('abc123');
    expect(response.status).toBe(204);
  });

  it('propagates an error when destroying an unknown route fails', async () => {
    vi.stubGlobal('fetch', async () => new Response('nope', { status: 500 }));
    await expect(client.destroyContainer('abc123')).rejects.toThrow();
  });
});
