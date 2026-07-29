// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Log } from '../src/container-kingdom/js/Log.js';
import { ContainersListEntry } from '../src/container-kingdom/js/ContainersListEntry.js';
import { ContainersList } from '../src/container-kingdom/js/ContainersList.js';
import { ContainerView } from '../src/container-kingdom/js/ContainerView.js';

/**
 * Everything Docker hands us is attacker-controlled: a container writes its own
 * logs, and its name, labels and compose project come from whoever built the
 * image. Rendering any of it as HTML hands script execution to a page that holds
 * an unauthenticated Docker API session.
 */
const PAYLOAD = '<img src=x onerror="globalThis.__pwned = true">';

beforeEach(() => {
  document.body.innerHTML = '';
  delete globalThis.__pwned;
});

/** @returns {HTMLElement[]} every element rendered for a one-line log */
function renderLog(line) {
  return new Log(line).getEntries().map(entry => entry.getElement()).filter(Boolean);
}

describe('logs d\'un conteneur', () => {
  it('affiche une charge utile HTML en texte, sans l\'exécuter', () => {
    const rendered = renderLog(PAYLOAD);
    rendered.forEach(element => document.body.append(element));

    expect(document.querySelector('img')).toBeNull();
    expect(globalThis.__pwned).toBeUndefined();
    expect(document.body.textContent).toContain('<img src=x');
  });

  it('garde le surlignage des lignes d\'erreur', () => {
    const rendered = renderLog('fatal error: connection refused');
    rendered.forEach(element => document.body.append(element));

    expect(document.querySelector('.log-entry--error')).not.toBeNull();
  });

  it('décide le surlignage sur le texte lu, pas sur le balisage', () => {
    // The rule is "the line mentions an error", so it must be read the way the
    // user reads it. Deciding on `innerHTML` let an attribute nobody sees paint
    // an innocent line red.
    const element = document.createElement('div');
    element.innerHTML = '<span title="error">tout va bien</span>';

    new Log('').highlightErrors(element);

    expect(element.classList.contains('log-entry--error')).toBe(false);
  });
});

describe('noms venus de Docker', () => {
  const application = { focusOnContainer: vi.fn(), getLayout: () => ({}) };

  function fakeContainer(name, running = true) {
    return {
      getName: () => name,
      isRunning: () => running,
      getId: () => 'abc123',
      Id: 'abc123',
    };
  }

  it('affiche le nom d\'un conteneur en texte', () => {
    const entry = new ContainersListEntry(application, fakeContainer(PAYLOAD));
    document.body.append(entry.getElement());

    expect(document.querySelector('img')).toBeNull();
    expect(globalThis.__pwned).toBeUndefined();
    expect(document.querySelector('.container-name').textContent).toContain('<img');
  });

  it('affiche le nom d\'un projet compose en texte', () => {
    document.body.innerHTML = '<div class="containers-list"></div>';
    const list = new ContainersList(application);
    // A compose group is only drawn when it holds more than one container.
    list.load({
      [PAYLOAD]: {
        length: () => 2,
        getContainers: () => [fakeContainer('a'), fakeContainer('b')],
      },
    });

    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('.compose-caption').textContent).toContain('<img');
  });

  it('affiche une entrée d\'information en texte', () => {
    const view = new ContainerView(fakeContainer('whatever'));
    document.body.append(view.createEntry('Image', PAYLOAD));

    expect(document.querySelector('img')).toBeNull();
    expect(document.body.textContent).toContain('<img src=x');
  });
});
