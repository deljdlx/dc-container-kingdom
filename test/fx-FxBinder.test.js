import { describe, expect, it } from 'vitest';
import { EngineEvents, Emitter, EventEmitter, FxBinder } from '../src/engine/index.js';

/** A layer double: records bursts, no canvas anywhere. */
const fakeLayer = () => ({ bursts: [], emit(d) { this.bursts.push(d); } });

/** A viewport double: a behaviour list and a transform, nothing more. */
function fakeViewport({ width = 900, height = 560, offsetX = 0, offsetY = 0, scale = 1 } = {}) {
  const behaviors = [];
  return {
    behaviors,
    width: () => width,
    height: () => height,
    addBehavior: (b) => behaviors.push(b),
    removeBehavior: (b) => {
      const index = behaviors.indexOf(b);
      if (index !== -1) behaviors.splice(index, 1);
    },
    getTransform: () => ({
      worldToScreenX: (x) => x * scale + offsetX,
      worldToScreenY: (y) => y * scale + offsetY,
    }),
  };
}

class Spray extends Emitter {
  static descriptor = { count: 1, color: '#0ff' };
  static interval = 100;
}

/** An element double: a scene node with a parent link and an optional descriptor. */
function makeElement(descriptor = null, { x = 0, y = 0 } = {}) {
  const element = {
    _parent: null,
    _children: [],
    offsetX: () => x,
    offsetY: () => y,
    getParent() { return this._parent; },
    getChildren() { return this._children; },
    add(child) { child._parent = this; this._children.push(child); return child; },
    detach() { this._parent = null; },
  };
  if (descriptor) {
    element.constructor = { descriptor };
  }
  return element;
}

const withSpray = (at, position) =>
  makeElement({ fx: [{ emitter: Spray, at }] }, position);

describe('FxBinder - reading the declaration', () => {
  it('wires an emitter for each declared effect', () => {
    const viewport = fakeViewport();
    const binder = new FxBinder({ layer: fakeLayer(), viewport });
    const area = makeElement();
    area.add(withSpray({ x: 24, y: 8 }, { x: 200, y: 430 }));

    expect(binder.bind(area)).toBe(1);
    expect(viewport.behaviors).toHaveLength(1);
    expect(binder.count()).toBe(1);
  });

  it('ignores elements that declare nothing', () => {
    const viewport = fakeViewport();
    const binder = new FxBinder({ layer: fakeLayer(), viewport });
    const area = makeElement();
    area.add(makeElement());
    area.add(makeElement({ width: 32 }));   // a descriptor, but no fx

    expect(binder.bind(area)).toBe(0);
    expect(viewport.behaviors).toHaveLength(0);
  });

  // This is the whole point: the effect belongs to the object, so two fountains
  // spray from their own basins without anyone placing anything.
  it('gives each element its own emitter, anchored locally', () => {
    const layer = fakeLayer();
    const viewport = fakeViewport();
    const binder = new FxBinder({ layer, viewport });
    const area = makeElement();
    area.add(withSpray({ x: 24, y: 8 }, { x: 200, y: 430 }));
    area.add(withSpray({ x: 24, y: 8 }, { x: 640, y: 120 }));

    binder.bind(area);
    viewport.behaviors.forEach(emitter => emitter.update(Spray.interval));

    expect(layer.bursts).toHaveLength(2);
    expect(layer.bursts[0]).toMatchObject({ x: 224, y: 438 });
    expect(layer.bursts[1]).toMatchObject({ x: 664, y: 128 });
  });

  it('walks the whole subtree, not just direct children', () => {
    const viewport = fakeViewport();
    const binder = new FxBinder({ layer: fakeLayer(), viewport });
    const area = makeElement();
    const group = area.add(makeElement());
    group.add(withSpray({ x: 0, y: 0 }, { x: 10, y: 10 }));

    expect(binder.bind(area)).toBe(1);
  });
});

describe('FxBinder - idempotence', () => {
  // The streaming re-walks the board on every area crossing.
  it('does not double the output when the same subtree is bound again', () => {
    const layer = fakeLayer();
    const viewport = fakeViewport();
    const binder = new FxBinder({ layer, viewport });
    const area = makeElement();
    area.add(withSpray({ x: 0, y: 0 }, { x: 100, y: 100 }));

    binder.bind(area);
    expect(binder.bind(area)).toBe(0);
    expect(binder.bind(area)).toBe(0);

    expect(viewport.behaviors).toHaveLength(1);
    viewport.behaviors.forEach(emitter => emitter.update(Spray.interval));
    expect(layer.bursts).toHaveLength(1);
  });
});

