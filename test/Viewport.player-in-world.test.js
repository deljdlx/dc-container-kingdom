// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application, Element, Viewport } from '../src/engine/index.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

/** A viewport wired to a minimal application, as the other Viewport tests do. */
function createViewport(width = 900, height = 560) {
  let viewport;
  const application = {
    handle: vi.fn(),
    getViewport: () => viewport,
  };
  Application.mainInstance = application;
  viewport = new Viewport(application, document.querySelector('#app'), width, height);

  return viewport;
}

/**
 * A solid element whose **body** lands at the given world position — a
 * `Character` carries its body at (16, 24) inside its sprite, so placing an NPC
 * «at the player» means placing its zone where the player's zone is.
 */
function npcWithBodyAt(viewport, x, y) {
  const npc = new Element(0, 0, 32, 32);
  npc.createCollisionZone(0, 0, 14, 12);
  viewport.getBoard().getAreaAt(0, 0).addElement(x, y, npc, `npc-${x}-${y}`);

  return npc;
}

/** @returns {{x: number, y: number}} where the player's body sits in the world */
function playerBody(viewport) {
  const zone = viewport.getCharacter().getCollisionZones('collision')[0].offsets();

  return { x: zone.x0, y: zone.y0 };
}

describe('the player is part of the world', () => {
  it('joins the scene graph instead of floating outside it', () => {
    const viewport = createViewport();
    viewport.enableMainCharacter(300, 200);

    const player = viewport.getCharacter();
    expect(player.getParent()).toBeTruthy();
    expect(viewport.getBoard().getEntities()).toContain(player);
  });

  it('keeps its world coordinates', () => {
    const viewport = createViewport();
    viewport.enableMainCharacter(300, 200);

    // The entity layer sits at the board's origin, so nothing shifts — the
    // camera and the painter's depth both read these offsets.
    expect(viewport.getCharacter().offsetX()).toBe(300);
    expect(viewport.getCharacter().offsetY()).toBe(200);
  });

  it('lets an NPC detect the player WITHOUT naming it', () => {
    const viewport = createViewport();
    viewport.enableMainCharacter(300, 200);
    const body = playerBody(viewport);
    const npc = npcWithBodyAt(viewport, body.x, body.y);

    // The whole point: asking the world is enough. Before, `overlaps(board)`
    // could not see the player, and every behaviour had to keep a reference to
    // it — or forget to, and walk through.
    expect(npc.overlaps(npc.getBoard())).toBe(true);
  });

  it('does not report a hit for an NPC standing elsewhere', () => {
    const viewport = createViewport();
    viewport.enableMainCharacter(300, 200);
    const npc = npcWithBodyAt(viewport, 700, 500);

    expect(npc.overlaps(npc.getBoard())).toBe(false);
  });

  it('does not let the player detect itself', () => {
    const viewport = createViewport();
    viewport.enableMainCharacter(300, 200);

    // It is in the tree the detection walks, so this is a real risk, not a
    // theoretical one.
    expect(viewport.getCharacter().overlaps(viewport.getBoard())).toBe(false);
  });

  it('is blocked by an NPC standing in the way', () => {
    const viewport = createViewport();
    viewport.enableMainCharacter(300, 200);
    const body = playerBody(viewport);
    // Just south of the player's body, close enough that a 10 px step lands on it.
    npcWithBodyAt(viewport, body.x, body.y + 8);

    const before = viewport.getCharacter().y();
    viewport.moveCharacter(0, 10);

    expect(viewport.getCharacter().y()).toBe(before);
  });

  it('follows the entity layer through area streaming', () => {
    const viewport = createViewport();
    viewport.enableMainCharacter(300, 200);
    const player = viewport.getCharacter();

    viewport.getBoard().loadArea(0, 0);
    viewport.getBoard().freeArea(0, 0);

    // The player belongs to no tile, so streaming must never take it.
    expect(viewport.getBoard().getEntities()).toContain(player);
    expect(player.getParent()).toBeTruthy();
  });
});
