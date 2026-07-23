import { describe, it, expect, afterEach } from 'vitest';
import { assetUrl, setAssetsBase, getAssetsBase } from '../src/engine/assets.js';

// assets.js keeps a module-level base; restore the default after each test.
afterEach(() => {
  setAssetsBase('engine/images');
});

describe('engine assets config', () => {
  it('defaults to engine/images', () => {
    expect(getAssetsBase()).toBe('engine/images');
    expect(assetUrl('map/grass-01.png')).toBe('engine/images/map/grass-01.png');
  });

  it('lets a host override the base path', () => {
    setAssetsBase('/static/rpg');
    expect(assetUrl('characters/characters-00.png')).toBe('/static/rpg/characters/characters-00.png');
  });

  it('supports an absolute CDN base', () => {
    setAssetsBase('https://cdn.example.com/rpg/');
    expect(assetUrl('map/map-sprites-01.png')).toBe('https://cdn.example.com/rpg/map/map-sprites-01.png');
  });

  it('normalises trailing/leading slashes to avoid doubles', () => {
    setAssetsBase('/assets/rpg/');
    expect(assetUrl('/map/grass-01.png')).toBe('/assets/rpg/map/grass-01.png');
  });
});
