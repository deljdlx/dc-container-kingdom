import { describe, expect, it } from 'vitest';
import { sha256 } from '../src/container-kingdom/js/sha256.js';

describe('sha256 utility', () => {
  it('throws on undefined to prevent silent checksum bugs', async () => {
    await expect(sha256()).rejects.toThrow('expects a defined value');
  });

  it('returns the same hash for equal payloads', async () => {
    const left = await sha256({ hello: 'world' });
    const right = await sha256({ hello: 'world' });

    expect(left).toBe(right);
  });
});
