import { describe, expect, it } from 'vitest';
import { BoundingBox } from '../src/engine/scene/BoundingBox.js';

/**
 * `updateWithRelativeElement` must grow the box it is called on — and nothing
 * else. It used to reach through the parent element instead, which made the
 * receiver irrelevant: harmless while both were the same object, silently wrong
 * as soon as they differed (a freshly rebuilt aggregate, for instance).
 */
function makeChild(box, x, y) {
  return { x: () => x, y: () => y, getCollisionBoundingBox: () => box };
}

describe('updateWithRelativeElement — receiver', () => {
  it('grows the receiver, leaving the element own box untouched', () => {
    const elementBox = new BoundingBox();
    elementBox.x0(0); elementBox.x1(10); elementBox.y0(0); elementBox.y1(10);

    const childBox = new BoundingBox();
    childBox.x0(0); childBox.x1(20); childBox.y0(0); childBox.y1(20);

    // A detached box, as `recomputeAggregates` builds: it is the receiver, and
    // it is NOT the box the element currently exposes.
    const rebuilt = new BoundingBox();
    rebuilt.updateWithRelativeElement(makeChild(childBox, 100, 50));

    expect({ x0: rebuilt.x0(), x1: rebuilt.x1(), y0: rebuilt.y0(), y1: rebuilt.y1() })
      .toEqual({ x0: 100, x1: 120, y0: 50, y1: 70 });
    expect({ x0: elementBox.x0(), x1: elementBox.x1() }).toEqual({ x0: 0, x1: 10 });
  });

  it('ignores a child whose collision box is undefined', () => {
    const receiver = new BoundingBox();
    receiver.x0(1); receiver.x1(2); receiver.y0(3); receiver.y1(4);

    receiver.updateWithRelativeElement(makeChild(new BoundingBox(), 100, 100));

    expect({ x0: receiver.x0(), x1: receiver.x1(), y0: receiver.y0(), y1: receiver.y1() })
      .toEqual({ x0: 1, x1: 2, y0: 3, y1: 4 });
  });
});
