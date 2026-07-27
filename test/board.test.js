import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';

/**
 * Guardrail over the `meta/` board: its conventions live in five documents plus
 * three entry points that summarise them, so keeping them aligned is mechanical
 * work — the kind that stops being done. These checks run inside `npm run verify`
 * on purpose: breaking the board must fail like a red test, not wait for CI.
 *
 * The procedure they automate is described in
 * `meta/agents/recipes/audit-workflow-consistency.md`.
 */

const REPO = new URL('..', import.meta.url).pathname;
const BOARD = 'meta/workflow';

/** Columns a ticket travels through; the two boxes below are out of pipeline. */
const PIPELINE_COLUMNS = ['000-backlog', '020-ready', '040-doing', '060-verify', '080-done'];
const OUT_OF_PIPELINE = ['100-follow-up', '200-ideas'];
const ACTIVE_COLUMNS = ['000-backlog', '020-ready', '040-doing', '060-verify'];

const PROJECTS = ['engine', 'container-kingdom', 'infra', 'board'];
const TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore'];

const ENTRY_POINTS = ['CLAUDE.md', 'AGENTS.md', '.github/copilot-instructions.md'];

/**
 * `## Suite` became mandatory with ticket 2026-07-26_18-14 — but measuring the
 * archive says it stayed decorative: **24** closed tickets have no such section,
 * 5 of them created *after* the rubric was born. Enforcing it backwards would
 * paint the guardrail permanently red, and a permanently red guardrail gets
 * switched off.
 *
 * So the pivot is the day the check takes effect, not the day the rule was
 * written: from here on, no closure without a `## Suite`. The debt behind stays
 * visible in the archive rather than being rewritten to make a test pass.
 */
const SUITE_PIVOT = '2026-07-27 19:30';

const read = (relPath) => readFileSync(join(REPO, relPath), 'utf8');
const exists = (relPath) => existsSync(join(REPO, relPath));

/** @returns {string[]} repo-relative paths of every markdown file under `dir` */
function markdownFilesIn(dir) {
  const absolute = join(REPO, dir);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute)
    .filter(name => name.endsWith('.md'))
    .map(name => `${dir}/${name}`);
}

function ticketsIn(column) {
  return markdownFilesIn(`${BOARD}/${column}`);
}

/** @returns {Record<string, string>} frontmatter of a ticket, `key: value` only */
function frontmatter(relPath) {
  const text = read(relPath);
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split('\n')
      .map(line => /^([a-z]+):\s*(.*)$/.exec(line))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.replace(/\s+#.*$/, '').trim()])
  );
}

/** Every markdown file the audit covers: the board, the docs, the entry points. */
function allDocumentedMarkdown() {
  const files = [...ENTRY_POINTS, 'README.md', 'meta/README.md', `${BOARD}/TEMPLATE.md`];
  for (const dir of ['meta/agents', 'meta/agents/recipes', 'meta/agents/recipes/workflow',
    'meta/agents/tools', 'meta/documentation', 'meta/recipes']) {
    files.push(...markdownFilesIn(dir));
  }
  for (const column of [...PIPELINE_COLUMNS, ...OUT_OF_PIPELINE]) {
    files.push(...ticketsIn(column));
  }
  return files.filter(exists);
}

