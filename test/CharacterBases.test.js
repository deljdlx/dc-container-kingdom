// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Application,
  Man00,
  Man01,
  Man02,
  Man03,
  Man04,
  Woman00,
  Woman01,
  Woman02,
} from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

describe('built-in character bases', () => {
  it('map each exported base to the expected shared sprite-sheet offsets', () => {
    const expectations = [
      [Man00, 48 * 6, 48 * 0],
      [Man01, 48 * 0, 48 * 0],
      [Man02, 48 * 0, 48 * 4],
      [Man03, 48 * 3, 48 * 4],
      [Man04, 48 * 6, 48 * 4],
      [Woman00, 48 * 3, 48 * 0],
      [Woman01, 48 * 9, 48 * 0],
      [Woman02, 48 * 9, 48 * 4],
    ];

    expectations.forEach(([CharacterBase, left, top]) => {
      const character = new CharacterBase();
      expect(character.getSpriteSheetOffsetLeft()).toBe(left);
      expect(character.getSpriteSheetOffsetTop()).toBe(top);
    });
  });
});