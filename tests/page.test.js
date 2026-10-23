// Static checks that the page and the script agree, without a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const app = readFileSync(new URL('src/app.js', root), 'utf8');

test('every element id used by app.js exists in index.html', () => {
  const ids = [...app.matchAll(/\$\('([\w-]+)'\)/g)].map((m) => m[1]);
  assert.ok(ids.length > 10);
  for (const id of new Set(ids)) assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
});

test('assets use relative paths that exist (works under a GitHub Pages sub-path)', () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map((m) => m[1]);
  assert.ok(refs.includes('style.css') && refs.includes('src/app.js'));
  for (const ref of refs) {
    assert.ok(!ref.startsWith('/'), `${ref} should be relative`);
    assert.ok(existsSync(new URL(ref, root)), `${ref} not found`);
  }
});

test('the app loads as an ES module', () => {
  assert.match(html, /<script type="module" src="src\/app\.js"><\/script>/);
});
