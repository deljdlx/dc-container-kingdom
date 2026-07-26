// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContainerKingdom } from '../src/container-kingdom/js/ContainerKingdom.js';

describe('ContainerKingdom loop resilience', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('re-arms the next tick even when a refresh step throws', async () => {
    const context = {
      _loopEnabled: true,
      _loopTimeoutId: null,
      repository: {
        loadContainers: vi.fn().mockRejectedValue(new Error('docker down')),
      },
      loadContainersStats: vi.fn(),
      layout: {
        renderContainersList: vi.fn(),
      },
      loop: vi.fn(),
    };

    context.loop.mockImplementation(() =>
      ContainerKingdom.prototype.loop.call(context)
    );

    await ContainerKingdom.prototype.loop.call(context);

    expect(context.repository.loadContainers).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
    expect(context._loopTimeoutId).not.toBeNull();
    expect(context.loadContainersStats).not.toHaveBeenCalled();
  });

  it('stops re-arming when the loop is disabled', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const context = {
      _loopEnabled: false,
      _loopTimeoutId: null,
      repository: {
        loadContainers: vi.fn(),
      },
      loadContainersStats: vi.fn(),
      layout: {
        renderContainersList: vi.fn(),
      },
      loop: vi.fn(),
    };

    await ContainerKingdom.prototype.loop.call(context);

    expect(context.repository.loadContainers).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });
});
