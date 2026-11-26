/* Procuresprint — Item request form (BRD S01 stepper + S02 duplicate panel + level 1 AI suggestions).
   One form serves New, Update, Extend and Block / Unblock / Inactivate; ?id= edits a draft or a sent back request;
   ?type= and ?item= start a change on an existing item. Needs item-master.js and item-ui.js. */
{
  const U = IMUI, ME = 'John Doe', qs = U.qs;
  const $ = id => document.getElementById(id);
  const main = document.getElementById('main');
  const GROUP = ['Block', 'Unblock', 'Inactivate'];
  const STEPS = { New: ['Request', 'Item details', 'Plants', 'Review and submit'], Update: ['Request', 'Changes', 'Review and submit'], Extend: ['Request', 'Plant', 'Review and submit'], Block: ['Request', 'Review and submit'] };
  const stepsFor = t => STEPS[GROUP.includes(t) ? 'Block' : t];
  const STEP_ERR = { New: [['just', 'needby', 'prio', 'target'], ['desc', 'long', 'cat', 'uom', 'gtin', 'att', 'price'], ['plants']], Update: [['just', 'needby', 'prio', 'target'], ['chg']], Extend: [['just', 'needby', 'prio', 'target'], ['plants']], Block: [['just', 'needby', 'prio', 'target']] };
  const TAX = ['GST 5%', 'GST 12%', 'GST 18%', 'GST 28%', 'GST 18% (SAC)', 'GST 12% (SAC)'];
  const HAZ = ['None', 'Class 3', 'Class 8', 'Class 9'];
  const TYPE_NOTE = { Goods: 'Physical items. Goods receipt on arrival, storage location per plant.', Service: 'Work or time. Service entry instead of goods receipt, no storage location.', Asset: 'Capital items. Finance sets the asset class before approval.' };

  let r, step = 1, done = new Set(), dups = [], ai = null, dirty = false;
  const existing = qs.get('id') && IM.getReq(qs.get('id'));
  if (existing) { r = existing; if (existing.requester !== ME && existing.status !== 'Draft') location.replace('item-request.html?id=' + existing.id); }
  else { r = IM.blank(GROUP.includes(qs.get('type')) || ['New', 'Update', 'Extend'].includes(qs.get('type')) ? qs.get('type') : 'New', 'Goods', ME); }
  const setTarget = code => { const it = IM.getItem(code); if (!it) return; r.target = code; r.itemType = it.type; r.f.desc = it.desc; r.f.cat = it.cat; r.f.hazard = it.hazard; r.f.plants = r.type === 'Extend' ? [] : it.plants.map(p => p.code); r.changes = []; r.replacement = ''; };
  if (qs.get('item') && !existing) setTarget(qs.get('item'));
  const target = () => r.target && IM.getItem(r.target);
  const names = () => stepsFor(r.type);
  const isNew = () => r.type === 'New';
  const svc = () => r.itemType === 'Service';
  const ids = () => (STEP_ERR[GROUP.includes(r.type) ? 'Block' : r.type][step - 1] || []);
  const heading = () => ({ New: 'New item request', Update: 'Request a change', Extend: 'Extend an item to a plant', Block: 'Block or inactivate an item', Unblock: 'Unblock an item', Inactivate: 'Inactivate an item' }[r.type]);

  const save = (toast) => { dirty = false; IM.saveRequest(r); if (toast) PS.toast(`Draft ${r.id} saved`); };
  const ctl = (k, label, html, o = {}) => U.field(k, label, html, o);
  const val = k => U.esc(r.f[k] ?? '');
  const input = (k, o = {}) => `<input class="ps-input" id="${k}" data-f="${k}" value="${val(k)}"${o.max ? ` maxlength="${o.max}"` : ''}${o.type ? ` type="${o.type}"` : ''}${o.mode ? ` inputmode="${o.mode}"` : ''}${o.ph ? ` placeholder="${U.esc(o.ph)}"` : ''}${o.up ? ' style="text-transform:uppercase"' : ''} aria-describedby="${k}-e${o.help ? ' ' + k + '-h' : ''}">`;
  const select = (k, opts, o = {}) => `<select class="ps-select" id="${k}" data-f="${k}" aria-describedby="${k}-e">${opts}</select>`;
  const seg = (id, items, cur) => `<div class="ps-seg" role="group" aria-label="${id}">${items.map(([v, l]) => `<button type="button" data-seg="${id}" data-v="${v}" aria-pressed="${v === cur}">${U.esc(l)}</button>`).join('')}</div>`;

  /* ---------- step 1 ---------- */
  const s1 = () => {
    const grp = GROUP.includes(r.type), t = target();
    let h = `<div class="ps-field span-all"><span class="ps-field__label" id="rt-l">Request type</span>${seg('rtype', [['New', 'New item'], ['Update', 'Update'], ['Extend', 'Extend to plant'], [grp ? r.type : 'Block', 'Block, unblock or inactivate']], grp ? r.type : r.type)}<span class="ps-field__help">${{ New: 'Create an item code. Search first: one item code serves every plant.', Update: 'Propose changes to an active item. The code and item type stay locked.', Extend: 'Use an existing item code in another plant. No new code is created.', Block: 'Change the lifecycle of an item. A reason is mandatory.' }[grp ? 'Block' : r.type]}</span></div>`;
    if (isNew()) h += `<fieldset class="ps-field span-all" style="border:0;padding:0"><legend class="ps-field__label">Item type</legend><div class="ps-grid ps-grid--3">${['Goods', 'Service', 'Asset'].map(t => `<label class="ps-card ps-radiocard"><span class="ps-radio"><input type="radio" name="itype" value="${t}"${r.itemType === t ? ' checked' : ''}><strong>${t}</strong></span><span class="t-body-sm ink-3">${TYPE_NOTE[t]}</span></label>`).join('')}</div></fieldset>`;
    else h += `<div class="ps-field span-all"><label class="ps-field__label" for="tq">Item</label><div class="ps-combo"><div class="ps-inputwrap"><span class="ms" aria-hidden="true">search</span><input class="ps-input" id="tq" type="search" role="combobox" aria-expanded="false" aria-controls="tq-l" autocomplete="off" placeholder="Item code, description or part number" aria-describedby="target-e"></div><ul class="ps-combo__list" id="tq-l" role="listbox" hidden></ul></div><span class="ps-field__error" id="target-e" hidden></span>
      ${t ? `<div class="ps-card" style="margin-top:8px"><div class="ps-card__body" style="display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap"><div><strong>${U.esc(t.code)}</strong> · ${U.esc(t.desc)}<div class="t-body-sm ink-3">${U.esc(t.type)} · ${U.esc(IM.CATS[t.cat].path)} · ${t.plants.map(p => U.esc(p.name)).join(', ')}</div></div>${U.itemChip(t.status)}</div></div>` : ''}</div>`;
    if (grp) h += ctl('act', 'Action', select('act', GROUP.map(a => `<option value="${a}"${r.type === a ? ' selected' : ''}>${{ Block: 'Block (compliance, quality, ban)', Unblock: 'Unblock', Inactivate: 'Inactivate (obsolete or discontinued)' }[a]}</option>`).join('')), { help: t ? (t.status === 'Active' ? 'Unblock is for blocked items.' : '') : '' });
    if (r.type === 'Inactivate') h += ctl('repl', 'Replacement item', select('repl', U.options(Object.fromEntries(IM.db().items.filter(i => i.status === 'Active' && i.code !== r.target).map(i => [i.code, i.code + ' · ' + i.desc])), r.replacement, 'No replacement'), {}), { opt: true, help: 'Users are redirected to it when they search for the inactive item.' });
    h += ctl('priority', 'Priority', select('priority', ['Low', 'Medium', 'High', 'Critical'].map(p => `<option${r.f.priority === p ? ' selected' : ''}>${p}</option>`).join('')), { help: 'Drives the MDM queue order.' });
    h += ctl('needBy', 'Required by', input('needBy', { type: 'date' }), { help: 'The date you need the item code.' });
    if (['High', 'Critical'].includes(r.f.priority)) h += ctl('prio', 'Reason for priority', `<input class="ps-input" id="prio" data-f="priorityReason" value="${val('priorityReason')}" aria-describedby="prio-e">`, { span: true });
    h += ctl('just', GROUP.includes(r.type) ? 'Reason' : 'Business justification', `<textarea class="ps-textarea" id="just" data-f="justification" maxlength="1000" aria-describedby="just-e">${val('justification')}</textarea>`, { span: true, help: 'Who needs it and why. Up to 1,000 characters.' });
    h += `<div class="ps-field span-all"><span class="ps-field__label">Company and plant</span><span class="ps-field__help">Mindsprint Digital · IN01. Your default plant is filled in the plants step.</span></div>`;
    return `<div class="ps-formgrid">${h}</div>`;
  };

  /* ---------- step 2 (New) ---------- */
  const aiTag = k => ai?.applied?.includes(k) ? `<span class="ps-ai-tag"><span class="ms" aria-hidden="true">auto_awesome</span>AI ${ai.conf}%</span>` : '';
  const s2New = () => {
    const sv = svc(), cat = IM.CATS[r.f.cat], aa = r.itemType === 'Asset' ? 'A (asset)' : 'K (cost centre)', pb = sv ? 'Rate or flat amount' : 'Quantity';
    const uoms = sv ? { JOB: 'Job', YR: 'Year' } : IM.UOM;
    let h = `<div class="ps-field span-2"><span class="ps-field__help">Request type New · item type ${U.esc(r.itemType)}. Only the fields for ${r.itemType === 'Service' ? 'a service' : 'a ' + r.itemType.toLowerCase()} are shown.</span></div>`;
    h += ctl('desc', 'Short description', input('desc', { max: 40, up: true }), { help: '40 characters, upper case. Noun first, then the details.', ai: aiTag('desc') });
    h += ctl('cat', 'Material category', select('cat', U.options(IM.CATS, r.f.cat, 'Choose the lowest level')), { ai: aiTag('cat'), help: cat ? 'UNSPSC ' + cat.unspsc + ' · default GL ' + cat.gl : 'Defaults UNSPSC and GL, and decides the buyer group.' });
    h += ctl('long', 'Long description and specification', `<textarea class="ps-textarea" id="long" data-f="long" maxlength="4000" aria-describedby="long-e">${val('long')}</textarea>`, { span: true, help: 'Size, grade, standard, colour. Specifications live here.' });
    h += ctl('uom', 'Base unit', select('uom', U.options(uoms, r.f.uom, 'Choose a unit')), { ai: aiTag('uom'), help: sv ? 'Services use time or job units.' : 'You buy and price in the base unit only.' });
    h += ctl('hs', sv ? 'SAC code' : 'HSN or HS code', input('hs', { mode: 'numeric' }), { ai: aiTag('hs'), help: sv ? 'Services use a SAC code.' : 'HS 6 digits plus the local extension for India.' });
    if (!sv) {
      h += ctl('mfr', 'Manufacturer', input('mfr', { max: 100 }), { opt: true });
      h += ctl('mpn', 'Manufacturer part number', input('mpn', { max: 40 }), { opt: true, help: 'Used for the duplicate check.' });
      h += ctl('country', 'Country of origin', input('country'), { opt: true });
      h += ctl('gtin', 'GTIN or barcode', input('gtin', { mode: 'numeric' }), { opt: true, help: '8, 12, 13 or 14 digits. The check digit is validated.' });
      h += ctl('hazard', 'Hazard class', select('hazard', HAZ.map(x => `<option${r.f.hazard === x ? ' selected' : ''}>${x}</option>`).join('')), { help: 'A hazardous item needs a safety data sheet.' });
      h += `<div class="ps-field"><span class="ps-field__label">Quality inspection at receipt</span><label class="ps-switch"><input type="checkbox" role="switch" data-f="qi"${r.f.qi ? ' checked' : ''}><span>${r.f.qi ? 'Yes' : 'No'}</span></label></div>`;
    }
    h += ctl('price', 'Standard price', `<div class="ps-inputwrap"><input class="ps-input" id="price" data-f="price" inputmode="decimal" value="${val('price')}" aria-describedby="price-e"><select class="ps-select" id="cur" data-f="cur" aria-label="Currency" style="max-width:88px"><option${r.f.cur === 'INR' ? ' selected' : ''}>INR</option><option${r.f.cur === 'USD' ? ' selected' : ''}>USD</option></select></div>`, { opt: true, help: 'Used as the estimate on purchase requests.' });
    if (!sv) h += ctl('lead', 'Lead time (days)', input('lead', { mode: 'numeric' }), { opt: true });
    h += `<div class="ps-field"><span class="ps-field__label">Catalogue eligible</span><label class="ps-switch"><input type="checkbox" role="switch" data-f="catalog"${r.f.catalog !== false ? ' checked' : ''}><span>${r.f.catalog !== false ? 'Yes' : 'No, buy through RFx'}</span></label></div>`;
    h += `<div class="ps-field span-2"><span class="ps-field__help">Account assignment ${aa} and price basis ${pb} are set from the item type and cannot be edited.</span></div>`;
    return `<div class="ps-formgrid">${h}</div>`;
  };

  /* ---------- step 2 (Update) ---------- */
  const UPD = [['Description', 'desc', t => t.desc], ['Manufacturer', 'mfr', t => t.mfr], ['Manufacturer part number', 'mpn', t => t.mpn], ['Tax code', 'tax', t => t.plants[0]?.tax || ''], ['Lead time (days)', 'lead', t => String(t.lead || '')], ['Standard price', 'price', t => String(t.price || '')]];
  const s2Update = () => { const t = target(); if (!t) return '<p class="ink-3">Choose an item in the first step.</p>';
    return `<div class="ps-alert ps-alert--info" role="note"><span class="ms" aria-hidden="true">lock</span><div><div class="ps-alert__title">Item code ${U.esc(t.code)} and item type ${U.esc(t.type)} are locked</div><div class="ps-alert__text">To change either, block the item and request a new one (BR41). Changes to tax, unit, category, asset class and description need an approver.</div></div></div>
      <div class="ps-table-scroll"><table class="ps-table"><caption class="sr-only">Current and proposed values</caption><thead><tr><th>Field</th><th>Current value</th><th>New value</th></tr></thead><tbody>${UPD.map(([l, k, g], i) => { const ch = (r.changes || []).find(c => c[0] === l);
        return `<tr><td data-l="Field">${l}</td><td data-l="Current value">${U.esc(g(t)) || '<span class="ink-3">—</span>'}</td><td data-l="New value"><label class="sr-only" for="chg${i}">New ${l}</label><input class="ps-input" id="chg${i}" data-chg="${l}" data-old="${U.esc(g(t))}" value="${U.esc(ch ? ch[2] : '')}" placeholder="Unchanged"></td></tr>`; }).join('')}</tbody></table></div><span class="ps-field__error" id="chg-e" hidden></span>`; };

  /* ---------- step 2 (Extend) and step 3 (New) ---------- */
  const plantsHtml = () => {
    if (!r.f.tax) r.f.tax = svc() ? 'GST 18% (SAC)' : 'GST 18%';
    if (!r.f.storage && !svc() && r.f.plants[0]) r.f.storage = (r.f.storageBy || {})[r.f.plants[0]] || IM.PLANTS[r.f.plants[0]][1];
    const t = target(), taken = t ? t.plants.map(p => p.code) : [];
    const list = Object.entries(IM.PLANTS).filter(([c]) => !taken.includes(c) || r.type !== 'Extend');
    return `<fieldset class="ps-field span-2" style="border:0;padding:0"><legend class="ps-field__label">${r.type === 'Extend' ? 'Extend to plant' : 'Plants where the item will be used'}</legend>
      <div class="ps-stack" style="gap:8px">${list.map(([c, [n, wh]]) => `<div class="ps-card"><div class="ps-card__body" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;justify-content:space-between"><label class="ps-check"><input type="checkbox" data-plant="${c}"${r.f.plants.includes(c) ? ' checked' : ''}><span><strong>${n}</strong> ${c}</span></label>${svc() ? '' : `<label class="t-body-sm ink-2" for="st-${c}" style="display:flex;gap:8px;align-items:center">Storage location<select class="ps-select" id="st-${c}" data-storage="${c}" style="width:auto"${r.f.plants.includes(c) ? '' : ' disabled'}>${['WH01', 'WH02', 'WH03'].map(w => `<option${(r.f.storageBy?.[c] || wh) === w ? ' selected' : ''}>${w}</option>`).join('')}</select></label>`}</div></div>`).join('') || '<p class="ink-3">The item is already extended to every plant.</p>'}</div><span class="ps-field__error" id="plants-e" hidden></span></fieldset>
      ${ctl('tax', 'Default tax code for the plant country', select('tax', TAX.filter(x => svc() ? /SAC/.test(x) || true : !/SAC/.test(x)).map(x => `<option${r.f.tax === x ? ' selected' : ''}>${x}</option>`).join('')), { help: 'India plants. Country of origin never decides the tax code (BR07).' })}
      ${isNew() ? `<div class="ps-field span-2"><span class="ps-field__label" id="att-l">Attachments${r.f.hazard && r.f.hazard !== 'None' ? '' : ' <span class="ps-field__opt">(optional)</span>'}</span><div class="ps-drop" aria-labelledby="att-l"><span class="ms" aria-hidden="true">upload_file</span><div><label for="att-in" style="cursor:pointer"><strong>Choose files</strong></label> <input type="file" id="att-in" class="sr-only" multiple><div class="ps-field__help">Spec sheet, datasheet, safety data sheet. This sample keeps the file names only.</div></div></div><ul id="att-list" class="t-body-sm" style="margin:0;padding-left:18px">${(r.f.attachments || []).map(a => `<li>${U.esc(a)} <button type="button" class="ps-btn ps-btn--text ps-btn--sm" data-rmatt="${U.esc(a)}">Remove</button></li>`).join('')}</ul><span class="ps-field__error" id="att-e" hidden></span></div>` : ''}`;
  };
  const s2Extend = () => `<div class="ps-formgrid">${plantsHtml()}</div>`;
  const s3New = s2Extend;

  /* ---------- review ---------- */
  const reviewHtml = () => {
    const t = target(), f = r.f, ap = IM.approvalFor(r), sub = (n, label, body) => `<div class="ps-card"><div class="ps-card__body"><h3 class="t-title-sm" style="display:flex;justify-content:space-between;align-items:center">${label}<button type="button" class="ps-btn ps-btn--text ps-btn--sm" data-go="${n}">Edit</button></h3>${body}</div></div>`;
    const rows = [];
    rows.push(sub(1, 'Request', `<p><strong>${U.esc(r.type)}</strong>${isNew() ? ' · ' + U.esc(r.itemType) : t ? ' · ' + U.esc(t.code) : ''}</p><p class="t-body-sm ink-2">${U.esc(f.justification)}</p><p class="t-body-sm ink-3">${U.esc(f.priority)} priority · required by ${U.fmtDate(f.needBy)}</p>`));
    if (isNew()) rows.push(sub(2, 'Item details', `<p><strong>${U.esc(f.desc)}</strong></p><p class="t-body-sm ink-2">${U.esc(f.long)}</p><p class="t-body-sm ink-3">${U.esc(IM.CATS[f.cat]?.path || '')} · ${U.esc(IM.UOM[f.uom] || '')}${f.mfr ? ' · ' + U.esc(f.mfr) + ' ' + U.esc(f.mpn) : ''}</p>`));
    if (r.type === 'Update') rows.push(sub(2, 'Changes', (r.changes || []).map(c => `<p class="t-body-sm">${U.esc(c[0])}: ${U.esc(c[1] || '—')} to <strong>${U.esc(c[2])}</strong></p>`).join('') || '<p class="ink-3">No changes</p>'));
    if (isNew() || r.type === 'Extend') rows.push(sub(isNew() ? 3 : 2, 'Plants', `<p>${f.plants.map(p => U.esc(IM.PLANTS[p][0])).join(', ') || '—'}</p><p class="t-body-sm ink-3">Tax code ${U.esc(f.tax || 'default')}</p>`));
    const flow = IM.steps({ ...r, status: 'Draft' }).map(s => [s.state === 'now' ? 'todo' : s.state, s.label, s.who]);
    return `<div class="ps-grid ps-grid--2">${rows.join('')}</div><div><h3 class="t-title-sm" style="margin-bottom:8px">What happens next</h3>${U.timeline(IM.steps({ ...r, status: 'Draft' }).map(s => ({ ...s, state: 'todo' })))}<p class="t-body-sm ink-3">${ap ? 'Approval rule: ' + U.esc(ap.rule) + '.' : 'No approval rule applies, so MDM completes it.'} Target time is 24 hours per step.</p></div>`;
  };

  /* ---------- duplicate panel (S02) and AI panel ---------- */
  const TONE = { exact: ['danger', 'Exact duplicate'], blocked: ['danger', 'Blocked item'], inactive: ['info', 'Inactive item'], similar: ['warning', 'Similar item'], info: ['info', 'Possibly related'], diffType: ['warning', 'Same name, other item type'], pending: ['warning', 'Pending request'] };
  const blocking = () => dups.some(m => ['exact', 'blocked'].includes(m.kind));
  const needsReason = () => dups.some(m => ['similar', 'diffType', 'pending'].includes(m.kind)) && !blocking();
  const dupHtml = () => {
    if (!isNew()) return '';
    const body = dups.length ? dups.map(m => { const [tone, label] = TONE[m.kind], plantOk = m.plants?.length && !m.isReq && !r.f.plants.every(p => m.plants.includes(p));
      return `<div class="ps-card"><div class="ps-card__body" style="gap:8px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong>${U.esc(m.code)}</strong>${U.chip(tone, label)}</div><div>${U.esc(m.desc)}</div><div class="t-body-sm ink-3">${U.esc(m.type)} · ${m.pct} percent match · ${U.esc(m.rule)}</div>
        ${m.kind === 'blocked' ? '<div class="t-body-sm" style="color:var(--ps-danger-fg)">This item is blocked and cannot be created again.</div>' : ''}${m.kind === 'inactive' && m.replacement ? `<div class="t-body-sm">Use replacement <a href="item-record.html?code=${U.esc(m.replacement)}">${U.esc(m.replacement)}</a> instead.</div>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap">${!m.isReq && m.kind !== 'blocked' ? `<button type="button" class="ps-btn ps-btn--secondary ps-btn--sm" data-use="${U.esc(m.code)}">Use this item</button>` : ''}${!m.isReq && plantOk && m.kind !== 'blocked' ? `<button type="button" class="ps-btn ps-btn--secondary ps-btn--sm" data-extend="${U.esc(m.code)}">Extend to my plant</button>` : ''}</div></div></div>`; }).join('')
      : `<p class="t-body-sm ink-3">${(r.f.desc || '').length < 4 ? 'Type a description. Matches across all plants appear here while you type.' : 'No similar item found across all plants. You can continue.'}</p>`;
    const reason = needsReason() ? `<div class="ps-field"><label class="ps-field__label" for="dupr">Not a duplicate, because</label><textarea class="ps-textarea" id="dupr" style="min-height:64px" aria-describedby="dupr-e">${U.esc(r.dup?.reason || '')}</textarea><span class="ps-field__error" id="dupr-e" hidden></span><span class="ps-field__help">MDM confirms your reason.</span></div>` : '';
    return `<section class="ps-section" aria-labelledby="dup-t"><div class="ps-section__head"><div><h2 class="ps-section__title" id="dup-t">Similar items${dups.length ? ' (' + dups.length + ')' : ''}</h2><p class="ps-section__sub">Checked while you type, across all plants.</p></div></div><div class="ps-section__body" aria-live="polite">${blocking() ? '<div class="ps-alert ps-alert--danger" role="alert"><span class="ms" aria-hidden="true">block</span><div><div class="ps-alert__title">You cannot continue with this item</div><div class="ps-alert__text">Use the existing item or extend it to your plant.</div></div></div>' : ''}${body}${reason}</div></section>`;
  };
  const aiHtml = () => { if (!isNew() || step !== 2) return ''; if (!ai) return `<div class="ps-ai"><div class="ps-ai__head"><span class="ms" aria-hidden="true">auto_awesome</span>Describe with AI</div><p class="ps-ai__why">Type what you need in the short description, for example "Lenovo ThinkPad T14 16GB". Suggestions for category, units and codes appear here.</p></div>`;
    return `<div class="ps-ai"><div class="ps-ai__head"><span class="ms" aria-hidden="true">auto_awesome</span>Suggestions <span class="ps-ai-tag">${ai.conf >= 90 ? 'High confidence' : ai.conf >= 70 ? 'Check these' : 'Low confidence'} ${ai.conf}%</span></div>
      <p class="ps-ai__text">${ai.conf < 70 ? 'Not sure enough to fill anything in. Tell me more about the item.' : `${U.esc(ai.desc)}<br><span class="t-body-sm">${U.esc(ai.path)} · UNSPSC ${ai.unspsc} · HS ${ai.hs} · ${U.esc(IM.UOM[ai.uom])}</span>`}</p><p class="ps-ai__why">Suggestions follow the text you typed. You approve every field. They never set tax, GL or asset class.</p>
      ${ai.conf >= 70 ? '<div class="ps-ai__actions"><button type="button" class="ps-btn ps-btn--primary ps-btn--sm" id="ai-use">Use these</button><button type="button" class="ps-btn ps-btn--text ps-btn--sm" id="ai-hide">Dismiss</button></div>' : ''}</div>`; };

  /* ---------- shell ---------- */
  const stepper = () => `<ol class="ps-stepper" aria-label="Progress">${names().map((n, i) => { const k = i + 1, st = k === step ? 'current' : done.has(k) ? 'done' : ''; return `<li class="ps-step${st ? ' ps-step--' + st : ''}"${k === step ? ' aria-current="step"' : ''}><button type="button" class="ps-step__btn" data-go="${k}"${k > step && !done.has(k - 1) && k !== 1 ? ' disabled' : ''}><span class="ps-step__mark">${st === 'done' ? '<span class="ms" aria-hidden="true">check</span>' : k}</span><span class="ps-step__text">${n}</span></button></li>`; }).join('')}</ol>`;
  const body = () => { const n = names(), last = step === n.length; if (last) return reviewHtml(); if (step === 1) return s1(); if (isNew()) return step === 2 ? s2New() : s3New(); return r.type === 'Update' ? s2Update() : s2Extend(); };
  const subTitle = () => { const n = names()[step - 1]; return { Request: ['What do you need, and why?', 'Pick the request type first. The form shows only what applies.'], 'Item details': ['Describe the item', 'Search before you create. Matches appear beside the form.'], Plants: ['Plants, storage and attachments', 'One item code, many plants.'], Plant: ['Which plant?', 'Only plant data is added. The item code stays the same.'], Changes: ['What should change?', 'Old and new values are kept in the audit trail.'], 'Review and submit': ['Check and submit', 'You can still edit any step.'] }[n]; };
  const draw = (focus) => {
    const withSide = isNew() && step === 2, last = step === names().length;
    main.innerHTML = `<div class="ps-pagehead"><div class="ps-pagehead__text"><a class="ps-back" href="item-requests.html"><span class="ms" aria-hidden="true">arrow_back</span>Item requests</a><h1 class="t-headline">${heading()}</h1><p class="ps-pagehead__meta">${r.status === 'Draft' ? 'Draft ' : ''}${U.esc(r.id)}${existing ? ' · ' + U.esc(r.status) : ' · saved when you continue'}</p></div></div>
      <div class="ps-section" style="padding:16px 20px">${stepper()}</div>
      ${r.status === 'Sent back' ? `<div class="ps-alert ps-alert--warning" role="note"><span class="ms" aria-hidden="true">reply</span><div><div class="ps-alert__title">Sent back to you</div><div class="ps-alert__text">${U.esc(r.hist.filter(h => h.action === 'Sent back').at(-1)?.comment || '')}</div></div></div>` : ''}
      <div id="errs" class="ps-alert ps-alert--danger ps-errsum" role="alert" tabindex="-1" hidden></div>
      <div class="${withSide ? 'ps-split' : ''}"><section class="ps-section" aria-labelledby="st-t"><div class="ps-section__head"><div><h2 class="ps-section__title" id="st-t">${subTitle()[0]}</h2><p class="ps-section__sub">${subTitle()[1]}</p></div></div><div class="ps-section__body">${body()}</div></section>
      ${withSide ? `<div class="ps-split__aside">${aiHtml()}<div id="dup">${dupHtml()}</div></div>` : ''}</div>
      <div class="ps-actionbar"><div class="ps-actionbar__sum"><div><span>Request type</span><b>${U.esc(r.type)}</b></div><div><span>Step</span><b>${step} of ${names().length}</b></div></div><div class="ps-actionbar__btns"><button type="button" class="ps-btn ps-btn--text" id="draft">Save draft</button><button type="button" class="ps-btn ps-btn--secondary" id="back"${step === 1 ? ' disabled' : ''}>Back</button><button type="button" class="ps-btn ps-btn--primary" id="next">${last ? 'Submit request' : 'Continue'}</button></div></div>`;
    if (focus) $('st-t')?.focus?.();
    if (step === 1 && !isNew()) wireTarget();
  };

  const wireTarget = () => { const q = $('tq'), l = $('tq-l'); if (!q) return;
    q.addEventListener('input', () => { const v = q.value.trim().toLowerCase(); const m = v ? IM.db().items.filter(i => (i.code + i.desc + i.mpn).toLowerCase().includes(v)).slice(0, 6) : [];
      l.innerHTML = m.map(i => `<li class="ps-combo__opt" role="option" aria-selected="false" data-pick="${i.code}"><span>${U.esc(i.desc)}</span><span class="ps-combo__sub">${i.code} · ${U.esc(i.status)}</span></li>`).join('') || (v ? '<li class="ps-combo__opt" role="option" aria-disabled="true" aria-selected="false">No item matches</li>' : ''); l.hidden = !v; q.setAttribute('aria-expanded', String(!!v)); }); };

  /* ---------- behaviour ---------- */
  const refreshSide = () => { dups = isNew() ? IM.dupCheck(r.f, r.itemType, r.f.plants, r.id) : []; if ($('dup')) $('dup').innerHTML = dupHtml(); };
  const timers = {}; const later = (fn, key = 'dup') => { clearTimeout(timers[key]); timers[key] = setTimeout(fn, 200); };
  const runAi = () => { const s = IM.suggest(r.f.desc); ai = s ? { ...s, applied: [] } : null; const box = document.querySelector('.ps-split__aside .ps-ai'); if (box) box.outerHTML = aiHtml(); };
  main.addEventListener('input', e => { const t = e.target; dirty = true;
    if (t.dataset.f) { const k = t.dataset.f; r.f[k] = t.type === 'checkbox' ? t.checked : t.value; if (k === 'desc') { r.f.desc = t.value.toUpperCase().replace(/[^A-Z0-9 ,.\-/"']/g, ''); if (t.value !== r.f.desc) t.value = r.f.desc; later(refreshSide); later(runAi, 'ai'); } if (['mfr', 'mpn', 'gtin'].includes(k)) later(refreshSide); U.setErr(t.id, ''); }
    if (t.dataset.chg) { const l = t.dataset.chg; r.changes = (r.changes || []).filter(c => c[0] !== l); if (t.value.trim() && t.value.trim() !== t.dataset.old) r.changes.push([l, t.dataset.old, t.value.trim()]); U.setErr('chg', ''); }
    if (t.id === 'dupr') r.dup = { ...(r.dup || {}), decision: 'Not a duplicate', reason: t.value };
  });
  main.addEventListener('change', e => { const t = e.target; dirty = true;
    if (t.dataset.f === 'qi' || t.dataset.f === 'catalog') { r.f[t.dataset.f] = t.checked; t.nextElementSibling.textContent = t.dataset.f === 'qi' ? (t.checked ? 'Yes' : 'No') : (t.checked ? 'Yes' : 'No, buy through RFx'); return; }
    if (t.dataset.f) { r.f[t.dataset.f] = t.value; if (t.dataset.f === 'cat' && IM.CATS[t.value]) { r.f.hs = r.f.hs || IM.CATS[t.value].hs; r.f.gl = IM.CATS[t.value].gl; draw(); refreshSide(); } else if (['uom', 'hazard', 'priority'].includes(t.dataset.f)) { draw(); refreshSide(); } }
    if (t.name === 'itype') { r.itemType = t.value; if (svc()) { r.f.uom = ''; r.f.mfr = r.f.mpn = r.f.gtin = ''; } draw(); }
    if (t.id === 'act') { r.type = t.value; draw(); }
    if (t.id === 'repl') r.replacement = t.value;
    if (t.dataset.plant) { const s = new Set(r.f.plants); t.checked ? s.add(t.dataset.plant) : s.delete(t.dataset.plant); r.f.plants = [...s]; draw(); refreshSide(); }
    if (t.dataset.storage) { r.f.storageBy = { ...(r.f.storageBy || {}), [t.dataset.storage]: t.value }; r.f.storage = t.value; }
    if (t.id === 'att-in') { r.f.attachments = [...(r.f.attachments || []), ...[...t.files].map(f => f.name)]; draw(); }
  });
  const fail = errs => { const mine = errs.filter(e => ids().includes(e.id) || (step === names().length)); if (!mine.length) return false; U.errsum($('errs'), mine); mine.forEach(e => U.setErr(e.id, e.msg)); return true; };
  const next = async () => {
    const stepErrs = IM.validate(r).filter(e => ids().includes(e.id)); if (!isNew() && step === 1 && !r.target) stepErrs.unshift({ id: 'target', msg: 'Choose the item this request is about.' });
    if (step === 2 && isNew()) { refreshSide(); if (blocking()) { U.errsum($('errs'), [{ id: 'dup-t', msg: 'An exact duplicate or a blocked item exists. Use it or extend it.' }]); return; }
      if (needsReason() && !(r.dup?.reason || '').trim()) { U.setErr('dupr', 'Say why this is not a duplicate so MDM can confirm it.'); stepErrs.push({ id: 'dupr', msg: 'Say why this is not a duplicate.' }); } }
    if (stepErrs.length) { U.errsum($('errs'), stepErrs); stepErrs.forEach(e => U.setErr(e.id, e.msg)); return; }
    done.add(step); $('errs').hidden = true;
    if (step < names().length) { r.dup = { ...(r.dup || {}), checked: true, matches: dups.map(m => m.code) }; IM.saveRequest(r); step++; draw(true); if (step === 2) { refreshSide(); } window.scrollTo({ top: 0 }); return; }
    const b = $('next'); b.classList.add('is-loading'); b.disabled = true;
    r.dup = { ...(r.dup || {}), checked: true, matches: dups.map(m => m.code), decision: needsReason() ? 'Not a duplicate' : r.dup?.decision };
    r.replacement = r.replacement || ''; if (!svc() && !r.f.storage && r.f.plants[0]) r.f.storage = IM.PLANTS[r.f.plants[0]][1]; IM.saveRequest(r);
    const res = IM.act(r.id, 'submit', { who: ME }); b.classList.remove('is-loading'); b.disabled = false;
    if (!res.ok) { if (res.errors) U.errsum($('errs'), res.errors); else U.errsum($('errs'), [{ id: 'st-t', msg: res.error }]); return; }
    const to = res.req.status === 'In review' ? 'the Quality team for review' : 'the MDM team';
    PS.toast(`${r.id} submitted to ${to}`); setTimeout(() => { location.href = 'item-request.html?id=' + r.id; }, 900);
  };
  main.addEventListener('click', async e => { const t = e.target;
    const g = t.closest('[data-go]'); if (g && !g.disabled) { step = +g.dataset.go; draw(true); if (step === 2) refreshSide(); return; }
    const sg = t.closest('[data-seg]'); if (sg) { const v = sg.dataset.v; if (v !== r.type && !(GROUP.includes(v) && GROUP.includes(r.type))) { r.type = v; r.target = ''; r.changes = []; r.f.plants = v === 'Extend' ? [] : ['CHN1']; if (v === 'New') r.f.desc = ''; step = 1; done = new Set(); draw(); } return; }
    const pk = t.closest('[data-pick]'); if (pk) { setTarget(pk.dataset.pick); draw(); return; }
    const us = t.closest('[data-use]'); if (us) { const c = await U.confirm({ title: `Use ${us.dataset.use} instead?`, text: 'This request closes as a duplicate and you are taken to the existing item. No new code is created.', confirm: 'Use existing item', keep: 'Keep editing' }); if (c.ok) { r.status = 'Closed – duplicate'; r.itemCode = us.dataset.use; r.dup = { checked: true, matches: [us.dataset.use], decision: 'Use existing item' }; r.hist.push({ at: IM.today(), who: ME, action: 'Used existing item', comment: us.dataset.use, }); IM.saveRequest(r); location.href = 'item-record.html?code=' + us.dataset.use; } return; }
    const ex = t.closest('[data-extend]'); if (ex) { const code = ex.dataset.extend; r.type = 'Extend'; setTarget(code); r.f.plants = []; step = 1; done = new Set(); draw(); PS.toast('Switched to Extend. Choose the plant.'); return; }
    const rm = t.closest('[data-rmatt]'); if (rm) { r.f.attachments = r.f.attachments.filter(a => a !== rm.dataset.rmatt); draw(); return; }
    if (t.id === 'ai-use') { const s = ai; r.f.desc = s.desc; r.f.cat = s.cat; r.f.uom = r.f.uom || s.uom; r.f.hs = s.hs; r.f.gl = IM.CATS[s.cat].gl; r.itemType = s.itemType; if (s.mfr) r.f.mfr = s.mfr; ai.applied = ['desc', 'cat', 'uom', 'hs']; draw(); refreshSide(); PS.toast('Suggestions added. Check each field.'); return; }
    if (t.id === 'ai-hide') { ai = null; draw(); return; }
    if (t.id === 'next') return next();
    if (t.id === 'back') { step = Math.max(1, step - 1); draw(true); if (step === 2) refreshSide(); return; }
    if (t.id === 'draft') { save(true); return; }
    const pk2 = t.closest('.ps-combo__opt[data-pick]'); if (pk2) return;
  });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); } });
  draw();
}
