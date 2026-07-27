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

  // A failed reconciliation keeps the last known map on screen; the loop must
  // say so rather than let the user read frozen figures as live ones.
  it('flags the outage and leaves the map alone when reconciliation fails', async () => {
    const context = {
      _loopEnabled: true,
      _loopTimeoutId: null,
      _dockerReachable: true,
      repository: {
        loadContainers: vi.fn().mockResolvedValue(false),
      },
      loadContainersStats: vi.fn(),
      layout: {
        renderContainersList: vi.fn(),
      },
      hud: {
        renderConnectionStatus: vi.fn(),
      },
      _setDockerReachable: ContainerKingdom.prototype._setDockerReachable,
      loop: vi.fn(),
    };

    await ContainerKingdom.prototype.loop.call(context);

    expect(context.hud.renderConnectionStatus).toHaveBeenCalledWith(false);
    expect(context.loadContainersStats).not.toHaveBeenCalled();
    expect(context.layout.renderContainersList).not.toHaveBeenCalled();
    expect(context._loopTimeoutId).not.toBeNull();
  });

  it('reports the daemon as reachable again once a tick succeeds', async () => {
    const context = {
      _loopEnabled: true,
      _loopTimeoutId: null,
      _dockerReachable: false,
      repository: {
        loadContainers: vi.fn().mockResolvedValue(true),
      },
      loadContainersStats: vi.fn().mockResolvedValue(true),
      layout: {
        renderContainersList: vi.fn(),
      },
      hud: {
        renderConnectionStatus: vi.fn(),
      },
      _setDockerReachable: ContainerKingdom.prototype._setDockerReachable,
      loop: vi.fn(),
    };

    await ContainerKingdom.prototype.loop.call(context);

    expect(context.hud.renderConnectionStatus).toHaveBeenCalledWith(true);
    expect(context.layout.renderContainersList).toHaveBeenCalled();
  });

  it('redraws the status only when it changes', async () => {
    const hud = { renderConnectionStatus: vi.fn() };
    const context = { _dockerReachable: true, hud };

    ContainerKingdom.prototype._setDockerReachable.call(context, true);
    expect(hud.renderConnectionStatus).not.toHaveBeenCalled();

    ContainerKingdom.prototype._setDockerReachable.call(context, false);
    ContainerKingdom.prototype._setDockerReachable.call(context, false);
    expect(hud.renderConnectionStatus).toHaveBeenCalledTimes(1);
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
