// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { ContainerKingdom } from '../src/container-kingdom/js/ContainerKingdom.js';

/**
 * Refreshing the kingdom must both reconcile *and* paint. Elements added after
 * start-up live in the scene graph with no DOM of their own until the viewport
 * renders: skip that step and the map silently stops changing — houses and
 * roads exist, invisible.
 */
function makeContext() {
  const render = vi.fn().mockResolvedValue(undefined);
  return {
    ordre: [],
    viewer: { syncContainers: vi.fn().mockResolvedValue(undefined) },
    layout: { getViewport: () => ({ render }) },
    hud: { drawNetworksSwitches: vi.fn() },
    _render: render,
  };
}

describe('ContainerKingdom — refreshKingdom', () => {
  it('paints the viewport after reconciling', async () => {
    const context = makeContext();
    context.viewer.syncContainers.mockImplementation(async () => context.ordre.push('sync'));
    context._render.mockImplementation(async () => context.ordre.push('render'));

    await ContainerKingdom.prototype.refreshKingdom.call(context);

    expect(context.ordre).toEqual(['sync', 'render']);
  });

  it('redraws the network switches', async () => {
    const context = makeContext();
    await ContainerKingdom.prototype.refreshKingdom.call(context);

    expect(context.hud.drawNetworksSwitches).toHaveBeenCalled();
  });

  it('never reloads the page', async () => {
    const context = makeContext();
    await ContainerKingdom.prototype.refreshKingdom.call(context);

    // Rien à assurer de plus qu'une absence : le rechargement était la seule
    // façon dont la carte se remettait à jour, et il emportait zoom et console.
    expect(ContainerKingdom.prototype.refreshKingdom.toString()).not.toContain('reload');
  });
});
