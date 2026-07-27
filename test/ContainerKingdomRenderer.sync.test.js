// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Element } from '../src/engine/index.js';
import { ContainerKingdomRenderer } from '../src/container-kingdom/js/ContainerKingdomRenderer.js';

/**
 * Reconciling the map with the container set: a container that appears gets a
 * house, one that vanishes gives its plot back. The map used to be rebuilt by
 * reloading the whole page, which threw away zoom, panning and the console.
 */
/** Docker ids are 64 hex chars — the placement hashes them into a cell. */
function dockerId(seed) {
  return seed.repeat(64).slice(0, 64);
}

function makeContainer(id, composeName = 'demo') {
  return {
    Id: id,
    State: 'running',
    NetworkSettings: { Networks: { web: {} } },
    rendered: false,
    rpgEngine: { data: { element: null, coords: { x: null, y: null } } },
    getId: () => id,
    getName: () => id,
    getComposeName: () => composeName,
    getMemoryUsage: () => 0,
    getDemoUrl: () => false,
    getElement() { return this.rpgEngine.data.element; },
    setRpgEngineData(data) { this.rpgEngine.data = data; },
  };
}

/** A renderer wired onto a real engine Area, with a stubbed application. */
function makeRenderer(containers) {
  const area = new Element(0, 0, 4000, 4000);
  const state = { containers: new Map(containers.map(c => [c.Id, c])) };

  const application = {
    getContainers: (toArray = false) => (toArray
      ? [...state.containers.values()]
      : Object.fromEntries(state.containers)),
    getComposes: () => {
      const composes = {};
      state.containers.forEach(container => {
        const name = container.getComposeName();
        composes[name] = composes[name] || { getContainers: () => composes[name]._list };
        composes[name]._list = composes[name]._list || [];
        composes[name]._list.push(container);
      });
      return composes;
    },
    getNetworks: () => ({}),
  };

  const viewport = { getBoard: () => ({ getAreaAt: () => area }) };
  return { renderer: new ContainerKingdomRenderer(application, viewport), state, area };
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.spyOn(Math, 'random').mockReturnValue(0.5); // pas d'arbre aléatoire
});

describe('ContainerKingdomRenderer — réconciliation', () => {
  it('draws a house for a container that appears, without touching the others', async () => {
    const { renderer, state } = makeRenderer([makeContainer(dockerId('a1'))]);
    await renderer.drawContainers();
    const premiereMaison = state.containers.get(dockerId('a1')).getElement();

    state.containers.set(dockerId('b2'), makeContainer(dockerId('b2')));
    await renderer.syncContainers();

    expect(state.containers.get(dockerId('b2')).getElement()).toBeTruthy();
    // La maison existante n'est pas retracée : c'est le même élément.
    expect(state.containers.get(dockerId('a1')).getElement()).toBe(premiereMaison);
  });

  it('gives the plot back when a container vanishes', async () => {
    const { renderer, state } = makeRenderer([makeContainer(dockerId('a1')), makeContainer(dockerId('b2'))]);
    await renderer.drawContainers();

    const { x, y } = renderer._placed.get(dockerId('b2'));
    expect(renderer.placement.isOccupied(x, y)).toBe(true);

    state.containers.delete(dockerId('b2'));
    await renderer.syncContainers();

    expect(renderer.placement.isOccupied(x, y)).toBe(false);
    expect(renderer._placed.has(dockerId('b2'))).toBe(false);
  });

  it('keeps the freed plot reusable by the next container', async () => {
    const { renderer, state } = makeRenderer([makeContainer(dockerId('a1'))]);
    await renderer.drawContainers();
    const libre = renderer._placed.get(dockerId('a1'));

    state.containers.delete(dockerId('a1'));
    await renderer.syncContainers();
    expect(renderer.placement.isOccupied(libre.x, libre.y)).toBe(false);

    state.containers.set(dockerId('c3'), makeContainer(dockerId('c3')));
    await renderer.syncContainers();
    expect(renderer._placed.size).toBe(1);
  });

  it('wipes the previous road layer before tracing again', async () => {
    const { renderer } = makeRenderer([makeContainer(dockerId('a1'))]);
    await renderer.drawContainers();
    renderer._networkElements.push({ destroy: vi.fn() });
    const ancienne = renderer._networkElements[0];

    await renderer.syncContainers();

    expect(ancienne.destroy).toHaveBeenCalled();
    expect(renderer._networkElements).not.toContain(ancienne);
  });
});