describe('FxBinder - the leak, belt one', () => {
  // The defect this ticket exists to avoid: `Element.destroy()` detaches and
  // tells nobody, so an emitter would outlive its area for ever.
  it('leaves the behaviour list exactly as it found it', () => {
    const viewport = fakeViewport();
    const binder = new FxBinder({ layer: fakeLayer(), viewport });
    const area = makeElement();
    area.add(withSpray({ x: 0, y: 0 }, { x: 1, y: 1 }));
    area.add(withSpray({ x: 0, y: 0 }, { x: 2, y: 2 }));
    const before = viewport.behaviors.length;

    binder.bind(area);
    expect(viewport.behaviors).toHaveLength(before + 2);

    expect(binder.unbind(area)).toBe(2);
    expect(viewport.behaviors).toHaveLength(before);
    expect(binder.count()).toBe(0);
  });

  it('can rebind after an unbind, so a reloaded area works again', () => {
    const viewport = fakeViewport();
    const binder = new FxBinder({ layer: fakeLayer(), viewport });
    const area = makeElement();
    area.add(withSpray({ x: 0, y: 0 }, { x: 1, y: 1 }));

    binder.bind(area);
    binder.unbind(area);

    expect(binder.bind(area)).toBe(1);
  });
});

describe('FxBinder - letting go on its own', () => {
  /** The slice of Application the binder uses: a bus, nothing else. */
  class FakeBus {
    _events = new EventEmitter();
    addEventListener(name, callback) { return this._events.on(name, callback); }
    handle(name, data = {}) { this._events.emit(name, data); }
  }

  /** A viewport double that also carries a global bus. */
  function wiredViewport() {
    const application = new FakeBus();
    const viewport = fakeViewport();
    viewport.getApplication = () => application;
    return { viewport, application };
  }

  it('drops a subtree\'s emitters when it announces its destruction', () => {
    const { viewport, application } = wiredViewport();
    const binder = new FxBinder({ layer: fakeLayer(), viewport });
    const area = makeElement();
    area.add(withSpray({ x: 0, y: 0 }, { x: 1, y: 1 }));

    binder.bind(area);
    expect(binder.count()).toBe(1);

    // What `Element.destroy()` emits — no Board involved, and no call to
    // unbind() by hand: that coupling is what this replaces.
    application.handle(EngineEvents.ELEMENT_DESTROY, { source: area, element: area });

    expect(binder.count()).toBe(0);
    expect(viewport.behaviors).toHaveLength(0);
  });

  it('ignores the destruction of something it never bound', () => {
    const { viewport, application } = wiredViewport();
    const binder = new FxBinder({ layer: fakeLayer(), viewport });
    const area = makeElement();
    area.add(withSpray({ x: 0, y: 0 }, { x: 1, y: 1 }));
    binder.bind(area);

    application.handle(EngineEvents.ELEMENT_DESTROY, { source: makeElement() });

    expect(binder.count()).toBe(1);
  });

  it('stops listening once disposed', () => {
    const { viewport, application } = wiredViewport();
    const binder = new FxBinder({ layer: fakeLayer(), viewport });
    const area = makeElement();
    area.add(withSpray({ x: 0, y: 0 }, { x: 1, y: 1 }));
    binder.bind(area);

    binder.dispose();
    application.handle(EngineEvents.ELEMENT_DESTROY, { source: area });

    expect(binder.count()).toBe(1);
    expect(() => binder.dispose()).not.toThrow();
  });

  it('works without a bus at all — a bare viewport double keeps the rest', () => {
    const viewport = fakeViewport();   // no getApplication
    const binder = new FxBinder({ layer: fakeLayer(), viewport });
    const area = makeElement();
    area.add(withSpray({ x: 0, y: 0 }, { x: 1, y: 1 }));

    expect(binder.bind(area)).toBe(1);
    expect(() => binder.dispose()).not.toThrow();
  });
});

