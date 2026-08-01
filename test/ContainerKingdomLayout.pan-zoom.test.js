// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { ContainerKingdomLayout } from '../src/container-kingdom/js/ContainerKingdomLayout.js';
import { ViewportTransform } from '../src/engine/index.js';

/**
 * Characterization tests for the map's pan / zoom, written **before** the
 * world↔screen transform is extracted (ticket 2026-08-01_21-51). They lock the
 * observable behaviour — the exact CSS transform produced by each gesture — so
 * the refactor can be judged by "the suite stays green without touching an
 * assertion", per `refactor-safely`.
 *
 * They are deliberately written against the public gesture surface
 * (`makeViewportDraggable`, `makeViewportZoomable`, `zoom`), not against the
 * internals they will move.
 */

/** jsdom has PointerEvent but no pointer capture — the handler calls it. */
function buildDom() {
  document.body.innerHTML = '<div id="viewport"><div id="board"></div></div>';
  const viewport = document.querySelector('#viewport');
  viewport.setPointerCapture = () => {};
  viewport.releasePointerCapture = () => {};
  return { viewport, board: document.querySelector('#board') };
}

function createLayout() {
  // The constructor only stores the application and queries an absent node.
  const layout = new ContainerKingdomLayout({});
  // Pan and zoom now live in the engine's shared transform; the gestures reach
  // it through the viewport. Only the setup changed — no assertion below moved.
  const transform = new ViewportTransform();
  layout.rpgEngine = { getViewport: () => ({ getTransform: () => transform }) };
  return layout;
}

const pointer = (target, type, { id = 1, x = 0, y = 0 }) =>
  target.dispatchEvent(new PointerEvent(type, {
    pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true,
  }));

describe('pan/zoom - programmatic zoom', () => {
  beforeEach(buildDom);

  it('scales the board from its top-left corner', () => {
    const { board } = buildDom();
    const layout = createLayout();

    layout.zoom(0.5);

    expect(board.style.transform).toBe('translate(0px, 0px) scale(0.5)');
    expect(board.style.transformOrigin).toBe('0 0');
  });

  it('clears any left/top the engine may have written', () => {
    const { board } = buildDom();
    board.style.left = '20px';
    board.style.top = '30px';
    const layout = createLayout();

    layout.zoom(2);

    expect(board.style.left).toBe('');
    expect(board.style.top).toBe('');
  });
});

describe('pan/zoom - dragging', () => {
  it('translates the board by the pointer delta', () => {
    const { viewport, board } = buildDom();
    const layout = createLayout();
    layout.makeViewportDraggable();

    pointer(viewport, 'pointerdown', { x: 100, y: 100 });
    pointer(viewport, 'pointermove', { x: 150, y: 130 });

    expect(board.style.transform).toBe('translate(50px, 30px) scale(1)');
  });

  // A 5px dead zone keeps a tap from nudging the map — and lets the click
  // through to the container underneath.
  it('ignores a move under the 5px threshold', () => {
    const { viewport, board } = buildDom();
    const layout = createLayout();
    layout.makeViewportDraggable();

    pointer(viewport, 'pointerdown', { x: 100, y: 100 });
    pointer(viewport, 'pointermove', { x: 103, y: 103 });

    expect(board.style.transform).toBe('');
  });

  it('accumulates across successive drags', () => {
    const { viewport, board } = buildDom();
    const layout = createLayout();
    layout.makeViewportDraggable();

    pointer(viewport, 'pointerdown', { x: 0, y: 0 });
    pointer(viewport, 'pointermove', { x: 40, y: 0 });
    pointer(viewport, 'pointerup', { x: 40, y: 0 });

    pointer(viewport, 'pointerdown', { x: 0, y: 0 });
    pointer(viewport, 'pointermove', { x: 0, y: 25 });

    expect(board.style.transform).toBe('translate(40px, 25px) scale(1)');
  });

  it('keeps panning at a scale other than 1, without touching the scale', () => {
    const { viewport, board } = buildDom();
    const layout = createLayout();
    layout.zoom(0.5);
    layout.makeViewportDraggable();

    pointer(viewport, 'pointerdown', { x: 0, y: 0 });
    pointer(viewport, 'pointermove', { x: 60, y: 20 });

    expect(board.style.transform).toBe('translate(60px, 20px) scale(0.5)');
  });
});

describe('pan/zoom - wheel', () => {
  const wheel = (target, { x, y, deltaY }) =>
    target.dispatchEvent(new WheelEvent('wheel', {
      clientX: x, clientY: y, deltaY, bubbles: true, cancelable: true,
    }));

  it('zooms in by a 0.05 step', () => {
    const { viewport, board } = buildDom();
    const layout = createLayout();
    layout.makeViewportZoomable();

    wheel(viewport, { x: 0, y: 0, deltaY: -1 });

    expect(board.style.transform).toBe('translate(0px, 0px) scale(1.05)');
  });

  // The point under the cursor must not move while the scale changes.
  it('keeps the world point under the cursor fixed', () => {
    const { viewport, board } = buildDom();
    const layout = createLayout();
    layout.makeViewportZoomable();

    wheel(viewport, { x: 400, y: 300, deltaY: -1 });

    // world under the cursor before: (400 - 0) / 1 = 400
    // pan after: 400 - 400 × 1.05 = -20
    expect(board.style.transform).toBe('translate(-20px, -15px) scale(1.05)');
  });

  it('clamps the scale between 0.1 and 3', () => {
    const { viewport, board } = buildDom();
    const layout = createLayout();
    layout.zoom(3);
    layout.makeViewportZoomable();

    wheel(viewport, { x: 0, y: 0, deltaY: -1 });

    expect(board.style.transform).toBe('translate(0px, 0px) scale(3)');
  });
});

describe('pan/zoom - pinch', () => {
  it('scales by the ratio of finger distances, anchored on the midpoint', () => {
    const { viewport, board } = buildDom();
    const layout = createLayout();
    layout.makeViewportDraggable();

    pointer(viewport, 'pointerdown', { id: 1, x: 100, y: 200 });
    pointer(viewport, 'pointerdown', { id: 2, x: 300, y: 200 });   // dist 200, mid (200,200)
    pointer(viewport, 'pointermove', { id: 2, x: 500, y: 200 });   // dist 400, mid (300,200)

    // scale ×2; world midpoint before = (200,200); pan = mid - world × scale
    expect(board.style.transform).toBe('translate(-100px, -200px) scale(2)');
  });

  it('does not pan while two fingers are down', () => {
    const { viewport, board } = buildDom();
    const layout = createLayout();
    layout.makeViewportDraggable();

    pointer(viewport, 'pointerdown', { id: 1, x: 100, y: 100 });
    pointer(viewport, 'pointerdown', { id: 2, x: 200, y: 100 });
    const afterPinchStart = board.style.transform;
    pointer(viewport, 'pointerup', { id: 2, x: 200, y: 100 });
    pointer(viewport, 'pointermove', { id: 1, x: 160, y: 100 });

    // The single-pointer pan resumes only from a fresh pointerdown.
    expect(board.style.transform).toBe(afterPinchStart);
  });
});
