import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { screens } from '../scripts/screens.mjs';
import { exists, read, root } from './helpers.js';

/** Module and template pages present in the project (the knowledge mirror here is a single archive digest, not per page). */
const pagesIn = (dir) => fs.readdirSync(path.join(root, dir)).filter((n) => n.endsWith('.html')).map((n) => `${dir}/${n}`);
const mirrored = [...pagesIn('modules'), ...pagesIn('templates')];

describe('the screen inventory matches the pages in the project', () => {
  it('every module and template page is a screen', () => {
    const files = new Set(screens.map((s) => s.file));
    expect(mirrored.filter((f) => !files.has(f))).toEqual([]);
  });
  it('ids are sequential and routes unique', () => {
    screens.forEach((s, i) => expect(s.id).toBe(`S-${String(i + 1).padStart(2, '0')}`));
    expect(new Set(screens.map((s) => s.route)).size).toBe(screens.length);
  });
});

describe('each page is a complete document', () => {
  for (const s of screens) {
    it(`${s.id} ${s.file}`, () => {
      expect(exists(s.file)).toBe(true);
      const html = read(s.file);
      expect(html).toMatch(/<title>[^<]+<\/title>/);
      expect(html.match(/<main\b/g)?.length).toBe(1);
      expect(html).toContain('/src/styles/tokens.css');
      expect(html).toContain('/src/main.js');
      if (s.shell !== 'docs') {
        expect(html).toMatch(new RegExp(`<body[^>]*data-shell="${s.shell}"`));
        expect(html).toContain('/assets/js/ps.js');
      }
      if (s.archetype === 'workbench') {
        expect(html).toContain('window.PAGE');
        expect(html).toContain('/assets/js/workbench.js');
      }
    });
  }
});

describe('pages reference project assets, never the source folder layout', () => {
  it('no page keeps a relative assets/ path from the source', () => {
    for (const file of mirrored) expect(read(file)).not.toMatch(/(href|src)="(\.\.\/)?assets\//);
  });
});

describe('application-wide enhancements live in the shared shell', () => {
  const js = read('public/assets/js/ps.js');
  const css = read('src/styles/ps.css');
  it('the global header has no search box or business-unit switcher and carries Ask Me', () => {
    expect(js).not.toContain('ps-global-search');
    expect(js).not.toContain('ps-bu-menu');
    expect(js).toContain('ps-topbar__ask');
  });
  it('no page or runtime renders its own Ask Me or Refresh', () => {
    for (const s of screens) expect(read(s.file)).not.toMatch(/data-open="ps-assistant"|Refreshed · data as of just now/);
    expect(read('public/assets/js/workbench.js')).not.toMatch(/label: 'Refresh'|label: 'Ask Me'/);
  });
  it('toolbar, tabs, navigation and table spacing rules are the shared ones', () => {
    expect(css).toMatch(/\.ps-toolbar \{[^}]*border-bottom: 1px solid var\(--ps-line\)/);
    expect(css).toMatch(/\.ps-tabs \{[^}]*overflow-y: hidden/);
    expect(css).not.toMatch(/\.ps-side__top \{[^}]*--ps-r-full/);
    expect(css).toMatch(/\.ps-table \.col-check \+ \.col-sticky2 \{ left: 48px; \}/);
  });
  it('menus opened inside a table are moved to <body>', () => {
    expect(js).toContain('function portalMenu');
    expect(js).toMatch(/document\.body\.append\(mn\)/);
  });
});
