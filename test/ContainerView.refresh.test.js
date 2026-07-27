// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContainerView } from '../src/container-kingdom/js/ContainerView.js';

/**
 * The view mirrors the container's live CPU/memory onto its house on the map.
 * It used to hunt the node down with a document-wide selector that never
 * matched, so the figure stayed frozen at whatever the first render displayed.
 */
function makeHouse() {
  const dom = document.createElement('div');
  dom.innerHTML = '<div class="container__memory-usage">initial</div>';
  return { getDom: () => dom };
}

function makeContainer(house, { memory = '128 MB', cpu = 'xs' } = {}) {
  return {
    getId: () => 'abc123',
    getElement: () => house,
    getMemoryUsage: () => memory,
    getCpuUsageThreshold: () => ({ css: cpu }),
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('ContainerView — refresh', () => {
  it('writes the memory figure onto the house', () => {
    const house = makeHouse();
    const view = new ContainerView(makeContainer(house));

    view.refresh();

    expect(house.getDom().querySelector('.container__memory-usage').innerHTML)
      .toBe('128 MB');
    expect(house.getDom().dataset.cpuUsage).toBe('xs');
  });

  it('finds the node inside its own house, not through the document', () => {
    // A decoy elsewhere in the page must not be touched: the view addresses the
    // node it owns, so a class renamed somewhere else cannot break it.
    const decoy = document.createElement('div');
    decoy.innerHTML = '<div class="container__memory-usage">decoy</div>';
    document.body.append(decoy);

    const house = makeHouse();
    new ContainerView(makeContainer(house)).refresh();

    expect(decoy.querySelector('.container__memory-usage').innerHTML).toBe('decoy');
  });

  it('is harmless before the container has a house on the map', () => {
    const view = new ContainerView({
      getId: () => 'abc123',
      getElement: () => null,
      getMemoryUsage: () => '1 MB',
      getCpuUsageThreshold: () => ({ css: 'xxs' }),
    });

    expect(() => view.refresh()).not.toThrow();
  });

  it('schedules no timer of its own', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const view = new ContainerView(makeContainer(makeHouse()));
    view.refresh();

    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });
});
