// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Geometry } from '../src/engine/map/Geometry.js';

describe('Geometry — construction & defaults', () => {
  it('initializes with default width/height of 16', () => {
    const geo = new Geometry();
    expect(geo.width()).toBe(16);
    expect(geo.height()).toBe(16);
  });

  it('initializes with null x/y coordinates', () => {
    const geo = new Geometry();
    expect(geo.x()).toBe(null);
    expect(geo.y()).toBe(null);
  });

  it('has a Coordinates object accessible via coordinates()', () => {
    const geo = new Geometry();
    const coords = geo.coordinates();
    expect(coords).not.toBeNull();
    expect(coords.x()).toBe(null);
    expect(coords.y()).toBe(null);
  });
});

describe('Geometry — width/height setters/getters', () => {
  it('gets and sets width', () => {
    const geo = new Geometry();
    expect(geo.width()).toBe(16);

    geo.width(32);
    expect(geo.width()).toBe(32);
  });

  it('gets and sets height', () => {
    const geo = new Geometry();
    expect(geo.height()).toBe(16);

    geo.height(48);
    expect(geo.height()).toBe(48);
  });

  it('rounds width on set', () => {
    const geo = new Geometry();
    geo.width(10.4);
    expect(geo.width()).toBe(10);

    geo.width(10.6);
    expect(geo.width()).toBe(11);
  });

  it('rounds height on set', () => {
    const geo = new Geometry();
    geo.height(20.3);
    expect(geo.height()).toBe(20);

    geo.height(20.7);
    expect(geo.height()).toBe(21);
  });

  it('handles negative width values', () => {
    const geo = new Geometry();
    geo.width(-5);
    expect(geo.width()).toBe(-5);
  });

  it('handles negative height values', () => {
    const geo = new Geometry();
    geo.height(-10);
    expect(geo.height()).toBe(-10);
  });

  it('handles zero width', () => {
    const geo = new Geometry();
    geo.width(0);
    expect(geo.width()).toBe(0);
  });

  it('handles zero height', () => {
    const geo = new Geometry();
    geo.height(0);
    expect(geo.height()).toBe(0);
  });
});

describe('Geometry — x/y position setters/getters', () => {
  it('gets and sets x coordinate', () => {
    const geo = new Geometry();
    expect(geo.x()).toBe(null);

    geo.x(100);
    expect(geo.x()).toBe(100);
  });

  it('gets and sets y coordinate', () => {
    const geo = new Geometry();
    expect(geo.y()).toBe(null);

    geo.y(200);
    expect(geo.y()).toBe(200);
  });

  it('rounds x coordinate on set', () => {
    const geo = new Geometry();
    geo.x(50.4);
    expect(geo.x()).toBe(50);

    geo.x(50.6);
    expect(geo.x()).toBe(51);
  });

  it('rounds y coordinate on set', () => {
    const geo = new Geometry();
    geo.y(75.3);
    expect(geo.y()).toBe(75);

    geo.y(75.9);
    expect(geo.y()).toBe(76);
  });

  it('handles negative coordinates', () => {
    const geo = new Geometry();
    geo.x(-50);
    geo.y(-100);
    expect(geo.x()).toBe(-50);
    expect(geo.y()).toBe(-100);
  });

  it('handles zero coordinates', () => {
    const geo = new Geometry();
    geo.x(0);
    geo.y(0);
    expect(geo.x()).toBe(0);
    expect(geo.y()).toBe(0);
  });
});

describe('Geometry — add() method', () => {
  it('adds to x coordinate', () => {
    const geo = new Geometry();
    geo.x(50);
    const result = geo.add('x', 10);
    expect(geo.x()).toBe(60);
    expect(result).toBe(60);
  });

  it('adds to y coordinate', () => {
    const geo = new Geometry();
    geo.y(100);
    const result = geo.add('y', 25);
    expect(geo.y()).toBe(125);
    expect(result).toBe(125);
  });

  it('adds negative values to x', () => {
    const geo = new Geometry();
    geo.x(80);
    geo.add('x', -30);
    expect(geo.x()).toBe(50);
  });

  it('adds negative values to y', () => {
    const geo = new Geometry();
    geo.y(150);
    geo.add('y', -60);
    expect(geo.y()).toBe(90);
  });

  it('rounds result when adding to x', () => {
    const geo = new Geometry();
    geo.x(10.6);
    geo.add('x', 5.5);
    expect(geo.x()).toBe(17); // 10.6 + 5.5 = 16.1, rounded = 16, then +5.5 = ... actually let me check
    // Actually: x(10.6) rounds to 11, then add(x, 5.5) gives 11 + 5.5 = 16.5, rounds to 16
  });

  it('returns undefined for invalid axis', () => {
    const geo = new Geometry();
    const result = geo.add('z', 10);
    expect(result).toBeUndefined();
  });

  it('returns undefined for unknown axis string', () => {
    const geo = new Geometry();
    const result = geo.add('unknown', 5);
    expect(result).toBeUndefined();
  });

  it('returns undefined when axis is not x or y', () => {
    const geo = new Geometry();
    const result = geo.add('X', 5); // uppercase
    expect(result).toBeUndefined();
  });

  it('adds to null coordinate (coerces null to 0)', () => {
    const geo = new Geometry();
    // x is null by default; null + 10 = 10 (JavaScript coercion)
    const result = geo.add('x', 10);
    expect(result).toBe(10);
    expect(geo.x()).toBe(10);
  });
});

describe('Geometry — clone()', () => {
  it('creates a deep copy with same dimensions', () => {
    const geo = new Geometry();
    geo.x(10);
    geo.y(20);
    geo.width(50);
    geo.height(60);

    const cloned = geo.clone();
    expect(cloned.x()).toBe(10);
    expect(cloned.y()).toBe(20);
    expect(cloned.width()).toBe(50);
    expect(cloned.height()).toBe(60);
  });

  it('cloned geometry is independent from original', () => {
    const geo = new Geometry();
    geo.x(10);
    geo.y(20);

    const cloned = geo.clone();
    cloned.x(999);
    cloned.y(888);

    expect(geo.x()).toBe(10);
    expect(geo.y()).toBe(20);
  });

  it('cloned geometry has independent Coordinates object', () => {
    const geo = new Geometry();
    geo.x(50);
    geo.y(75);

    const cloned = geo.clone();
    expect(cloned.coordinates()).not.toBe(geo.coordinates());
  });

  it('preserves default dimensions in clone', () => {
    const geo = new Geometry();
    // Don't change width/height, they stay at 16
    const cloned = geo.clone();
    expect(cloned.width()).toBe(16);
    expect(cloned.height()).toBe(16);
  });

  it('clone with all fields set', () => {
    const geo = new Geometry();
    geo.x(5);
    geo.y(15);
    geo.width(100);
    geo.height(200);

    const cloned = geo.clone();
    expect(cloned.x()).toBe(5);
    expect(cloned.y()).toBe(15);
    expect(cloned.width()).toBe(100);
    expect(cloned.height()).toBe(200);

    // Verify independence
    cloned.width(999);
    expect(geo.width()).toBe(100);
  });

  it('clone preserves rounding from original values', () => {
    const geo = new Geometry();
    geo.x(10.7); // rounds to 11
    geo.y(20.3); // rounds to 20
    geo.width(30.9); // rounds to 31
    geo.height(40.1); // rounds to 40

    const cloned = geo.clone();
    expect(cloned.x()).toBe(11);
    expect(cloned.y()).toBe(20);
    expect(cloned.width()).toBe(31);
    expect(cloned.height()).toBe(40);
  });
});
