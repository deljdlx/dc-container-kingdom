// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { KingdomHud } from '../src/container-kingdom/js/KingdomHud.js';

/**
 * The connection chip is the only thing telling the user that the map holds a
 * frozen, last-known view rather than live figures.
 */
describe('KingdomHud connection status', () => {
  let header;
  let hud;

  beforeEach(() => {
    document.body.innerHTML = '<div id="header"></div>';
    header = document.querySelector('#header');
    hud = new KingdomHud({}, header);
  });

  it('shows nothing while the daemon answers', () => {
    hud.renderConnectionStatus(true);
    expect(document.querySelector('.docker-status')).toBeNull();
  });

  it('shows a chip in the header when the daemon is unreachable', () => {
    hud.renderConnectionStatus(false);

    const chip = document.querySelector('.docker-status');
    expect(chip).not.toBeNull();
    expect(chip.parentElement).toBe(header);
    expect(chip.textContent).toMatch(/unreachable/i);
  });

  it('clears the chip once the daemon answers again', () => {
    hud.renderConnectionStatus(false);
    hud.renderConnectionStatus(true);

    expect(document.querySelector('.docker-status')).toBeNull();
  });

  it('does not stack chips while the outage lasts', () => {
    hud.renderConnectionStatus(false);
    hud.renderConnectionStatus(false);

    expect(document.querySelectorAll('.docker-status')).toHaveLength(1);
  });
});
