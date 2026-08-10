// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application, Element, Viewport } from '../src/engine/index.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

function createViewport() {
  let viewport;
  const application = { handle: vi.fn(), getViewport: () => viewport };
  Application.mainInstance = application;
  viewport = new Viewport(application, document.querySelector('#app'), 900, 560);

  return viewport;
}

/** A solid body at a world position, on the given layer. */
function bodyAt(viewport, x, y, layer = undefined, name = `${x}-${y}-${layer}`) {
  const element = new Element(0, 0, 32, 32);
  element.createCollisionZone(0, 0, 20, 20, 'collision', { layer });
  viewport.getBoard().getAreaAt(0, 0).addElement(x, y, element, name);

  return element;
}

/** A detector sitting on top of everything, with the mask under test. */
function detectorAt(viewport, x, y, mask = null) {
  const detector = new Element(0, 0, 32, 32);
  detector.createCollisionZone(0, 0, 20, 20, 'collision', { layer: 'detector', mask });
  viewport.getBoard().getAreaAt(0, 0).addElement(x, y, detector, `detector-${x}-${y}`);

  return detector;
}

describe('collision layers', () => {
  it('touches everything when no mask is given — nothing changes for a host that ignores layers', () => {
    const viewport = createViewport();
    bodyAt(viewport, 100, 100, 'enemy');
    bodyAt(viewport, 100, 100, 'wall', 'wall-1');
    const detector = detectorAt(viewport, 100, 100);

    expect(detector.overlaps(viewport.getBoard())).toBe(true);
    expect(detector.getCollision(viewport.getBoard())).toHaveLength(2);
  });

  it('only sees the layers its mask names', () => {
    const viewport = createViewport();
    const wall = bodyAt(viewport, 100, 100, 'wall');
    bodyAt(viewport, 100, 100, 'enemy', 'enemy-1');
    const detector = detectorAt(viewport, 100, 100, ['wall']);

    const hits = detector.getCollision(viewport.getBoard());

    expect(hits).toEqual([wall]);
  });

  it('sees nothing at all when its mask names no one present', () => {
    const viewport = createViewport();
    bodyAt(viewport, 100, 100, 'enemy');
    const detector = detectorAt(viewport, 100, 100, ['wall']);

    expect(detector.overlaps(viewport.getBoard())).toBe(false);
  });

  it('gives an unlabelled zone the default layer, which a mask can name', () => {
    const viewport = createViewport();
    const plain = bodyAt(viewport, 100, 100);
    const detector = detectorAt(viewport, 100, 100, ['default']);

    expect(detector.getCollision(viewport.getBoard())).toEqual([plain]);
  });

  it('tests pair by pair: two bodies on one element do not share a mask', () => {
    const viewport = createViewport();
    bodyAt(viewport, 100, 100, 'enemy');
    const wall = bodyAt(viewport, 100, 100, 'wall', 'wall-1');

    // One zone that only sees walls, another that sees nothing present.
    const detector = new Element(0, 0, 32, 32);
    detector.createCollisionZone(0, 0, 20, 20, 'collision', { layer: 'body', mask: ['wall'] });
    detector.createCollisionZone(0, 0, 20, 20, 'collision', { layer: 'body', mask: ['loot'] });
    viewport.getBoard().getAreaAt(0, 0).addElement(100, 100, detector, 'two-zones');

    expect(detector.getCollision(viewport.getBoard())).toEqual([wall]);
  });

  describe('the layer union that prunes', () => {
    it('climbs from a zone to every ancestor', () => {
      const viewport = createViewport();
      bodyAt(viewport, 100, 100, 'enemy');

      expect(viewport.getBoard().getAreaAt(0, 0).getLayers().has('enemy')).toBe(true);
      expect(viewport.getBoard().getLayers().has('enemy')).toBe(true);
    });

    it('skips a whole subtree whose layers no one is looking for', () => {
      const viewport = createViewport();
      const area = viewport.getBoard().getAreaAt(0, 0);
      bodyAt(viewport, 100, 100, 'enemy');
      const detector = detectorAt(viewport, 100, 100, ['wall']);

      // The area is never descended: its union holds no 'wall'.
      const descended = vi.spyOn(area, 'getChildren');
      detector.overlaps(viewport.getBoard());

      expect(area.getLayers().has('wall')).toBe(false);
      expect(descended).not.toHaveBeenCalled();
    });

    it('is rebuilt when a child leaves', () => {
      const viewport = createViewport();
      const enemy = bodyAt(viewport, 100, 100, 'enemy');
      const area = viewport.getBoard().getAreaAt(0, 0);
      expect(area.getLayers().has('enemy')).toBe(true);

      enemy.destroy();

      expect(area.getLayers().has('enemy')).toBe(false);
    });
  });

  describe('querying the world', () => {
    it('finds only what the mask names', () => {
      const viewport = createViewport();
      const board = viewport.getBoard();
      bodyAt(viewport, 100, 100, 'enemy');
      const wall = bodyAt(viewport, 100, 100, 'wall', 'wall-1');
      const rect = { x0: 100, y0: 100, x1: 130, y1: 130 };

      expect(board.query(rect)).toHaveLength(2);
      expect(board.query(rect, { mask: ['wall'] })).toEqual([wall]);
      expect(board.query(rect, { mask: ['loot'] })).toEqual([]);
    });

    it('sweeps past what it is not looking for', () => {
      const viewport = createViewport();
      const board = viewport.getBoard();
      bodyAt(viewport, 200, 100, 'player');

      const through = board.sweep({ x: 100, y: 105 }, { x: 400, y: 105 }, { width: 8, height: 8 }, {
        mask: ['enemy'],
      });
      const into = board.sweep({ x: 100, y: 105 }, { x: 400, y: 105 }, { width: 8, height: 8 }, {
        mask: ['player'],
      });

      expect(through).toBeNull();
      expect(into).not.toBeNull();
    });
  });
});
