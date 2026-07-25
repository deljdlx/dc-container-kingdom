// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Application, Element } from '../src/engine/index.js';
import { getStageMetrics } from '../src/engine/catalog/preview-layout.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

describe('catalog preview layout', () => {
  it('keeps the visual content at real size and only adds framing padding', () => {
    const element = new Element(0, 0, 32, 48);
    const metrics = getStageMetrics(element);

    expect(metrics.contentWidth).toBe(32);
    expect(metrics.contentHeight).toBe(48);
    expect(metrics.width).toBe(160);
    expect(metrics.height).toBe(160);
  });

  it('expands content bounds when collisions exceed the sprite box', () => {
    const element = new Element(0, 0, 32, 32);
    element.createCollisionZone(-10, -20, 60, 80);
    const metrics = getStageMetrics(element);

    expect(metrics.contentWidth).toBe(60);
    expect(metrics.contentHeight).toBe(80);
    expect(metrics.offsetX).toBe(60);
    expect(metrics.offsetY).toBe(60);
  });
});
