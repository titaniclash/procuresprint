import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

/** Every *.html in the project root and in pages/ (recursively) is a build input. */
function htmlInputs() {
  const inputs = {};
  const add = (abs) => {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    inputs[rel.replace(/\.html$/, '').replace(/[^a-zA-Z0-9_/-]/g, '_')] = abs;
  };
  for (const name of fs.readdirSync(root)) {
    if (name.endsWith('.html') && fs.statSync(path.join(root, name)).isFile()) add(path.join(root, name));
  }
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && entry.name.endsWith('.html')) add(abs);
    }
  };
  walk(path.join(root, 'pages'));
  walk(path.join(root, 'modules'));
  walk(path.join(root, 'templates'));
  return inputs;
}

/**
 * Dev only: adds `data-loc="pages/orders.html:42"` to every element inside
 * <body> so the Studio inspector can map a click back to the source line.
 * Elements that already carry data-loc, and <script>/<template> contents, are left alone.
 */
function htmlSourceLocations() {
  return {
    name: 'studio-html-loc',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const file = ctx.filename ? path.relative(root, ctx.filename).split(path.sep).join('/') : ctx.path.replace(/^\//, '');
        const bodyStart = html.search(/<body[\s>]/i);
        if (bodyStart < 0) return html;
        const lineAt = (index) => html.slice(0, index).split('\n').length;
        let out = '';
        let last = 0;
        const tag = /<!--[\s\S]*?-->|<(script|style|template|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|<([a-zA-Z][a-zA-Z0-9-]*)(\s[^<>]*?)?(\/?)>/g;
        tag.lastIndex = html.indexOf('>', bodyStart) + 1;
        let m;
        while ((m = tag.exec(html))) {
          const name = m[2];
          if (!name) continue; // comment or raw-text element: leave untouched
          const attrs = m[3] ?? '';
          if (/\sdata-loc\s*=/.test(attrs)) continue;
          const insertAt = m.index + 1 + name.length;
          out += html.slice(last, insertAt) + ` data-loc="${file}:${lineAt(m.index)}"`;
          last = insertAt;
        }
        return out + html.slice(last);
      },
    },
  };
}

export default defineConfig({
  plugins: [htmlSourceLocations()],
  server: {
    host: '127.0.0.1',
    strictPort: true,
    hmr: { overlay: true },
    fs: { strict: false },
  },
  // Per-product dependency cache.
  cacheDir: '.vite',
  build: {
    sourcemap: false,
    rollupOptions: { input: htmlInputs() },
  },
});
