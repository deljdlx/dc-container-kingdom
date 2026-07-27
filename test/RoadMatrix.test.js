import { describe, expect, it } from 'vitest';
import { RoadMatrix } from '../src/container-kingdom/js/RoadMatrix.js';

/**
 * The neighbour lookup is the whole point of this structure: the previous
 * plain-object grid turned its coordinates into strings, so `x + step`
 * concatenated instead of adding and the "no tree next to a road" rule never
 * fired. These tests pin the arithmetic.
 */
describe('RoadMatrix', () => {
  it('records and finds a tile at exact coordinates', () => {
    const matrix = new RoadMatrix();
    matrix.add(350, 100, { id: 'road' });

    expect(matrix.has(350, 100)).toBe(true);
    expect(matrix.has(350, 150)).toBe(false);
    expect(matrix.tiles()).toEqual([{ x: 350, y: 100, road: { id: 'road' } }]);
  });

  it('detects a horizontal neighbour one step away, on either side', () => {
    const matrix = new RoadMatrix();
    matrix.add(350, 100, {});
    matrix.add(400, 100, {});

    expect(matrix.hasHorizontalNeighbour(350, 100, 50)).toBe(true);  // à droite
    expect(matrix.hasHorizontalNeighbour(400, 100, 50)).toBe(true);  // à gauche
  });

  it('reports no neighbour for an isolated tile', () => {
    const matrix = new RoadMatrix();
    matrix.add(350, 100, {});

    expect(matrix.hasHorizontalNeighbour(350, 100, 50)).toBe(false);
  });

  it('adds the step instead of concatenating it', () => {
    // Le bug d'origine : "350" + 50 === "35050", donc le voisin cherché
    // n'existait jamais. Un tuile en 35050 ne doit pas compter comme voisine.
    const matrix = new RoadMatrix();
    matrix.add(350, 100, {});
    matrix.add(35050, 100, {});

    expect(matrix.hasHorizontalNeighbour(350, 100, 50)).toBe(false);

    matrix.add(400, 100, {});
    expect(matrix.hasHorizontalNeighbour(350, 100, 50)).toBe(true);
  });

  it('keeps tiles distinct across rows', () => {
    const matrix = new RoadMatrix();
    matrix.add(350, 100, {});

    expect(matrix.hasHorizontalNeighbour(350, 200, 50)).toBe(false);
  });
});
