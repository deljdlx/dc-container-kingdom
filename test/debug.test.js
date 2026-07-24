// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { applyDebugFlag, isDebugEnabled } from '../src/engine/index.js';

/** A minimal window whose search string we control, sharing the jsdom document. */
function fakeWindow(search) {
  return { location: { search }, document };
}

describe('applyDebugFlag', () => {
  beforeEach(() => {
    document.body.className = '';
  });

  it('enables debug and returns true when ?debug=1', () => {
    const enabled = applyDebugFlag(fakeWindow('?debug=1'));
    expect(enabled).toBe(true);
    expect(document.body.classList.contains('debug')).toBe(true);
    expect(isDebugEnabled()).toBe(true);
  });

  it('stays off with no flag', () => {
    const enabled = applyDebugFlag(fakeWindow(''));
    expect(enabled).toBe(false);
    expect(document.body.classList.contains('debug')).toBe(false);
    expect(isDebugEnabled()).toBe(false);
  });

  it('treats any value other than "1" as off', () => {
    expect(applyDebugFlag(fakeWindow('?debug=0'))).toBe(false);
    expect(applyDebugFlag(fakeWindow('?debug=true'))).toBe(false);
    expect(document.body.classList.contains('debug')).toBe(false);
  });
});
