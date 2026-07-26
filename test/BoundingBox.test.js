import { describe, it, expect, vi } from 'vitest';
import { BoundingBox } from '../src/engine/map/BoundingBox.js';

function createElementStub({ x = 0, y = 0, width = 0, height = 0, offsetX = 0, offsetY = 0 } = {}) {
  return {
    x: () => x,
    y: () => y,
    width: () => width,
    height: () => height,
    offsetX: () => offsetX,
    offsetY: () => offsetY,
  };
}

describe('BoundingBox - construction and basic accessors', () => {
  it('seeds corners from the constructor element', () => {
    const box = new BoundingBox(createElementStub({ x: 10, y: 20, width: 30, height: 40 }));

    expect(box.x0()).toBe(10);
    expect(box.y0()).toBe(20);
    expect(box.x1()).toBe(40);
    expect(box.y1()).toBe(60);
    expect(box.isUndefined()).toBe(false);
  });

  it('supports corner setters/getters and width/height derived values', () => {
    const box = new BoundingBox(createElementStub());

    box.x0(2);
    box.y0(3);
    box.x1(12);
    box.y1(23);

    expect(box.x0()).toBe(2);
    expect(box.y0()).toBe(3);
    expect(box.x1()).toBe(12);
    expect(box.y1()).toBe(23);
    expect(box.width()).toBe(10);
    expect(box.height()).toBe(20);
  });

  it('sets width from x0 and sets height from y0', () => {
    const box = new BoundingBox(createElementStub());
    box.x0(7);
    box.y0(11);

    box.width(9);
    box.height(13);

    expect(box.x1()).toBe(16);
    expect(box.y1()).toBe(24);
    expect(box.width()).toBe(9);
    expect(box.height()).toBe(13);
  });

  it('keeps current height when height is set to zero (current behavior)', () => {
    const box = new BoundingBox(createElementStub());
    box.y0(5);
    box.y1(17);

    box.height(0);

    expect(box.y1()).toBe(17);
    expect(box.height()).toBe(12);
  });
});

describe('BoundingBox - collision state and world offsets', () => {
  it('stores collision flag and toggles debug class when dom is present', () => {
    const box = new BoundingBox(createElementStub());
    const toggle = vi.fn();
    box.dom = { classList: { toggle } };

    box.collided(true);
    expect(box.collided()).toBe(true);
    expect(toggle).toHaveBeenCalledWith('collided', true);

    box.collided(false);
    expect(box.collided()).toBe(false);
    expect(toggle).toHaveBeenCalledWith('collided', false);
  });

  it('computes world-space offsets from local corners and element offsets', () => {
    const box = new BoundingBox(createElementStub({ offsetX: 100, offsetY: -20 }));
    box.x0(1);
    box.x1(4);
    box.y0(10);
    box.y1(14);

    expect(box.offsetX0()).toBe(101);
    expect(box.offsetX1()).toBe(104);
    expect(box.offsetY0()).toBe(-10);
    expect(box.offsetY1()).toBe(-6);
    expect(box.offsets()).toEqual({ x0: 101, x1: 104, y0: -10, y1: -6 });
  });
});

describe('BoundingBox - box growth helpers', () => {
  it('grows to include another bounding box', () => {
    const box = new BoundingBox(createElementStub());
    box.x0(10);
    box.x1(20);
    box.y0(10);
    box.y1(20);

    const incoming = new BoundingBox(createElementStub());
    incoming.x0(8);
    incoming.x1(25);
    incoming.y0(11);
    incoming.y1(19);

    const returned = box.updateWithBoundingBox(incoming);

    expect(returned).toBe(box);
    expect(box.x0()).toBe(8);
    expect(box.x1()).toBe(25);
    expect(box.y0()).toBe(10);
    expect(box.y1()).toBe(20);
  });

  it('initializes an undefined box from incoming coordinates', () => {
    const box = new BoundingBox();

    const incoming = new BoundingBox(createElementStub());
    incoming.x0(1);
    incoming.x1(2);
    incoming.y0(3);
    incoming.y1(4);

    box.updateWithBoundingBox(incoming);

    expect(box.x0()).toBe(1);
    expect(box.x1()).toBe(2);
    expect(box.y0()).toBe(3);
    expect(box.y1()).toBe(4);
  });

  it('updates parent collision box from child box + child local position', () => {
    const parentBox = new BoundingBox(createElementStub());
    parentBox.x0(0);
    parentBox.x1(10);
    parentBox.y0(0);
    parentBox.y1(10);

    const childBox = new BoundingBox(createElementStub());
    childBox.x0(-1);
    childBox.x1(8);
    childBox.y0(2);
    childBox.y1(15);

    const childElement = {
      x: () => 5,
      y: () => -3,
      getCollisionBoundingBox: () => childBox,
    };

    parentBox.updateWithRelativeElement(childElement);

    expect(parentBox.x0()).toBe(0);
    expect(parentBox.x1()).toBe(13);
    expect(parentBox.y0()).toBe(-1);
    expect(parentBox.y1()).toBe(12);
  });

  it('ignores null child corners in relative updates', () => {
    const parentBox = new BoundingBox(createElementStub());
    parentBox.x0(1);
    parentBox.x1(2);
    parentBox.y0(3);
    parentBox.y1(4);

    const childBox = new BoundingBox();

    const childElement = {
      x: () => 10,
      y: () => 10,
      getCollisionBoundingBox: () => childBox,
    };

    parentBox.updateWithRelativeElement(childElement);

    expect(parentBox.x0()).toBe(1);
    expect(parentBox.x1()).toBe(2);
    expect(parentBox.y0()).toBe(3);
    expect(parentBox.y1()).toBe(4);
  });
});

describe('BoundingBox - overlap checks', () => {
  it('returns false when one box is undefined', () => {
    const a = new BoundingBox();
    const b = new BoundingBox(createElementStub());

    b.x0(0);
    b.x1(5);
    b.y0(0);
    b.y1(5);

    expect(a.isCollided(b)).toBe(false);
    expect(b.isCollided(a)).toBe(false);
  });

  it('detects overlap, including edge touch, in world space', () => {
    const a = new BoundingBox(createElementStub({ offsetX: 10, offsetY: 10 }));
    a.x0(0);
    a.x1(10);
    a.y0(0);
    a.y1(10);

    const b = new BoundingBox(createElementStub({ offsetX: 20, offsetY: 20 }));
    b.x0(0);
    b.x1(5);
    b.y0(0);
    b.y1(5);

    expect(a.isCollided(b)).toBe(true);
    expect(b.isCollided(a)).toBe(true);
  });

  it('returns false when boxes are separated', () => {
    const a = new BoundingBox(createElementStub({ offsetX: 0, offsetY: 0 }));
    a.x0(0);
    a.x1(10);
    a.y0(0);
    a.y1(10);

    const b = new BoundingBox(createElementStub({ offsetX: 100, offsetY: 100 }));
    b.x0(0);
    b.x1(5);
    b.y0(0);
    b.y1(5);

    expect(a.isCollided(b)).toBe(false);
    expect(b.isCollided(a)).toBe(false);
  });
});