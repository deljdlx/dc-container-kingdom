import { describe, it, expect } from 'vitest';
import { Camera } from '../src/engine/index.js';

describe('Camera', () => {
  it('starts inactive at the origin', () => {
    const cam = new Camera(800, 600);
    expect(cam.x()).toBe(0);
    expect(cam.y()).toBe(0);
    expect(cam.isActive()).toBe(false);
  });

  it('moveTo / moveBy set the position and activate it', () => {
    const cam = new Camera(800, 600);
    cam.moveTo(100, 50);
    expect([cam.x(), cam.y()]).toEqual([100, 50]);
    cam.moveBy(10, -20);
    expect([cam.x(), cam.y()]).toEqual([110, 30]);
    expect(cam.isActive()).toBe(true);
  });

  it('follows a target, centring it in the view', () => {
    const cam = new Camera(800, 600);
    const target = { x: () => 1000, y: () => 500, width: () => 48, height: () => 48 };
    cam.follow(target);
    cam.update();

    // camera top-left = target centre - half the view
    expect(cam.x()).toBe(1000 + 24 - 400);
    expect(cam.y()).toBe(500 + 24 - 300);
    expect(cam.isActive()).toBe(true);
  });

  it('tracks the target as it moves', () => {
    const cam = new Camera(800, 600);
    let x = 0;
    cam.follow({ x: () => x, y: () => 0, width: () => 48, height: () => 48 });
    cam.update();
    const first = cam.x();
    x = 300;
    cam.update();
    expect(cam.x()).toBe(first + 300);
  });
});
