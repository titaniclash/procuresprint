import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
export const exists = (rel) => fs.existsSync(path.join(root, rel));

/** Resolves an href/src found in `page` to a project-relative file path, or null when it is external or in-page. */
export function resolveRef(page, ref) {
  if (!ref || /^(https?:|mailto:|tel:|#|javascript:|data:)/.test(ref)) return null;
  const clean = ref.split('#')[0].split('?')[0];
  if (clean === '') return null;
  if (clean.startsWith('/')) {
    const atRoot = clean.slice(1);
    return exists(atRoot) ? atRoot : path.posix.join('public', clean);
  }
  return path.posix.normalize(path.posix.join(path.posix.dirname(page), clean));
}

/** All href="..." and src="..." values written literally in the markup (template expressions are skipped). */
export function literalRefs(html) {
  const refs = [];
  for (const m of html.matchAll(/\b(?:href|src)="([^"$]+)"/g)) refs.push(m[1]);
  return refs;
}
