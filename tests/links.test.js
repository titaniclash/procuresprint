import { describe, expect, it } from 'vitest';
import { screens } from '../scripts/screens.mjs';
import { exists, literalRefs, read, resolveRef } from './helpers.js';

const pages = screens.map((s) => s.file);

describe('every internal link and asset reference resolves', () => {
  for (const page of pages) {
    it(page, () => {
      const missing = literalRefs(read(page))
        .map((ref) => [ref, resolveRef(page, ref)])
        .filter(([, file]) => file && !exists(file))
        .map(([ref]) => ref);
      expect(missing).toEqual([]);
    });
  }
});

describe('shell navigation in ps.js points at existing pages', () => {
  const js = read('public/assets/js/ps.js');
  const hrefs = [...js.matchAll(/href: '([^']+\.html)'/g)].map((m) => m[1]);
  it('finds the navigation', () => expect(hrefs.length).toBeGreaterThan(20));
  for (const href of hrefs) it(href, () => expect(exists(href)).toBe(true));
});
