/* Procuresprint — Workbench archetype runtime.
   A module landing declares window.PAGE and this file renders, in this fixed order:
     1. Page header ........ title + PAGE-LEVEL actions (page-specific extras, page overflow menu; Ask Me lives in the global header)
     2. Data cards ......... KPI cards (value + sub-text). Cards with `match` also filter the grid.
     3. Grid card
        a. Toolbar ......... GRID-LEVEL actions: title · search · Filters · Export · [extra] · More ⋮ · primary Create
        b. View tabs ....... with counts
        c. Bulk bar ........ replaces nothing, appears only while rows are selected (SELECTION actions)
        d. Table ........... ROW-LEVEL actions live in the sticky last column: one inline icon + a ⋮ menu
        e. Pager ........... rows per page · range · pages
   Static figures (from Figma) are used verbatim when a config gives them; otherwise counts are computed from rows. */
{
  const P = window.PAGE;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = n => Number(n).toLocaleString('en-IN');
  const lakh = n => n >= 1e7 ? `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr` : `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')} L`;
  const has = (r, t) => !t || (r.tags || '').split(' ').includes(t);
  const sum = (rows, k) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const slug = s => String(s).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  Object.assign(window, { esc, inr, lakh, sum });

  /* cell helpers available to page configs as H */
  const H = window.H = {
    esc, inr, lakh, sum,
    chip: (tone, label, icon) => `<span class="ps-chip${tone ? ' ps-chip--' + tone : ''}">${icon ? `<span class="ms" aria-hidden="true">${icon}</span>` : ''}${esc(label)}</span>`,
    status: (r, key = 'status') => { const s = P.statuses[r[key]] || ['', r[key]]; return H.chip(s[0], s[1], s[2]); },
    two: (a, b) => `<span class="cell-2line">${esc(a)}<small>${esc(b)}</small></span>`,
    id: (id, sub) => `<a class="cell-id" href="#" data-preview="${esc(id)}">${esc(id)}</a>${sub ? `<br><small class="t-body-sm ink-3">${esc(sub)}</small>` : ''}`,
    age: (txt, tone) => `<span class="ps-age${tone ? ' ps-age--' + tone : ''}">${esc(txt)}</span>`,
    prio: p => ({ high: '<span class="ps-prio ps-prio--high"><span class="ms" aria-hidden="true">keyboard_double_arrow_up</span>High</span>', medium: '<span class="ps-prio ps-prio--medium"><span class="ms" aria-hidden="true">keyboard_arrow_up</span>Medium</span>', low: '<span class="ps-prio ps-prio--low"><span class="ms" aria-hidden="true">remove</span>Low</span>' }[p] || ''),
    risk: (score, lvl) => `<span class="ps-risk ps-risk--${lvl}"><span class="num">${score}</span><span class="ps-risk__bar"><i style="width:${score}%"></i></span>${lvl[0].toUpperCase() + lvl.slice(1)}</span>`,
    progress: (pct, label) => `<span style="display:inline-flex;gap:8px;align-items:center;white-space:nowrap"><span class="ps-progress" style="height:6px;width:64px;flex:none"><i style="width:${pct}%"></i></span><span class="t-label-md" style="flex:none">${esc(label ?? pct + '%')}</span></span>`,
    ai: label => `<span class="ps-ai-tag"><span class="ms" aria-hidden="true">auto_awesome</span>${esc(label)}</span>`,
    yn: v => v === 'Yes' ? H.chip('info', 'Yes') : `<span class="ink-2">${esc(v)}</span>`,
    dash: v => v && v !== '-' && v !== '—' ? esc(v) : '<span class="ink-3" aria-label="None">—</span>',
  };

  const main = document.getElementById('main');
  const rows = P.rows;

  /* ---------- action renderers (one place, so every page groups actions the same way) ---------- */
  const attrs = a => a.href ? `href="${esc(a.href)}"` : `type="button" ${a.open ? `data-open="${esc(a.open)}"` : a.toast ? `data-toast="${esc(a.toast)}"` : 'data-todo'}`;
  const btn = (a, extra = '') => { const tag = a.href ? 'a' : 'button';
    return `<${tag} class="ps-btn ps-btn--${a.kind || 'secondary'}${extra}" ${attrs(a)}${a.aria ? ` aria-label="${esc(a.aria)}"` : ''}>${a.icon ? `<span class="ms${a.kind === 'ai' ? ' ms--fill' : ''}" aria-hidden="true">${a.icon}</span>` : ''}<span class="ps-btn__label">${esc(a.label)}</span></${tag}>`; };
  const menuItem = a => a === '-' ? '<hr>' : `<${a.href ? 'a' : 'button'} role="menuitem" ${a.href ? `href="${esc(a.href)}"` : `type="button" ${a.preview ? `data-preview="${esc(a.preview)}"` : a.toast ? `data-toast="${esc(a.toast)}"` : a.density ? `data-density-set="${a.density}"` : 'data-todo'}`}${a.danger ? ' class="is-danger"' : ''}>${a.icon ? `<span class="ms" aria-hidden="true">${a.icon}</span>` : ''}${esc(a.label)}</${a.href ? 'a' : 'button'}>`;
  const menu = (id, label, items, trigger, float) => `<div class="ps-menuwrap"><button class="${trigger}" type="button" data-menu="${id}" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(label)}"><span class="ms" aria-hidden="true">more_vert</span></button><div class="ps-menu${float ? ' ps-menu--float' : ''}" id="${id}" role="menu" aria-label="${esc(label)}">${items.map(menuItem).join('')}</div></div>`;

  /* legacy configs: `actions` → primary goes to the grid toolbar, AI to the header, the rest to the toolbar as secondary */
  const legacy = P.actions || [];
  const create = P.create || legacy.filter(a => a.kind === 'primary');
  const gridExtra = P.gridActions || legacy.filter(a => !a.kind || a.kind === 'secondary');
  const pageExtra = P.pageActions || legacy.filter(a => a.kind === 'ai');

  const switchNav = list => `<nav class="ps-switch" aria-label="${esc(P.title)} views">${list.map(x => x.current ? `<a aria-current="page" href="#">${esc(x.label)}</a>` : `<a href="${esc(x.href)}">${esc(x.label)}</a>`).join('')}</nav>`;
  window.PS_switchNav = switchNav;
  /* ---------- 1. page header ---------- */
  const pageActions = pageExtra.filter(a => a.open !== 'ps-assistant');
  const head = `
    <div class="ps-pagehead">
      <div class="ps-pagehead__text"><h1 class="t-headline">${esc(P.title)}</h1>${P.switch ? switchNav(P.switch) : ''}${P.meta ? `<p class="ps-pagehead__meta">${P.meta(rows)}</p>` : ''}</div>
      ${pageActions.length || P.pageMenu ? `<div class="ps-pagehead__actions" role="group" aria-label="Page actions">${pageActions.map(a => btn(a)).join('')}${P.pageMenu ? menu('pg-more', 'More page actions', P.pageMenu, 'ps-iconbtn ps-iconbtn--outlined') : ''}</div>` : ''}
    </div>`;

  /* ---------- 2. data cards ---------- */
  const cardHtml = t => {
    const m = t.match !== undefined ? rows.filter(r => has(r, t.match)) : rows;
    const value = t.value ?? (t.static ? t.static.value : m.length);
    const unit = t.unit ?? t.static?.unit;
    const sub = t.sub ?? (t.static ? t.static.meta : t.meta ? t.meta(m) : '');
    const inner = `<span class="ps-kpi__label">${t.icon ? `<span class="ps-kpi__icon" aria-hidden="true"><span class="ms">${t.icon}</span></span>` : ''}<span>${esc(t.label)}</span></span><span class="ps-kpi__value">${esc(value)}${unit ? `<small>${esc(unit)}</small>` : ''}</span>${sub ? `<span class="ps-kpi__sub">${sub}</span>` : ''}`;
    return t.match !== undefined && !t.static
      ? `<button class="ps-kpi ps-tile ps-kpi--${t.tone || 'brand'}" type="button" aria-pressed="false" data-target="wb-table" data-match="${esc(t.match)}">${inner}<span class="ps-kpi__hint">Filter list</span></button>`
      : `<div class="ps-kpi ps-kpi--${t.tone || 'brand'}">${inner}</div>`;
  };
  const cards = P.kpis || P.tiles;

  /* ---------- 3. grid ---------- */
  const cols = P.columns;
  const th = c => `<th class="${c.num ? 'num' : ''}${c.sticky ? ' col-sticky2' : ''}${c.opt ? ' col-opt' : ''}"${c.sort ? ' aria-sort="none"' : ''}>${c.sort ? `<button class="ps-sort" type="button">${esc(c.label)} <span class="ms" aria-hidden="true">swap_vert</span></button>` : esc(c.label)}</th>`;
  const td = (c, r) => `<td class="${c.num ? 'num' : ''}${c.sticky ? ' col-sticky2' : ''}${c.wrap ? ' wrap' : ''}${c.opt ? ' col-opt' : ''}" data-l="${esc(c.label)}"${c.sort ? ` data-sort="${esc(c.sortVal ? c.sortVal(r) : r[c.key])}"` : ''}>${c.render ? c.render(r) : esc(r[c.key])}</td>`;
  const selectable = P.bulk && P.bulk.length;
  const defaultRowMenu = r => [{ label: 'View details', icon: 'visibility', preview: r.id }, { label: 'Download PDF', icon: 'download', toast: `${r.id}.pdf downloaded` }, { label: 'Copy link', icon: 'link', toast: 'Link copied' }];
  const rowActions = r => {
    const inline = P.rowAction ? P.rowAction(r) : `<button class="ps-iconbtn ps-iconbtn--sm" type="button" aria-label="View ${esc(r.id)}" data-preview="${esc(r.id)}"><span class="ms" aria-hidden="true">visibility</span></button>`;
    const items = (P.rowMenu ? P.rowMenu(r) : defaultRowMenu(r)).filter(Boolean);
    return `<div class="ps-rowactions">${inline}${items.length ? menu(`rm-${slug(r.id)}`, `More actions for ${r.id}`, items, 'ps-iconbtn ps-iconbtn--sm', true) : ''}</div>`;
  };
  const rowHtml = r => `<tr data-tags="${esc(r.tags)}">${selectable ? `<td class="col-check col-sticky"><input type="checkbox" aria-label="Select ${esc(r.id)}"></td>` : ''}${cols.map(c => td(c, r)).join('')}<td class="col-actions">${rowActions(r)}</td></tr>`;

  const views = P.views || [{ label: 'All', match: '' }];
  const per = P.perPage || 10;
  const total = P.total ?? rows.length;
  const pages = P.pages ?? Math.max(1, Math.ceil(total / per));
  const pageBtns = () => { const n = pages; const list = n <= 6 ? [...Array(n)].map((_, i) => i + 1) : [1, 2, 3, 4, 5, '…', n];
    return list.map(p => p === '…' ? '<span class="ps-pager__gap" aria-hidden="true">…</span>' : `<button type="button"${p === 1 ? ' aria-current="page"' : ''} aria-label="Page ${p}">${p}</button>`).join(''); };
  const more = [
    { label: 'Show / hide columns', icon: 'view_column' },
    { label: 'Comfortable rows', icon: 'density_medium', density: 'comfortable' },
    { label: 'Compact rows', icon: 'density_small', density: 'compact' },
    ...(P.moreMenu ? ['-', ...P.moreMenu] : []),
    '-', { label: 'Print list', icon: 'print', toast: 'Sent to printer' },
  ];
  const toolbarBtns = [
    { label: 'Filters', icon: 'filter_list' },
    ...(P.noExport ? [] : [{ label: 'Export', icon: 'download', toast: `${P.tableTitle || 'List'} exported to Excel` }]),
    ...gridExtra,
  ];

  const grid = `
  <section class="ps-tablecard" data-density-scope aria-labelledby="wb-title">
    <div class="ps-toolbar" role="toolbar" aria-label="${esc(P.tableTitle || 'List')} actions" aria-orientation="horizontal">
      <h2 class="ps-toolbar__title" id="wb-title">${esc(P.tableTitle || 'All records')}</h2>
      <div class="ps-toolbar__search"><label class="sr-only" for="wb-q">Search ${esc(P.tableTitle || '')}</label><div class="ps-inputwrap"><span class="ms" aria-hidden="true">search</span><input class="ps-input" id="wb-q" type="search" placeholder="${esc(P.search || 'Search')}"></div></div>
      <div class="ps-toolbar__spacer"></div>
      <div class="ps-toolbar__group">
        ${toolbarBtns.map(a => btn(a, ' ps-btn--tb')).join('')}
        ${menu('wb-more', 'More list actions', more, 'ps-iconbtn ps-iconbtn--outlined')}
        ${create.length ? `<span class="ps-toolbar__divider" aria-hidden="true"></span>${create.map(a => btn({ ...a, kind: 'primary' }, ' ps-btn--tb')).join('')}` : ''}
      </div>
    </div>
    <div class="ps-tabs" role="tablist" aria-label="Views" data-target="wb-table">
      ${views.map((v, i) => `<button class="ps-tab" type="button" role="tab" aria-selected="${i === 0}" ${i ? 'tabindex="-1"' : ''} data-match="${esc(v.match)}">${esc(v.label)} <span class="ps-count">${esc(v.count ?? rows.filter(r => has(r, v.match)).length)}</span></button>`).join('')}
    </div>
    ${selectable ? `<div class="ps-bulkbar" data-bulk-for="wb-table" role="region" aria-label="Actions for selected rows"><span data-bulk-count>0 selected</span>${P.bulk.map(b => `<button class="ps-btn ps-btn--sm" type="button" data-todo>${esc(b)}</button>`).join('')}</div>` : ''}
    <div class="ps-table-scroll">
      <table class="ps-table ps-table--stack" id="wb-table">
        <caption class="sr-only">${esc(P.tableTitle || '')}. Select an ID or the eye icon to preview a record; ⋮ opens more actions.</caption>
        <thead><tr>${selectable ? '<th class="col-check col-sticky"><input type="checkbox" data-all aria-label="Select all visible rows"></th>' : ''}${cols.map(th).join('')}<th class="col-actions">Actions</th></tr></thead>
        <tbody>${rows.map(rowHtml).join('')}</tbody>
      </table>
      <div class="ps-state" data-empty-for="wb-table" hidden><div class="ps-state__art"><span class="ms" aria-hidden="true">filter_alt_off</span></div><div class="ps-state__title">Nothing in this view</div><p class="ps-state__text">No records match. Choose another view or clear the card filter.</p></div>
    </div>
    <div class="ps-pager">
      <div class="ps-pager__size"><label for="wb-per">Rows per page</label><select class="ps-select" id="wb-per"><option>10</option><option>25</option><option>50</option></select></div>
      <span class="ps-pager__range">Showing <span data-count-for="wb-table">${rows.length}</span> of ${esc(typeof total === 'number' ? inr(total) : total)}</span>
      <nav class="ps-pager__nav" aria-label="Pagination"><button type="button" disabled aria-label="Previous page"><span class="ms" aria-hidden="true">chevron_left</span></button>${pageBtns()}<button type="button" ${pages > 1 ? '' : 'disabled'} aria-label="Next page"><span class="ms" aria-hidden="true">chevron_right</span></button></nav>
    </div>
  </section>`;

  main.innerHTML = `
    ${head}
    ${P.banner || ''}
    ${P.above || ''}
    ${cards ? `<section class="ps-kpis" aria-label="Key figures">${cards.map(cardHtml).join('')}</section>` : ''}
    ${P.beforeGrid || ''}
    ${grid}
    ${P.side ? `<div class="ps-grid ps-grid--${P.sideCols || 2}">${P.side}</div>` : ''}
    ${P.below || ''}
    <p class="t-body-sm ink-3">${P.note || 'Sample data.'}</p>`;

  /* search box narrows the current view by text (works together with view tabs and card filters) */
  const q = main.querySelector('#wb-q');
  const applySearch = () => { const v = q.value.trim().toLowerCase(); const tab = main.querySelector('.ps-tabs [aria-selected="true"]'); const card = main.querySelector('.ps-kpi[aria-pressed="true"]');
    const match = card ? card.dataset.match : tab ? tab.dataset.match : ''; let n = 0;
    main.querySelectorAll('#wb-table tbody tr').forEach(r => { const ok = has(r.dataset, match) && (!v || r.textContent.toLowerCase().includes(v)); r.hidden = !ok; if (ok) n++; });
    main.querySelector('[data-count-for="wb-table"]').textContent = n; main.querySelector('[data-empty-for="wb-table"]').hidden = n > 0; };
  q.addEventListener('input', applySearch);
  main.addEventListener('click', e => { if (q.value && e.target.closest('.ps-tab, .ps-kpi[aria-pressed]')) setTimeout(applySearch, 0); });

  /* density from the More menu */
  document.addEventListener('click', e => { const d = e.target.closest('[data-density-set]'); if (!d) return; main.querySelector('[data-density-scope]').setAttribute('data-density', d.dataset.densitySet); PS.toast(`${d.textContent.trim()} on`); });

  /* page buttons (prototype: only page 1 has data) */
  main.querySelector('.ps-pager__nav').addEventListener('click', e => { const b = e.target.closest('button[aria-label^="Page"]'); if (!b || b.getAttribute('aria-current')) return; PS.toast('Sample data only has page 1.'); });

  /* ---------- preview drawer ---------- */
  const pv = P.preview;
  if (pv) {
    const d = document.createElement('dialog');
    d.className = 'ps-drawer'; d.id = 'wb-preview'; d.setAttribute('aria-labelledby', 'wb-pv-t');
    document.body.append(d);
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-preview]'); if (!a) return; e.preventDefault();
      const r = rows.find(x => x.id === a.dataset.preview); if (!r) return;
      const tl = pv.timeline ? pv.timeline(r) : null;
      d.innerHTML = `
        <div class="ps-drawer__head"><div style="flex:1"><h2 class="ps-drawer__title" id="wb-pv-t">${esc(pv.title(r))}</h2><p class="t-body-sm ink-3">${esc(pv.sub ? pv.sub(r) : '')}</p></div>${pv.chip ? pv.chip(r) : P.statuses ? H.status(r) : ''}<button class="ps-iconbtn" type="button" data-close aria-label="Close preview"><span class="ms" aria-hidden="true">close</span></button></div>
        <div class="ps-drawer__body">
          ${pv.alert ? pv.alert(r) : ''}
          <dl class="ps-dl">${pv.fields.map(([k, f]) => `<div><dt>${esc(k)}</dt><dd>${f(r)}</dd></div>`).join('')}</dl>
          ${pv.extra ? pv.extra(r) : ''}
          ${tl ? `<div><h3 class="t-title-sm" style="margin-bottom:8px">${esc(pv.timelineTitle || 'Progress')}</h3><ol class="ps-timeline">${tl.map(([state, title, meta]) => `<li><span class="ps-timeline__mark${state === 'done' ? ' ps-timeline__mark--done' : state === 'now' ? ' ps-timeline__mark--now' : ''}"><span class="ms" aria-hidden="true">${state === 'done' ? 'check' : state === 'now' ? 'hourglass_top' : 'more_horiz'}</span></span><div><div class="ps-timeline__title">${esc(title)}</div><div class="ps-timeline__meta">${esc(meta || '')}</div></div></li>`).join('')}</ol></div>` : ''}
        </div>
        <div class="ps-drawer__foot"><button class="ps-btn ps-btn--text" type="button" data-close>Close</button>${pv.record && pv.record(r) ? `<a class="ps-btn ps-btn--secondary" href="${esc(pv.record(r))}">Open full record</a>` : '<button class="ps-btn ps-btn--secondary" type="button" data-todo>Open full record</button>'}${pv.primary && pv.primary(r) ? (pv.primaryHref && pv.primaryHref(r) ? `<a class="ps-btn ps-btn--primary" href="${esc(pv.primaryHref(r))}">${esc(pv.primary(r))}</a>` : `<button class="ps-btn ps-btn--primary" type="button" data-todo>${esc(pv.primary(r))}</button>`) : ''}</div>`;
      document.querySelectorAll('.ps-menu.is-open').forEach(mn => mn.classList.remove('is-open'));
      d.showModal();
    });
  }
}

