// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application, Element } from '../src/engine/index.js';

beforeEach(() => {
  Application.mainInstance = { handle: vi.fn() };
});

class Goblin extends Element {
  static blueprint = { maxHp: 12, damage: 3, loot: { gold: 5 } };
}

class Orc extends Goblin {
  static blueprint = { maxHp: 30 };
}

describe('the blueprint — what a kind of entity is', () => {
  it('is shared by every instance of the class', () => {
    expect(new Goblin().getBlueprint()).toBe(new Goblin().getBlueprint());
  });

  it('is empty, not missing, for a class that declares none', () => {
    expect(new Element().getBlueprint()).toEqual({});
  });

  it('merges along the class chain — an orc is a goblin with more hit points', () => {
    const orc = new Orc();

    expect(orc.get('maxHp')).toBe(30);
    expect(orc.get('damage')).toBe(3);
  });

  it('leaves the parent alone when a child overrides it', () => {
    new Orc();

    expect(new Goblin().get('maxHp')).toBe(12);
  });

  describe('it cannot be written to — the bug this exists to prevent', () => {
    // What is guaranteed is that the write **has no effect**, not that it
    // throws: throwing is strict mode's doing, and these tests are ES modules,
    // hence strict. A host running a classic script fails silently instead —
    // measured in the browser, where the same assignment threw nothing and
    // changed nothing.
    it('does not let a write through an instance take effect', () => {
      const goblin = new Goblin();

      try { goblin.getBlueprint().maxHp = 1; } catch { /* strict mode throws */ }

      expect(goblin.get('maxHp')).toBe(12);
    });

    it('does not let a write one level down take effect — the freeze is deep', () => {
      const goblin = new Goblin();

      try { goblin.getBlueprint().loot.gold = 0; } catch { /* strict mode throws */ }

      expect(goblin.get('loot').gold).toBe(5);
    });

    it('throws on a write, under strict mode', () => {
      const goblin = new Goblin();

      expect(() => { goblin.getBlueprint().maxHp = 1; }).toThrow();
      expect(() => { goblin.getBlueprint().loot.gold = 0; }).toThrow();
    });

    it('leaves the other instances untouched when one is hurt', () => {
      const hurt = new Goblin();
      const healthy = new Goblin();

      hurt.set('maxHp', 1);

      expect(hurt.get('maxHp')).toBe(1);
      expect(healthy.get('maxHp')).toBe(12);
    });
  });
});

describe('the state — what this entity is right now', () => {
  it('wins over the blueprint', () => {
    const goblin = new Goblin();
    goblin.data.damage = 99;

    expect(goblin.get('damage')).toBe(99);
  });

  it('is seeded, chainably, by withState', () => {
    const boss = new Goblin().withState({ maxHp: 36, name: 'Grishnak' });

    expect(boss.get('maxHp')).toBe(36);
    expect(boss.get('name')).toBe('Grishnak');
    expect(new Goblin().get('maxHp')).toBe(12);
  });

  it('answers the fallback when neither side knows the key', () => {
    expect(new Goblin().get('armour')).toBeUndefined();
    expect(new Goblin().get('armour', 0)).toBe(0);
  });

  it('keeps a state value that is explicitly undefined or null', () => {
    const goblin = new Goblin().withState({ maxHp: null });

    // `key in data` rather than a truthiness test: a game that stores `null`
    // means «no maximum», and must not silently fall back to the blueprint.
    expect(goblin.get('maxHp')).toBeNull();
  });

  it('is still the plain bag hosts already write to', () => {
    const element = new Element();
    element.data.container = { name: 'nginx' };

    expect(element.get('container')).toEqual({ name: 'nginx' });
    expect(element.data.container.name).toBe('nginx');
  });

  it('set() writes to the state and never to the blueprint', () => {
    const goblin = new Goblin();

    expect(goblin.set('hp', 4)).toBe(goblin);
    expect(goblin.data.hp).toBe(4);
    expect(Goblin.blueprint.hp).toBeUndefined();
  });
});
