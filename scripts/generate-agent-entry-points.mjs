#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

const MODE_WRITE = 'write';
const MODE_CHECK = 'check';
const mode = process.argv.includes('--check') ? MODE_CHECK : MODE_WRITE;

const START_MARKER = '<!--<ENTRYPOINT_COMMON>-->';
const END_MARKER = '<!--</ENTRYPOINT_COMMON>-->';

const targets = [
  {
    path: 'AGENTS.md',
    metaPrefix: ''
  },
  {
    path: 'CLAUDE.md',
    metaPrefix: ''
  },
  {
    path: '.github/copilot-instructions.md',
    metaPrefix: '../'
  }
];

function read(relPath) {
  return readFileSync(resolve(repoRoot, relPath), 'utf8');
}

function write(relPath, content) {
  writeFileSync(resolve(repoRoot, relPath), content, 'utf8');
}

function renderCommon(metaPrefix) {
  const source = read('meta/agents/entry-points/common.md');
  return source.replaceAll('{{META_PREFIX}}', metaPrefix);
}

function replaceGeneratedBlock(content, generated) {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end < start) {
    throw new Error('Missing or invalid generated markers');
  }

  const before = content.slice(0, start + START_MARKER.length);
  const after = content.slice(end);
  return `${before}\n\n${generated.trimEnd()}\n\n${after}`;
}

const diffs = [];
for (const target of targets) {
  const current = read(target.path);
  const generated = renderCommon(target.metaPrefix);
  const next = replaceGeneratedBlock(current, generated);
  if (next !== current) {
    if (mode === MODE_WRITE) {
      write(target.path, next);
    } else {
      diffs.push(target.path);
    }
  }
}

if (mode === MODE_CHECK && diffs.length > 0) {
  process.stderr.write(`Outdated generated entry points: ${diffs.join(', ')}\n`);
  process.exit(1);
}