describe('Emitter - the leak, belt two', () => {
  // Whatever path destroyed the element, an orphan must stop on its own.
  it('stops for good once its target has no parent', () => {
    const layer = fakeLayer();
    const area = makeElement();
    const element = area.add(makeElement());
    const emitter = new Spray(layer, { follow: element });

    emitter.update(Spray.interval);
    expect(layer.bursts).toHaveLength(1);

    element.detach();
    emitter.update(Spray.interval);
    emitter.update(Spray.interval);

    expect(layer.bursts).toHaveLength(1);
    expect(emitter.isRunning()).toBe(false);
  });

  // Regression 2026-08-02: the guard read "no parent" as "destroyed", and killed
  // every effect following the viewport's own character — which is created by
  // `enableMainCharacter` and never attached to the scene graph.
  it('keeps emitting for a target that never had a parent', () => {
    const layer = fakeLayer();
    const loose = makeElement();                    // never added to anything
    const emitter = new Spray(layer, { follow: loose });

    emitter.update(Spray.interval);
    emitter.update(Spray.interval);

    expect(emitter.isAlive()).toBe(true);
    expect(emitter.isRunning()).toBe(true);
    expect(layer.bursts).toHaveLength(2);
  });

  it('still arms the belt for a target attached after construction', () => {
    const layer = fakeLayer();
    const area = makeElement();
    const element = makeElement();
    const emitter = new Spray(layer, { follow: element });   // built before attaching

    emitter.update(Spray.interval);
    area.add(element);
    emitter.update(Spray.interval);
    element.detach();
    emitter.update(Spray.interval);

    expect(emitter.isRunning()).toBe(false);
    expect(layer.bursts).toHaveLength(2);
  });

  it('leaves an emitter anchored to a fixed point alone', () => {
    const layer = fakeLayer();
    const emitter = new Spray(layer, { at: { x: 5, y: 5 } });

    emitter.update(Spray.interval);

    expect(emitter.isAlive()).toBe(true);
    expect(layer.bursts).toHaveLength(1);
  });
});

describe('FxBinder - culling', () => {
  // The budget is shared and capped: droplets nobody can see would evict the
  // ones being watched.
  it('emits inside the view and stays silent far outside', () => {
    const layer = fakeLayer();
    const viewport = fakeViewport({ width: 900, height: 560 });
    const binder = new FxBinder({ layer, viewport });
    const area = makeElement();
    area.add(withSpray({ x: 0, y: 0 }, { x: 450, y: 280 }));    // centre
    area.add(withSpray({ x: 0, y: 0 }, { x: 5_000, y: 280 }));  // far right

    binder.bind(area);
    viewport.behaviors.forEach(emitter => emitter.update(Spray.interval));

    expect(layer.bursts).toHaveLength(1);
    expect(layer.bursts[0]).toMatchObject({ x: 450 });
  });

  // A droplet lives 1.2s at 90px/s — ~108px of travel. Culling exactly at the
  // edge would keep particles born just off screen from entering the frame.
  it('keeps a margin, so a burst just off screen still shows', () => {
    const viewport = fakeViewport({ width: 900, height: 560 });
    const binder = new FxBinder({ layer: fakeLayer(), viewport });

    expect(binder.isVisible(450, 280)).toBe(true);
    expect(binder.isVisible(-100, 280)).toBe(true);    // within the 128px margin
    expect(binder.isVisible(1_000, 280)).toBe(true);
    expect(binder.isVisible(-200, 280)).toBe(false);
    expect(binder.isVisible(450, 800)).toBe(false);
  });

  it('follows the camera: what was off screen becomes visible once it scrolls', () => {
    const near = new FxBinder({ layer: fakeLayer(), viewport: fakeViewport({ offsetX: 0 }) });
    const scrolled = new FxBinder({ layer: fakeLayer(), viewport: fakeViewport({ offsetX: -1_500 }) });

    expect(near.isVisible(2_000, 280)).toBe(false);
    expect(scrolled.isVisible(2_000, 280)).toBe(true);
  });

  it('accounts for the zoom: half scale brings twice the world into view', () => {
    const full = new FxBinder({ layer: fakeLayer(), viewport: fakeViewport({ scale: 1 }) });
    const zoomedOut = new FxBinder({ layer: fakeLayer(), viewport: fakeViewport({ scale: 0.5 }) });

    expect(full.isVisible(1_600, 280)).toBe(false);
    expect(zoomedOut.isVisible(1_600, 280)).toBe(true);
  });
});