describe('board — liens et références', () => {
  it('résout tous les liens markdown relatifs', () => {
    const broken = [];
    for (const file of allDocumentedMarkdown()) {
      const from = dirname(file);
      for (const [, target] of read(file).matchAll(/\]\(([^)]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(target)) continue;
        const resolved = normalize(join(from, target.split('#')[0]));
        if (!exists(resolved)) broken.push(`${file} -> ${target}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('cite toujours une colonne sous meta/workflow/, jamais meta/<colonne>/', () => {
    const columns = [...PIPELINE_COLUMNS, ...OUT_OF_PIPELINE].join('|');
    const wrong = new RegExp(`meta/(${columns})/`, 'g');
    const offenders = [];
    for (const file of allDocumentedMarkdown()) {
      for (const [match] of read(file).matchAll(wrong)) {
        if (!read(file).includes(`meta/workflow/${match.slice('meta/'.length)}`)) {
          offenders.push(`${file} -> ${match}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('pointe les @imports de CLAUDE.md sur des fichiers existants', () => {
    const missing = [...read('CLAUDE.md').matchAll(/^@(\S+)/gm)]
      .map(([, target]) => target)
      .filter(target => !exists(target));
    expect(missing).toEqual([]);
  });
});

describe('board — colonnes', () => {
  it('documente dans le README toute colonne présente sur le disque', () => {
    const onDisk = readdirSync(join(REPO, BOARD))
      .filter(name => statSync(join(REPO, BOARD, name)).isDirectory());
    const readme = read('meta/README.md');
    const undocumented = onDisk.filter(column => !readme.includes(`${column}/`));
    // A column the audit ignores is worse than an undocumented one: it reports
    // green without having looked.
    expect(undocumented).toEqual([]);
  });

  it('connaît toutes les colonnes du disque dans ce test', () => {
    const onDisk = readdirSync(join(REPO, BOARD))
      .filter(name => statSync(join(REPO, BOARD, name)).isDirectory())
      .sort();
    expect(onDisk).toEqual([...PIPELINE_COLUMNS, ...OUT_OF_PIPELINE].sort());
  });
});

describe('board — nommage des tickets', () => {
  // `projet_priorité_titre.md`. The title is required to be ASCII kebab-case:
  // that is a *proxy* for "written in English" — it catches `priorité` or
  // `complétude`, it does not catch `routes-en-double`. No test can.
  const NAME = new RegExp(`^(${PROJECTS.join('|')})_(\\d{3})_([a-z0-9]+(?:-[a-z0-9]+)*)\\.md$`);

  for (const column of ACTIVE_COLUMNS) {
    it(`respecte projet_priorité_titre dans ${column}`, () => {
      const wrong = ticketsIn(column)
        .map(file => relative(`${BOARD}/${column}`, file))
        .filter(name => !NAME.test(name));
      expect(wrong).toEqual([]);
    });
  }

  it('garde des id uniques dans les colonnes actives', () => {
    const seen = new Map();
    const duplicates = [];
    for (const column of ACTIVE_COLUMNS) {
      for (const file of ticketsIn(column)) {
        const id = frontmatter(file).id;
        if (seen.has(id)) duplicates.push(`${id}: ${seen.get(id)} + ${file}`);
        seen.set(id, file);
      }
    }
    // Scoped to active columns on purpose: 080-done carries pre-convention
    // duplicates, and rewriting the archive to satisfy a check would falsify it.
    expect(duplicates).toEqual([]);
  });
});

describe('board — frontmatter', () => {
  it('renseigne id, title, type et created sur chaque ticket actif', () => {
    const incomplete = [];
    for (const column of ACTIVE_COLUMNS) {
      for (const file of ticketsIn(column)) {
        const meta = frontmatter(file);
        for (const key of ['id', 'title', 'type', 'created']) {
          if (!meta[key]) incomplete.push(`${file}: ${key} manquant`);
        }
        if (meta.type && !TYPES.includes(meta.type)) {
          incomplete.push(`${file}: type « ${meta.type} » hors enum`);
        }
      }
    }
    expect(incomplete).toEqual([]);
  });

  it('date les transitions déjà franchies, et seulement celles-là', () => {
    // Reaching a column means every earlier stamp is filled and the later ones
    // are not: the board must not claim a step it has not taken.
    const stamps = { '020-ready': ['ready'], '040-doing': ['ready', 'doing'], '060-verify': ['ready', 'doing', 'verify'] };
    const wrong = [];
    for (const [column, expected] of Object.entries(stamps)) {
      for (const file of ticketsIn(column)) {
        const meta = frontmatter(file);
        for (const key of expected) {
          if (!meta[key]) wrong.push(`${file}: ${key} vide alors qu'il est en ${column}`);
        }
        if (meta.done) wrong.push(`${file}: done renseigné hors de 080-done`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('remplit la rubrique Suite des tickets clos depuis sa création', () => {
    const empty = [];
    for (const file of ticketsIn('080-done')) {
      const done = frontmatter(file).done;
      if (!done || done < SUITE_PIVOT) continue; // predates the rubric
      const section = /## Suite\n([\s\S]*?)\n## /.exec(read(file));
      const body = (section?.[1] ?? '').replace(/[-\s]/g, '');
      if (body === '') empty.push(file);
    }
    expect(empty).toEqual([]);
  });
});

describe('board — points d\'entrée', () => {
  it('énonce les mêmes règles essentielles dans les trois fichiers', () => {
    // Asserting equality is enough; generating these files from one source would
    // cost more than the drift, since each keeps sections of its own (Copilot's
    // worktree preamble, Claude's @imports).
    const blocks = ENTRY_POINTS.map((file) => {
      const match = /## Règles essentielles\n([\s\S]*?)\n## /.exec(read(file));
      return { file, block: match?.[1]?.trim() };
    });
    for (const { file, block } of blocks) {
      expect(block, `${file} n'a pas de bloc « Règles essentielles »`).toBeTruthy();
    }
    const [reference, ...others] = blocks;
    for (const other of others) {
      expect(other.block, `${other.file} diverge de ${reference.file}`).toBe(reference.block);
    }
  });
});
