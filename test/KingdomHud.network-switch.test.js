// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { KingdomHud } from '../src/container-kingdom/js/KingdomHud.js';

describe('KingdomHud network switch for roads', () => {
  it('keeps shared roads visible while one owning network stays enabled', () => {
    document.body.innerHTML = '<header id="header"></header>';

    const app = {
      getNetworks: () => ({ web: [], mariadb: [] }),
    };

    const hud = new KingdomHud(app, document.querySelector('#header'));
    hud.selectedNetworks = { web: true, mariadb: true };

    const sharedRoad = document.createElement('div');
    sharedRoad.className = 'map-element network network--web network--mariadb';

    const webOnlyRoad = document.createElement('div');
    webOnlyRoad.className = 'map-element network network--web';

    document.body.append(sharedRoad, webOnlyRoad);

    hud.handleNetworkSwitch('web', false);

    expect(sharedRoad.classList.contains('hidden')).toBe(false);
    expect(webOnlyRoad.classList.contains('hidden')).toBe(true);

    hud.handleNetworkSwitch('mariadb', false);

    expect(sharedRoad.classList.contains('hidden')).toBe(true);
  });
});
