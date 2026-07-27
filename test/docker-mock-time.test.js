import { describe, expect, it } from 'vitest';
import { getContainers, makeStats, handleDockerRequest } from '../mock/docker-mock.js';

/**
 * The mock must reproduce what the real Docker API does over *time*, not just
 * its shape. A double that is too stable hides a whole family of bugs: a
 * container fingerprint built on the human-readable `Status` looked perfectly
 * stable here while it drifted every second against a real daemon.
 */
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A clock sitting `elapsed` ms after the first fixture container was created. */
function clockAfter(elapsed) {
  return getContainers(0)[0].Created * 1000 + elapsed;
}

describe('mock — le temps qui passe', () => {
  it('fait vieillir le Status au fil de l’horloge', () => {
    const jeune = getContainers(clockAfter(4 * SECOND))[0].Status;
    const plusVieux = getContainers(clockAfter(9 * SECOND))[0].Status;

    expect(jeune).toBe('Up 4 seconds');
    expect(plusVieux).toBe('Up 9 seconds');
    expect(jeune).not.toBe(plusVieux);
  });

  it('expose plusieurs tranches d’âge dès le premier rendu', () => {
    const statuses = getContainers(clockAfter(0)).map(container => container.Status);

    expect(statuses.some(status => status.includes('seconds'))).toBe(true);
    expect(statuses.some(status => status.includes('minutes') || status.includes('About a minute'))).toBe(true);
    expect(statuses.some(status => status.includes('hours') || status.includes('About an hour'))).toBe(true);
    expect(statuses.some(status => status.includes('days') || status.includes('weeks'))).toBe(true);
  });

  it('suit les paliers de l’API Docker', () => {
    const statusApres = ms => getContainers(clockAfter(ms))[0].Status;

    expect(statusApres(45 * SECOND)).toBe('Up 45 seconds');
    expect(statusApres(90 * SECOND)).toBe('Up About a minute');
    expect(statusApres(5 * MINUTE)).toBe('Up 5 minutes');
    expect(statusApres(90 * MINUTE)).toBe('Up About an hour');
    expect(statusApres(5 * HOUR)).toBe('Up 5 hours');
    expect(statusApres(8 * DAY)).toBe('Up 8 days');
  });

  it('reste déterministe : même horloge, même réponse', () => {
    const t = clockAfter(3 * HOUR);
    expect(getContainers(t)[0].Status).toBe(getContainers(t)[0].Status);
  });

  it('ne fait pas dériver Created — une date de naissance ne bouge pas', () => {
    expect(getContainers(clockAfter(0))[0].Created)
      .toBe(getContainers(clockAfter(10 * DAY))[0].Created);
  });

  it('sert le Status calculé à travers la route HTTP', () => {
    const body = handleDockerRequest('GET', '/containers/json', clockAfter(30 * SECOND)).body;
    expect(body[0].Status).toBe('Up 30 seconds');
  });

  it('fait respirer la mémoire sans faire sauter les paliers', () => {
    const id = getContainers(0)[0].Id;
    const base = clockAfter(0);
    const mesures = [0, 30 * SECOND, 90 * SECOND, 4 * MINUTE]
      .map(dt => makeStats(id, base + dt).memory_stats.usage);

    // Elle bouge…
    expect(new Set(mesures).size).toBeGreaterThan(1);
    // …mais reste dans une bande étroite autour de sa base (moins de 10 %).
    const min = Math.min(...mesures), max = Math.max(...mesures);
    expect((max - min) / min).toBeLessThan(0.1);
  });
});
