/** Writes .ai/screen-architecture.json and .ai/frontend-manifest.json from scripts/screens.mjs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { screens, navigation } from './screens.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const write = (rel, data) => fs.writeFileSync(path.join(root, rel), JSON.stringify(data, null, 2) + '\n');

write('.ai/screen-architecture.json', { screens, navigation });

const itemScreens = screens.filter((s) => s.file.startsWith('modules/item-')).map((s) => s.id);
const sharedBy = (shellKinds) => screens.filter((s) => shellKinds.includes(s.shell)).map((s) => s.id);
write('.ai/frontend-manifest.json', {
  framework: 'static-html',
  entry: 'index.html',
  routes: screens.map((s) => ({ path: s.route, screen: s.id, file: s.file })),
  components: [
    { name: 'App shell (sidebar, page banner with breadcrumbs, page title and global actions, assistant, user menu, toasts)', file: 'public/assets/js/ps.js', usedBy: sharedBy(['buyer', 'supplier']) },
    { name: 'Workbench runtime (page head, tiles, views, table, bulk bar, preview drawer)', file: 'public/assets/js/workbench.js', usedBy: screens.filter((s) => s.archetype === 'workbench').map((s) => s.id) },
    { name: 'SVG charts (line, columns, bid ladder)', file: 'public/assets/js/ps-charts.js', usedBy: screens.filter((s) => s.features.includes('F-08')).map((s) => s.id) },
    { name: 'Component styles (ps-*)', file: 'src/styles/ps.css', usedBy: screens.map((s) => s.id) },
    { name: 'Documentation chrome (ds-*)', file: 'src/styles/docs.css', usedBy: sharedBy(['docs']) },
    { name: 'Design tokens', file: 'src/styles/tokens.css', usedBy: screens.map((s) => s.id) },
    { name: 'Studio inspector bridge (dev only)', file: 'src/main.js', usedBy: screens.map((s) => s.id) },
    { name: 'MUI theme mirror of the tokens (reference, linked from Foundations)', file: 'public/theme/mui-theme.js', usedBy: ['S-01'] },
    { name: 'Gilroy brand font files (Regular, Medium, SemiBold, Bold)', file: 'public/assets/fonts', usedBy: screens.map((s) => s.id) },
    { name: 'Item master data layer: sample items and requests, store, workflow routing, duplicate check, data quality score', file: 'public/assets/js/item-master.js', usedBy: itemScreens },
    { name: 'Item master shared UI helpers (dates, chips, fields, timeline, confirm dialog)', file: 'public/assets/js/item-ui.js', usedBy: itemScreens },
    { name: 'Item request form (stepper, similar-item panel, AI suggestions)', file: 'public/assets/js/item-request-form.js', usedBy: ['S-54'] },
    { name: 'Item request record runtime (requester, MDM, review, finance and approval views)', file: 'public/assets/js/item-request-view.js', usedBy: ['S-55', 'S-56', 'S-57', 'S-58', 'S-59'] },
  ],
  data: ['Inline sample data in each page script (window.PAGE for workbench pages)', 'Item master sample items and requests in public/assets/js/item-master.js, kept in localStorage under ps-im-v1'],
  tests: ['tests/links.test.js', 'tests/pages.test.js', 'tests/item-master.test.js'],
});
console.log(`wrote ${screens.length} screens`);
