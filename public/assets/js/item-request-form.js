/* Procuresprint — Item request form, one page (26 Nov walkthrough).
   New item: every field of the 52-field mapping on one page, shown or greyed by item type, live data quality, AI per field,
   create from a document (OCR), image upload, workflow journey and approval chain, submit with one summary pop-up.
   Update, Extend, Block, Unblock and Inactivate open from the item record (?type=&item=) as their own one-page forms.
   ?id= edits a draft or a sent back request. Needs item-master.js and item-ui.js. */
{
  const U = IMUI, ME = 'John Doe', qs = U.qs, $ = id => document.getElementById(id);
  const main = document.getElementById('main');
  const LIFE = ['Block', 'Unblock', 'Inactivate'], CHANGE = ['Update', 'Extend', ...LIFE];
  const TAX = ['GST 5%', 'GST 12%', 'GST 18%', 'GST 28%', 'GST 18% (SAC)', 'GST 12% (SAC)'];
  const HAZ = ['None', 'Class 3', 'Class 8', 'Class 9'];
  const COUNTRIES = ['India', 'China', 'USA', 'Germany', 'Japan', 'Taiwan', 'Vietnam', 'Other'];
  const TYPE_NOTE = { Goods: 'Physical items. Goods receipt on arrival, storage location per plant.', Service: 'Work or time. Service entry instead of goods receipt, no storage location.', Asset: 'Capital items. Shows GL account and asset class; finance confirms them.' };
  const WHO = { mdm: 'Set by MDM', fin: 'Set by finance', sys: 'Set by the system' };
  const GLS = { '520100': '520100 · IT consumables', '530200': '530200 · Safety consumables', '540100': '540100 · MRO spares', '550100': '550100 · Office supplies', '550300': '550300 · Furniture', '560100': '560100 · Food and canteen', '570100': '570100 · Chemicals', '620100': '620100 · IT services', '620200': '620200 · Facility services', '210500': '210500 · Capital equipment', '120100': '120100 · IT equipment (asset)', '120200': '120200 · Network equipment (asset)', '120300': '120300 · Plant and machinery (asset)' };

  /* ---------- load or start the request ---------- */
  let r; const existing = qs.get('id') && IM.getReq(qs.get('id'));
  const want = qs.get('type') || 'New';
  if (existing) { r = existing; if (existing.requester !== ME && !['Draft', 'Sent back', 'Withdrawn'].includes(existing.status)) { location.replace('item-request.html?id=' + existing.id); } }
  else {
    if (CHANGE.includes(want) && !IM.getItem(qs.get('item') || '')) { location.replace('item-master.html?pick=' + encodeURIComponent(want)); }
    r = IM.blank(CHANGE.includes(want) ? want : 'New', 'Goods', ME);
    if (qs.get('item')) { const it = IM.getItem(qs.get('item')); if (it) { r.target = it.code; r.itemType = it.type; r.f.desc = it.desc; r.f.cat = it.cat; r.f.hazard = it.hazard; r.f.plants = r.type === 'Extend' ? [] : it.plants.map(p => p.code); r.changes = []; } }
  }
  if (!existing && r.type === 'New' && qs.get('q')) { const t = qs.get('q'), lo = t.toLowerCase(); const PL = { chennai: 'CHN1', bangalore: 'BLR1', coimbatore: 'CBE2', pune: 'PNQ1' };
    const pl = Object.entries(PL).filter(([k]) => lo.includes(k)).map(x => x[1]); if (pl.length) r.f.plants = pl; const qty = (lo.match(/\b(\d+)\s+([a-z]+)/) || []);
    r.f.desc = t.replace(/^(please\s+)?(create|raise|add|new)\s+(a\s+)?(new\s+)?(item\s+)?(request\s+)?(for\s+)?/i, '').replace(/\b\d+\s+/, '').replace(/\s+in\s+\w+$/i, '').toUpperCase().slice(0, 40); if (qty[1]) r.f.justification = `${qty[1]} ${qty[2]} needed${pl.length ? ' in ' + pl.map(c => IM.PLANTS[c][0]).join(', ') : ''}. Raised from the AI command bar.`; }
  if (!existing && r.type === 'Extend' && qs.get('plant') && IM.PLANTS[qs.get('plant')]) r.f.plants = [qs.get('plant')];
  const isNew = () => r.type === 'New', svc = () => r.itemType === 'Service', asset = () => r.itemType === 'Asset';
  const target = () => r.target && IM.getItem(r.target);
  let dups = [], ai = {}, src = {}, dirty = false, busy = false, typeTouched = !!existing;
  if (isNew() && !r.f.tax) r.f.tax = 'GST 18%';

  /* ---------- small builders ---------- */
  const val = k => U.esc(r.f[k] ?? '');
  const aiMark = k => ai[k] ? `<button type="button" class="im-aibtn" data-aiinfo="${k}" title="${src[k] === 'ocr' ? 'Read from the document' : 'Suggested by AI'}, ${ai[k]}% confidence. Change it if it is wrong." aria-label="${src[k] === 'ocr' ? 'Read from the document' : 'AI suggestion'} ${ai[k]} percent"><span class="ms" aria-hidden="true">${src[k] === 'ocr' ? 'document_scanner' : 'auto_awesome'}</span>${ai[k]}%</button>` : '';
  const block = (fd, control, o = {}) => {
    const na = !IM.appliesTo(fd, r.itemType), lock = o.lock;
    const note = na ? `Not used for ${{ Goods: 'goods', Service: 'services', Asset: 'assets' }[r.itemType]}` : o.help || '';
    return `<div class="ps-field im-f${na ? ' im-na' : ''}${lock ? ' im-lock' : ''}${o.span ? ' span-' + (o.span === 'all' ? 'all' : '2') : ''}" data-fno="${fd.no}"><label class="ps-field__label" for="${o.id || fd.key}"><span class="im-fno">${fd.no}</span>${U.esc(o.label || fd.label)}${fd.level === 'M' && !na && !lock ? '' : fd.level !== 'M' && !lock && !na ? ' <span class="ps-field__opt">(optional)</span>' : ''}${fd.phase !== 'P0' ? ` <span class="im-phase">${fd.phase}</span>` : ''} ${aiMark(fd.key)}</label>${na ? `<input class="ps-input" id="${o.id || fd.key}" disabled value="—">` : control}<span class="ps-field__help" id="${o.id || fd.key}-h">${U.esc(lock && !na ? (o.lockNote || WHO[fd.who] || '') + (note ? ' · ' + note : '') : note)}</span><span class="ps-field__error" id="${o.id || fd.key}-e" hidden></span></div>`; };
  const input = (k, o = {}) => `<input class="ps-input" id="${o.id || k}" data-f="${k}" value="${o.value != null ? U.esc(o.value) : val(k)}"${o.max ? ` maxlength="${o.max}"` : ''}${o.type ? ` type="${o.type}"` : ''}${o.mode ? ` inputmode="${o.mode}"` : ''}${o.ph ? ` placeholder="${U.esc(o.ph)}"` : ''}${o.up ? ' style="text-transform:uppercase"' : ''}${o.list ? ` list="${o.list}"` : ''}${o.dis ? ' disabled' : ''} aria-describedby="${o.id || k}-e ${o.id || k}-h">`;
  const select = (k, opts, o = {}) => `<select class="ps-select" id="${o.id || k}" data-f="${k}"${o.dis ? ' disabled' : ''} aria-describedby="${o.id || k}-e ${o.id || k}-h">${opts}</select>`;
  const opts = (list, cur) => list.map(x => Array.isArray(x) ? `<option value="${U.esc(x[0])}"${String(cur) === String(x[0]) ? ' selected' : ''}>${U.esc(x[1])}</option>` : `<option${cur === x ? ' selected' : ''}>${U.esc(x)}</option>`).join('');
  const lockBox = (v) => `<input class="ps-input" disabled value="${U.esc(v)}">`;
  const FD = Object.fromEntries(IM.FIELDS.map(fd => [fd.key, fd]));
  const cat = () => IM.CATS[r.f.cat];
  const glDefault = () => asset() && r.f.assetClass ? { 'it-hw': '120100', net: '120200', plant: '120300', cwip: '120300' }[r.f.assetClass] : cat()?.gl || '';

  /* ---------- controls for each of the 52 fields (New item) ---------- */
  const C = {
    reqNo: () => block(FD.reqNo, lockBox(r.id + (r.submitted ? '' : ' · confirmed on submit')), { lock: true }),
    reqType: () => block(FD.reqType, lockBox('New item'), { lock: true, lockNote: 'Update, extend, block and inactivate start from the item record' }),
    requester: () => block(FD.requester, lockBox(r.requester), { lock: true, lockNote: 'Logged-in user' }),
    itemType: () => block(FD.itemType, select('itemType', opts([['Goods', 'Goods'], ['Service', 'Service'], ['Asset', 'Asset']], r.itemType), { id: 'itype' }), { id: 'itype', help: TYPE_NOTE[r.itemType] }),
    priority: () => block(FD.priority, select('priority', opts(['Low', 'Medium', 'High', 'Critical'], r.f.priority)), { help: 'Drives the MDM queue order.' }) + (['High', 'Critical'].includes(r.f.priority) ? `<div class="ps-field"><label class="ps-field__label" for="prio">Reason for priority</label><input class="ps-input" id="prio" data-f="priorityReason" value="${val('priorityReason')}" aria-describedby="prio-e"><span class="ps-field__error" id="prio-e" hidden></span></div>` : ''),
    needBy: () => block(FD.needBy, input('needBy', { type: 'date', id: 'needby' }), { id: 'needby', help: 'The date you need the item code.' }),
    channel: () => block(FD.channel, lockBox(r.channel), { lock: true }),
    plants: () => block(FD.plants, `<div class="im-plants" id="plants" role="group" aria-describedby="plants-e">${Object.entries(IM.PLANTS).map(([c, [n]]) => `<label class="ps-check im-chipcheck"><input type="checkbox" data-plant="${c}"${r.f.plants.includes(c) ? ' checked' : ''}><span>${n} <span class="ink-3">${c}</span></span></label>`).join('')}</div>`, { id: 'plants', span: 'all', help: 'Mindsprint Digital · IN01. One item code serves every plant.' }),
    storage: () => block(FD.storage, r.f.plants.length ? `<div class="im-plants">${r.f.plants.map(c => `<label class="t-body-sm ink-2 im-storage" for="st-${c}">${IM.PLANTS[c][0]}<select class="ps-select" id="st-${c}" data-storage="${c}">${['WH01', 'WH02', 'WH03'].map(w => `<option${((r.f.storageBy || {})[c] || IM.PLANTS[c][1]) === w ? ' selected' : ''}>${w}</option>`).join('')}</select></label>`).join('')}</div>` : '<p class="t-body-sm ink-3">Choose a plant first.</p>', { id: 'storage', span: 'all', help: 'Where the item is received in each plant. Plant default is filled in.' }),
    justification: () => block(FD.justification, `<textarea class="ps-textarea" id="just" data-f="justification" maxlength="1000" aria-describedby="just-e just-h">${val('justification')}</textarea>`, { id: 'just', span: 'all', help: 'Who needs it and why. Up to 1,000 characters.' }),
    matType: () => block(FD.matType, lockBox(asset() ? 'Capital good (default)' : svc() ? '—' : 'Consumable (default)'), { lock: true, lockNote: 'Set by MDM, defaults from item type' }),
    desc: () => block(FD.desc, input('desc', { max: 40, up: true, ph: 'e.g. LAPTOP, LENOVO THINKPAD T14, 16GB' }), { help: '40 characters, upper case. Noun first. AI fills the fields marked with ✦ while you type.' }),
    long: () => block(FD.long, `<textarea class="ps-textarea" id="long" data-f="long" maxlength="4000" aria-describedby="long-e long-h">${val('long')}</textarea>`, { span: 'all', help: 'Size, grade, standard, colour. Specifications live here until attribute templates exist.' }),
    cat: () => block(FD.cat, select('cat', U.options(IM.CATS, r.f.cat, 'Choose the lowest level')), { help: 'Decides the buyer group, UNSPSC and default GL.' }),
    unspsc: () => block(FD.unspsc, lockBox(cat()?.unspsc || 'From the category'), { lock: true, lockNote: 'From the category, MDM can correct it' }),
    matGroup: () => block(FD.matGroup, lockBox(cat() ? cat().path.split(' › ')[0] : 'From the category'), { lock: true, lockNote: 'From the category' }),
    uom: () => block(FD.uom, select('uom', U.options(svc() ? { JOB: 'Job', YR: 'Year' } : IM.UOM, r.f.uom, 'Choose a unit')), { help: svc() ? 'Services use time or job units.' : 'You buy and price in the base unit only.' }),
    mfr: () => block(FD.mfr, input('mfr', { max: 100 })),
    mpn: () => block(FD.mpn, input('mpn', { max: 40 }), { help: 'Used for the duplicate check.' }),
    attrs: () => block(FD.attrs, input('attrs', { ph: 'Size, colour, grade, rating…' }), { span: 2, help: 'Category templates come in P1. Free text until then.' }),
    image: () => block(FD.image, `<div class="im-imgbox${r.f.image ? ' is-set' : ''}">${r.f.image ? `<span class="ms" aria-hidden="true">image</span><div><strong>${U.esc(r.f.image)}</strong><div class="t-body-sm ink-3">Shown in the catalogue and marketplace</div><button type="button" class="ps-btn ps-btn--text ps-btn--sm" data-rmimg>Remove</button></div>` : `<span class="ms" aria-hidden="true">add_photo_alternate</span><div><label for="img-in" style="cursor:pointer"><strong>Upload image</strong></label><input type="file" id="img-in" class="sr-only" accept="image/png,image/jpeg"><div class="t-body-sm ink-3">For the catalogue and marketplace. JPG or PNG, 5 MB.</div></div>`}</div>`, { id: 'img-in', span: 2 }),
    cpn: () => block(FD.cpn, lockBox((({ Goods: 'G-', Service: 'S-', Asset: 'A-' })[r.itemType]) + '###### · generated on approval'), { lock: true }),
    erp: () => block(FD.erp, lockBox('Returned by the ERP sync'), { lock: true }),
    status: () => block(FD.status, lockBox(r.status), { lock: true }),
    country: () => block(FD.country, input('country', { list: 'countries' }) + `<datalist id="countries">${COUNTRIES.map(c => `<option value="${c}">`).join('')}</datalist>`),
    gtin: () => block(FD.gtin, input('gtin', { mode: 'numeric' }), { help: '8, 12, 13 or 14 digits. The check digit is validated.' }),
    weight: () => block(FD.weight, lockBox(r.f.weight || 'Added by MDM'), { lock: true, lockNote: 'Set by MDM' }),
    pack: () => block(FD.pack, lockBox(r.f.pack ? IM.PACKS[r.f.pack] : 'Added by MDM'), { lock: true }),
    lang: () => block(FD.lang, lockBox('Added by MDM, AI translation'), { lock: true }),
    hazard: () => block(FD.hazard, select('hazard', opts(HAZ, r.f.hazard)), { help: 'A hazardous item needs a safety data sheet in the attachments.' }),
    qi: () => block(FD.qi, `<label class="ps-switch"><input type="checkbox" role="switch" id="qi" data-f="qi"${r.f.qi ? ' checked' : ''}><span>${r.f.qi ? 'Yes' : 'No'}</span></label>`),
    sustain: () => block(FD.sustain, input('sustain', { ph: 'Recycled content, eco-label, energy rating' })),
    hs: () => block(FD.hs, input('hs', { mode: 'numeric' }), { label: svc() ? 'SAC code' : 'HSN or HS code', help: svc() ? 'Services use a SAC code.' : 'HS 6 digits plus the local extension for India.' }),
    tax: () => block(FD.tax, select('tax', opts(TAX.filter(x => svc() ? /SAC/.test(x) : !/SAC/.test(x)), r.f.tax)), { help: 'From the plant country. Country of origin never decides it (BR07).' }),
    accAssign: () => block(FD.accAssign, lockBox(asset() ? 'A · asset' : 'K · cost centre'), { lock: true, lockNote: 'From the item type' }),
    gl: () => asset() ? block(FD.gl, select('gl', `<option value="">Choose</option>${opts(Object.entries(GLS).filter(([k]) => k.startsWith('12') || k === '210500'), r.f.gl || glDefault())}`), { help: 'Asset GL. Finance confirms it in the asset class step.' }) : block(FD.gl, lockBox(cat() ? GLS[cat().gl] || cat().gl : 'From the category'), { lock: true, lockNote: 'Default from the category, MDM confirms' }),
    price: () => block(FD.price, input('price', { mode: 'decimal' }), { help: 'Used as the estimate on purchase requests and for approval limits.' }),
    cur: () => block(FD.cur, select('cur', opts(['INR', 'USD'], r.f.cur))),
    priceBasis: () => block(FD.priceBasis, lockBox(svc() ? 'Rate or flat amount' : 'Quantity'), { lock: true, lockNote: 'From the item type' }),
    lead: () => block(FD.lead, input('lead', { mode: 'numeric' })),
    moq: () => block(FD.moq, input('moq', { mode: 'numeric', ph: '1' })),
    catalog: () => block(FD.catalog, `<label class="ps-switch"><input type="checkbox" role="switch" id="catalog" data-f="catalog"${r.f.catalog !== false ? ' checked' : ''}><span>${r.f.catalog !== false ? 'Yes' : 'No, buy through RFx'}</span></label>`),
    svcType: () => block(FD.svcType, select('svcType', U.options(IM.SVC_TYPES, r.f.svcType, 'Choose'))),
    assetClass: () => block(FD.assetClass, select('assetClass', U.options(IM.ASSET_CLASSES, r.f.assetClass, 'Choose')), { help: 'Your proposal. Finance confirms it before approval.' }),
    life: () => block(FD.life, input('life', { mode: 'numeric' }), { help: 'Defaults from the asset class.' }),
    attachments: () => block(FD.attachments, `<div class="ps-drop"><span class="ms" aria-hidden="true">upload_file</span><div><label for="att-in" style="cursor:pointer"><strong>Choose files</strong></label> <input type="file" id="att-in" class="sr-only" multiple><div class="ps-field__help">Spec sheet, datasheet, safety data sheet, drawing, quote. PDF, XLSX, DOCX, JPG, PNG up to 20 MB.</div></div></div>${(r.f.attachments || []).length ? `<ul class="im-files">${r.f.attachments.map(a => `<li><span class="ms" aria-hidden="true">description</span>${U.esc(a)}<button type="button" class="ps-iconbtn ps-iconbtn--sm" data-rmatt="${U.esc(a)}" aria-label="Remove ${U.esc(a)}"><span class="ms" aria-hidden="true">close</span></button></li>`).join('')}</ul>` : ''}`, { id: 'att', span: 'all' }),
    alternates: () => block(FD.alternates, lockBox('Mapped by MDM'), { lock: true }),
    replacement: () => block(FD.replacement, lockBox('Set when an item is inactivated'), { lock: true }),
    dup: () => block(FD.dup, lockBox((r.f.desc || '').length < 4 ? 'Runs while you type' : dups.length ? `${dups.length} similar ${dups.length === 1 ? 'item' : 'items'} · see the panel` : 'No similar item found'), { lock: true }),
    mdmRemarks: () => block(FD.mdmRemarks, lockBox('Added by MDM in review'), { lock: true }),
    apprHist: () => block(FD.apprHist, lockBox('Recorded at each approval'), { lock: true }),
    dq: () => { const q = IM.completeness(r); return block(FD.dq, lockBox(`${q.pct}% · ${q.done} of ${q.total} fields`), { lock: true, lockNote: 'Live, also shown at the top' }); },
  };
  const SECTIONS = [...new Set(IM.FIELDS.map(fd => fd.sec))];
  const SEC_SUB = { Request: 'Who, where and why', 'Basic data': 'What the item is', 'Compliance and quality': 'Safety and inspection', 'Tax and finance': 'How it is taxed and costed', 'Procurement data': 'How it is bought', Service: 'Services only', Asset: 'Assets only', 'Plant data': 'Per plant', Lifecycle: 'Alternates and replacement', 'MDM control': 'Checks done by the system and MDM' };

  /* ---------- page parts ---------- */
  const journey = () => { const st = IM.steps({ ...r, status: 'Draft' }), has = re => st.find(s => re.test(s.label));
    const J = [['Request', has(/^Request$/)], ['System checks', has(/System checks/)], ['Review', has(/In review/)], ['MDM review', has(/MDM review/)], ['Finance', has(/Finance/)], ['Approval', has(/^Approval/)], ['Approved', has(/Item created|Change applied/)]];
    return `<ol class="ps-stepper im-journey" aria-label="Workflow journey">${J.map(([label, s], i) => `<li class="ps-step${i === 0 ? ' ps-step--current' : ''}${s ? '' : ' im-skip'}"${i === 0 ? ' aria-current="step"' : ''}><span class="ps-step__mark">${s ? i + 1 : '<span class="ms" aria-hidden="true">remove</span>'}</span><span class="ps-step__text">${label}<span class="ps-step__sub">${s ? U.esc(i === 1 ? 'Automatic' : i === 4 ? 'Asset class' : i === 6 ? 'Sent to ERP' : (s.who || '').split(' · ')[0]) : 'Not needed'}</span></span></li>`).join('')}</ol>`; };
  const dqBox = () => { const q = IM.completeness(r); const tone = q.pct >= IM.DQ_MIN ? 'success' : q.pct >= 50 ? 'warning' : 'danger';
    return `<div class="im-dq" id="dqbox" role="status" aria-live="polite"><div><div class="t-label-md ink-3">Data quality</div><div class="im-dq__n">${q.pct}%</div></div><div class="im-dq__bar"><div class="ps-progress" role="img" aria-label="${q.done} of ${q.total} fields filled"><i class="im-dq__fill im-dq__fill--${tone}" style="width:${q.pct}%"></i></div><div class="t-body-sm ink-3">${q.done} of ${q.total} fields filled · MDM needs ${IM.DQ_MIN}%</div></div></div>`; };
  const ap = () => IM.approvalFor({ ...r, f: { ...r.f, hazard: r.f.hazard || target()?.hazard } });
  const chainHtml = () => { const a = ap(), st = IM.steps({ ...r, status: 'Draft' });
    const people = st.filter(s => !/^Request$|System checks|Item created|Change applied/.test(s.label));
    return `<section class="ps-section" aria-labelledby="chain-t"><div class="ps-section__head"><div><h2 class="ps-section__title" id="chain-t">Who will approve</h2><p class="ps-section__sub">From the approval criteria table. Updates as you fill the form.</p></div></div><div class="ps-section__body">
      <ol class="im-chain">${people.map((s, i) => `<li><span class="im-chain__n">${i + 1}</span><div><strong>${U.esc(s.label)}</strong><div class="t-body-sm ink-3">${U.esc(s.who)}</div>${s.note ? `<div class="t-body-sm">${U.esc(s.note)}</div>` : ''}</div></li>`).join('')}</ol>
      <details class="im-criteria"><summary class="t-label-md">Approval criteria (${IM.CRITERIA.length} rules)</summary><div class="ps-table-scroll"><table class="ps-table"><caption class="sr-only">Approval criteria</caption><thead><tr><th>Rule</th><th>Applies when</th><th>Approver</th></tr></thead><tbody>${IM.CRITERIA.map(c => { const on = a && (a.rule === c.rule || (/^Block/.test(c.rule) && LIFE.includes(r.type) && /compliance/.test(a.rule))); return `<tr${on ? ' class="im-rowon"' : ''}><td data-l="Rule">${on ? '<span class="ms" aria-hidden="true">check</span> ' : ''}${U.esc(c.rule)}</td><td data-l="Applies when">${U.esc(c.when)}</td><td data-l="Approver">${U.esc(c.approver)}<div class="t-body-sm ink-3">${U.esc(c.role)}</div></td></tr>`; }).join('')}</tbody></table></div><p class="t-body-sm ink-3">${a ? 'Matched: ' + U.esc(a.rule) + '.' : 'No rule matched, so MDM completes it.'}</p></details></div></section>`; };

  const TONE = { exact: ['danger', 'Exact duplicate'], blocked: ['danger', 'Blocked item'], inactive: ['info', 'Inactive item'], similar: ['warning', 'Similar item'], info: ['info', 'Possibly related'], diffType: ['warning', 'Same name, other item type'], pending: ['warning', 'Pending request'] };
  const blocking = () => dups.some(m => ['exact', 'blocked'].includes(m.kind));
  const needsReason = () => dups.some(m => ['similar', 'diffType', 'pending'].includes(m.kind)) && !blocking();
  const dupHtml = () => { const body = dups.length ? dups.map(m => { const [tone, label] = TONE[m.kind];
      return `<div class="ps-card"><div class="ps-card__body" style="gap:8px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong>${U.esc(m.code)}</strong>${U.chip(tone, label)}</div><div>${U.esc(m.desc)}</div><div class="t-body-sm ink-3">${U.esc(m.type)} · ${m.pct} percent match · ${U.esc(m.rule)}</div>${m.kind === 'inactive' && m.replacement ? `<div class="t-body-sm">Use replacement <a href="item-record.html?code=${U.esc(m.replacement)}">${U.esc(m.replacement)}</a>.</div>` : ''}<div style="display:flex;gap:8px;flex-wrap:wrap">${!m.isReq && m.kind !== 'blocked' ? `<button type="button" class="ps-btn ps-btn--secondary ps-btn--sm" data-use="${U.esc(m.code)}">Use this item</button><a class="ps-btn ps-btn--text ps-btn--sm" href="item-request-new.html?type=Extend&item=${U.esc(m.code)}">Extend to my plant</a>` : ''}</div></div></div>`; }).join('')
      : `<p class="t-body-sm ink-3">${(r.f.desc || '').length < 4 ? 'Type a description. Matches across all plants appear here while you type.' : 'No similar item found across all plants.'}</p>`;
    const reason = needsReason() ? `<div class="ps-field"><label class="ps-field__label" for="dupr">Not a duplicate, because</label><textarea class="ps-textarea" id="dupr" style="min-height:64px" aria-describedby="dupr-e">${U.esc(r.dup?.reason || '')}</textarea><span class="ps-field__error" id="dupr-e" hidden></span></div>` : '';
    return `<section class="ps-section" aria-labelledby="dup-t"><div class="ps-section__head"><div><h2 class="ps-section__title" id="dup-t">Similar items${dups.length ? ' (' + dups.length + ')' : ''}</h2><p class="ps-section__sub">Checked while you type, across all plants.</p></div></div><div class="ps-section__body" aria-live="polite">${blocking() ? '<div class="ps-alert ps-alert--danger" role="alert"><span class="ms" aria-hidden="true">block</span><div><div class="ps-alert__title">You cannot submit this item</div><div class="ps-alert__text">Use the existing item or extend it to your plant.</div></div></div>' : ''}${body}${reason}</div></section>`; };
  const aiSide = () => { const n = Object.keys(ai).length; return `<div class="ps-ai"><div class="ps-ai__head"><span class="ms" aria-hidden="true">auto_awesome</span>${n ? n + ' fields filled for you' : 'AI fills as you type'}</div><p class="ps-ai__why">${n ? 'Fields marked ✦ were suggested from your text, and fields marked with a scan icon were read from your document. Check each one; change any value to take it over.' : 'Type the short description, or start from a supplier PDF above. Category, unit, codes and maker are filled in for you. AI never sets tax or asset class on its own.'}</p></div>`; };
  const ocrBox = () => `<section class="ps-section im-ocr" aria-labelledby="ocr-t"><div class="ps-section__body" style="flex-direction:row;align-items:center;gap:16px;flex-wrap:wrap"><span class="im-ocr__icon"><span class="ms" aria-hidden="true">document_scanner</span></span><div style="flex:1;min-width:240px"><h2 class="t-title-sm" id="ocr-t">Create from a document</h2><p class="t-body-sm ink-2">Upload a supplier PDF, spec sheet or quote. AI reads it and fills the item for you to check.</p></div>${busy ? '<div class="im-busy" role="status"><span class="im-spin" aria-hidden="true"></span>Reading the document…</div>' : `<label class="ps-btn ps-btn--secondary" for="ocr-in"><span class="ms" aria-hidden="true">upload</span>Upload document</label><input type="file" id="ocr-in" class="sr-only" accept=".pdf,image/*"><button type="button" class="ps-btn ps-btn--text" id="ocr-sample">Try a sample datasheet</button>`}</div></section>`;

  const newBody = () => SECTIONS.map(sec => { const fs = IM.FIELDS.filter(fd => fd.sec === sec); const live = fs.filter(fd => IM.appliesTo(fd, r.itemType)).length;
    return `<section class="ps-section" aria-labelledby="sec-${sec.replace(/\W+/g, '')}"><div class="ps-section__head"><div><h2 class="ps-section__title" id="sec-${sec.replace(/\W+/g, '')}">${U.esc(sec)}</h2><p class="ps-section__sub">${U.esc(SEC_SUB[sec] || '')} · ${live} of ${fs.length} fields apply to ${U.esc(r.itemType.toLowerCase())}</p></div></div><div class="ps-section__body"><div class="ps-formgrid">${fs.map(fd => C[fd.key]()).join('')}</div></div></section>`; }).join('');

  /* ---------- change requests (from the item record) ---------- */
  const UPD = [['Short description', 'desc', t => t.desc, true], ['Long description', 'long', t => t.long, true], ['Material category', 'cat', t => IM.CATS[t.cat]?.path || '', true], ['Base unit', 'uom', t => IM.UOM[t.uom] || t.uom, true], ['HSN or HS code', 'hs', t => IM.CATS[t.cat]?.hs || '', true], ['Tax code', 'tax', t => t.plants[0]?.tax || '', true], ['Manufacturer', 'mfr', t => t.mfr], ['Manufacturer part number', 'mpn', t => t.mpn], ['Country of origin', 'country', t => t.country], ['GTIN or barcode', 'gtin', t => t.gtin], ['Hazard class', 'hazard', t => t.hazard], ['Standard price', 'price', t => String(t.price || '')], ['Lead time (days)', 'lead', t => String(t.lead || '')], ['Minimum order quantity', 'moq', t => String(t.moq || '')]];
  const itemCard = t => `<section class="ps-section"><div class="ps-section__body" style="flex-direction:row;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap"><div><div class="t-label-md ink-3">Item</div><strong>${U.esc(t.code)}</strong> · ${U.esc(t.desc)}<div class="t-body-sm ink-3">${U.esc(t.type)} · ${U.esc(IM.CATS[t.cat]?.path || '')} · ${t.plants.map(p => U.esc(p.name)).join(', ')}${t.erp ? ' · ERP ' + U.esc(t.erp) : ''}</div></div><div style="display:flex;gap:8px;align-items:center">${U.itemChip(t.status)}<a class="ps-btn ps-btn--text ps-btn--sm" href="item-record.html?code=${U.esc(t.code)}">Open item</a></div></div></section>`;
  const common = () => `<div class="ps-formgrid">${C.priority()}${C.needBy()}${C.justification().replace('Business justification', LIFE.includes(r.type) ? 'Reason' : 'Business justification')}${C.attachments()}</div>`;
  const changeBody = () => { const t = target(); if (!t) return '';
    let core = '';
    if (r.type === 'Update') core = `<section class="ps-section" aria-labelledby="chg-t"><div class="ps-section__head"><div><h2 class="ps-section__title" id="chg-t">What should change?</h2><p class="ps-section__sub">Type only the new values. Old and new values are kept in the audit trail.</p></div></div><div class="ps-section__body"><div class="ps-alert ps-alert--info" role="note"><span class="ms" aria-hidden="true">lock</span><div><div class="ps-alert__title">Item code ${U.esc(t.code)} and item type ${U.esc(t.type)} are locked</div><div class="ps-alert__text">Fields marked critical need a finance approver (BR42). To change the item type, block this item and request a new one.</div></div></div><div class="ps-table-scroll"><table class="ps-table"><caption class="sr-only">Current and proposed values</caption><thead><tr><th>Field</th><th>Current value</th><th>New value</th></tr></thead><tbody>${UPD.map(([l, k, g, crit], i) => { const ch = (r.changes || []).find(c => c[0] === l); return `<tr><td data-l="Field">${l}${crit ? ' <span class="ps-chip ps-chip--warning">Critical</span>' : ''}</td><td data-l="Current value">${U.esc(g(t)) || '<span class="ink-3">—</span>'}</td><td data-l="New value"><label class="sr-only" for="chg${i}">New ${l}</label><input class="ps-input" id="chg${i}" data-chg="${l}" data-old="${U.esc(g(t))}" value="${U.esc(ch ? ch[2] : '')}" placeholder="Unchanged"></td></tr>`; }).join('')}</tbody></table></div><span class="ps-field__error" id="chg-e" hidden></span></div></section>`;
    if (r.type === 'Extend') { const taken = t.plants.map(p => p.code); core = `<section class="ps-section" aria-labelledby="ext-t"><div class="ps-section__head"><div><h2 class="ps-section__title" id="ext-t">Extend to which plant?</h2><p class="ps-section__sub">Only plant data is added. The item code stays ${U.esc(t.code)}.</p></div></div><div class="ps-section__body"><p class="t-body-sm ink-3">Already in ${t.plants.map(p => U.esc(p.name)).join(', ')}.</p><div class="im-plants" id="plants" role="group" aria-describedby="plants-e">${Object.entries(IM.PLANTS).filter(([c]) => !taken.includes(c)).map(([c, [n]]) => `<label class="ps-check im-chipcheck"><input type="checkbox" data-plant="${c}"${r.f.plants.includes(c) ? ' checked' : ''}><span>${n} <span class="ink-3">${c}</span></span></label>`).join('') || '<p class="ink-3">This item is already in every plant.</p>'}</div><span class="ps-field__error" id="plants-e" hidden></span><div class="ps-formgrid">${t.type !== 'Service' ? C.storage() : ''}${C.tax()}</div></div></section>`; }
    if (LIFE.includes(r.type)) { core = `<section class="ps-section" aria-labelledby="lc-t"><div class="ps-section__head"><div><h2 class="ps-section__title" id="lc-t">${{ Block: 'Block this item', Unblock: 'Unblock this item', Inactivate: 'Inactivate this item' }[r.type]}</h2><p class="ps-section__sub">${{ Block: 'For compliance, quality or a ban. Not available for new documents until unblocked.', Unblock: 'Makes the item available for new documents again.', Inactivate: 'For obsolete or discontinued items. Users are sent to the replacement.' }[r.type]}</p></div></div><div class="ps-section__body">
      <div class="ps-alert ps-alert--warning" role="note"><span class="ms" aria-hidden="true">warning</span><div><div class="ps-alert__title">Impact on open documents</div><div class="ps-alert__text">${t.docs.length ? t.docs.map(d => `${U.esc(d[0])} (${U.esc(d[1])})`).join(', ') + '. Open documents continue and their buyers are told.' : 'No open purchase requests, RFx events or catalogue listings use this item.'}</div></div></div>
      ${r.type === 'Inactivate' ? `<div class="ps-formgrid"><div class="ps-field"><label class="ps-field__label" for="repl">Replacement item <span class="ps-field__opt">(optional)</span></label><select class="ps-select" id="repl">${U.options(Object.fromEntries(IM.db().items.filter(i => i.status === 'Active' && i.code !== r.target).map(i => [i.code, i.code + ' · ' + i.desc])), r.replacement, 'No replacement')}</select><span class="ps-field__help">Users are redirected to it when they search for this item.</span></div></div>` : ''}</div></section>`; }
    return itemCard(t) + core + `<section class="ps-section" aria-labelledby="rq-t"><div class="ps-section__head"><div><h2 class="ps-section__title" id="rq-t">Request</h2><p class="ps-section__sub">Requested by ${U.esc(r.requester)} · ${U.esc(r.channel)}</p></div></div><div class="ps-section__body">${common()}</div></section>`; };

  const HEAD = { New: 'New item request', Update: 'Request an update', Extend: 'Extend to a plant', Block: 'Block an item', Unblock: 'Unblock an item', Inactivate: 'Inactivate an item' };
  const draw = () => {
    const a = document.activeElement, keep = a && a.id ? { id: a.id, s: a.selectionStart, e: a.selectionEnd } : null;
    const t = target();
    main.innerHTML = `<div class="ps-pagehead"><div class="ps-pagehead__text"><a class="ps-back" href="${t && !isNew() ? 'item-record.html?code=' + U.esc(t.code) : 'item-requests.html'}"><span class="ms" aria-hidden="true">arrow_back</span>${t && !isNew() ? U.esc(t.code) : 'Item requests'}</a><h1 class="t-headline">${HEAD[r.type]}${t && !isNew() ? ' · ' + U.esc(t.code) : ''}</h1><p class="ps-pagehead__meta">${r.status === 'Draft' ? 'Draft ' : ''}${U.esc(r.id)} · ${U.esc(r.status)} · everything on one page</p></div>${isNew() ? `<div class="ps-pagehead__actions">${dqBox()}</div>` : ''}</div>
      <section class="ps-section im-journeywrap" aria-label="Workflow journey"><div class="ps-section__body">${journey()}</div></section>
      ${r.status === 'Sent back' ? `<div class="ps-alert ps-alert--warning" role="note"><span class="ms" aria-hidden="true">reply</span><div><div class="ps-alert__title">Sent back to you</div><div class="ps-alert__text">${U.esc(r.hist.filter(h => /Sent back/.test(h.action)).at(-1)?.comment || '')}</div></div></div>` : ''}
      <div id="errs" class="ps-alert ps-alert--danger ps-errsum" role="alert" tabindex="-1" hidden></div>
      <div class="ps-split"><div class="ps-stack" style="gap:16px">${isNew() ? ocrBox() + newBody() : changeBody()}</div>
      <aside class="ps-split__aside im-aside" aria-label="Help while you fill">${isNew() ? aiSide() + `<div id="dup">${dupHtml()}</div>` : ''}<div id="chain">${chainHtml()}</div></aside></div>
      <div class="ps-actionbar"><div class="ps-actionbar__sum"><div><span>Request</span><b>${U.esc(r.type)}${isNew() ? ' · ' + U.esc(r.itemType) : ''}</b></div>${isNew() ? `<div><span>Data quality</span><b id="dq-bar">${IM.completeness(r).pct}%</b></div>` : ''}</div><div class="ps-actionbar__btns"><a class="ps-btn ps-btn--text" href="${t && !isNew() ? 'item-record.html?code=' + U.esc(t.code) : 'item-requests.html'}">Cancel</a><button type="button" class="ps-btn ps-btn--secondary" id="draft">Save draft</button><button type="button" class="ps-btn ps-btn--primary" id="submit">Submit request</button></div></div>`;
    if (keep) { const el = $(keep.id); if (el) { el.focus({ preventScroll: true }); try { if (keep.s != null) el.setSelectionRange(keep.s, keep.e); } catch { /* not a text field */ } } }
  };
  const softRefresh = () => { if (!isNew()) { $('chain').innerHTML = chainHtml(); return; } const q = IM.completeness(r); $('dqbox').outerHTML = dqBox(); $('dq-bar').textContent = q.pct + '%'; $('chain').innerHTML = chainHtml(); const df = main.querySelector('[data-fno="52"] input'); if (df) df.value = `${q.pct}% · ${q.done} of ${q.total} fields`; const dd = main.querySelector('[data-fno="49"] input'); if (dd) dd.value = (r.f.desc || '').length < 4 ? 'Runs while you type' : dups.length ? `${dups.length} similar items · see the panel` : 'No similar item found'; };

  /* ---------- AI and OCR ---------- */
  const fillAi = (s, how, conf) => { if (!s) return []; const set = [];
    const put = (k, v) => { if (v == null || v === '') return; if (!String(r.f[k] ?? '').trim() || src[k]) { r.f[k] = v; ai[k] = conf || s.conf; src[k] = how; set.push(k); } };
    if ((!typeTouched || how === 'ocr') && r.itemType !== s.itemType) { r.itemType = s.itemType; ai.itemType = conf || s.conf; src.itemType = how; set.push('itemType'); }
    put('cat', s.cat); put('uom', s.uom); put('hs', s.hs); if (s.mfr) put('mfr', s.mfr);
    if (r.itemType === 'Asset') { put('assetClass', s.cat === 'it-net' ? 'net' : 'it-hw'); put('life', String(IM.ASSET_CLASSES[s.cat === 'it-net' ? 'net' : 'it-hw'][1])); put('gl', s.cat === 'it-net' ? '120200' : '120100'); }
    if (r.itemType === 'Service') put('svcType', /calib/i.test(r.f.desc) ? 'calib' : 'repair');
    if (how === 'ocr') Object.entries(s.extra || {}).forEach(([k, v]) => put(k, v));
    return set; };
  const runAi = () => { const s = IM.suggest(r.f.desc); if (!s || s.conf < 70) return; const set = fillAi(s, 'ai'); if (set.length) draw(); };
  const OCR = { cat: 'it-lap', itemType: 'Asset', uom: 'EA', hs: '8471.30', mfr: 'Lenovo', conf: 94, extra: { desc: 'LAPTOP, LENOVO THINKPAD T14 GEN 5, 32GB', long: '14 inch WUXGA business laptop, Intel Core Ultra 7, 32 GB RAM, 1 TB SSD, Windows 11 Pro, 3 year on-site warranty. Weight 1.24 kg.', mpn: '21ML0042IG', country: 'China', price: '112500', lead: '12', attrs: 'Screen 14 in · RAM 32 GB · SSD 1 TB · warranty 3 years' } };
  const readDoc = name => { busy = true; draw(); r.f.attachments = [...new Set([...(r.f.attachments || []), name])];
    setTimeout(() => { busy = false; const hint = IM.suggest(name.replace(/[-_.]/g, ' ')); const base = hint && hint.cat !== 'it-lap' ? { ...hint, conf: 88, extra: { desc: hint.desc } } : OCR;
      Object.keys(base.extra || {}).forEach(k => { delete src[k]; r.f[k] = ''; }); const set = fillAi(base, 'ocr', base.conf); dirty = true; refreshDups(); draw(); PS.toast(`${set.length} fields read from ${name}. Check each one.`); }, 1400); };

  /* ---------- behaviour ---------- */
  const refreshDups = () => { dups = isNew() ? IM.dupCheck(r.f, r.itemType, r.f.plants, r.id) : []; if ($('dup')) $('dup').innerHTML = dupHtml(); };
  const timers = {}; const later = (fn, key, ms = 250) => { clearTimeout(timers[key]); timers[key] = setTimeout(fn, ms); };
  main.addEventListener('input', e => { const t = e.target; dirty = true;
    if (t.dataset.f) { const k = t.dataset.f; if (t.type === 'checkbox') return; r.f[k] = t.value; if (ai[k] && src[k]) { delete ai[k]; delete src[k]; t.closest('.ps-field')?.querySelector('.im-aibtn')?.remove(); }
      if (k === 'desc') { r.f.desc = t.value.toUpperCase().replace(/[^A-Z0-9 ,.\-/"']/g, ''); if (t.value !== r.f.desc) t.value = r.f.desc; later(() => { refreshDups(); softRefresh(); }, 'dup'); later(runAi, 'ai', 500); }
      if (['mfr', 'mpn', 'gtin'].includes(k)) later(() => { refreshDups(); softRefresh(); }, 'dup'); U.setErr(t.id, ''); later(softRefresh, 'soft', 150); }
    if (t.dataset.chg) { const l = t.dataset.chg; r.changes = (r.changes || []).filter(c => c[0] !== l); if (t.value.trim() && t.value.trim() !== t.dataset.old) r.changes.push([l, t.dataset.old, t.value.trim()]); U.setErr('chg', ''); later(softRefresh, 'soft', 150); }
    if (t.id === 'dupr') r.dup = { ...(r.dup || {}), decision: 'Not a duplicate', reason: t.value };
  });
  main.addEventListener('change', e => { const t = e.target; dirty = true;
    if (t.dataset.f === 'qi' || t.dataset.f === 'catalog') { r.f[t.dataset.f] = t.checked; t.nextElementSibling.textContent = t.dataset.f === 'qi' ? (t.checked ? 'Yes' : 'No') : (t.checked ? 'Yes' : 'No, buy through RFx'); return; }
    if (t.dataset.f === 'itemType') { typeTouched = true; r.itemType = t.value; delete ai.itemType; delete src.itemType; if (svc()) { r.f.uom = ['JOB', 'YR'].includes(r.f.uom) ? r.f.uom : ''; r.f.tax = 'GST 18% (SAC)'; } else if (/SAC/.test(r.f.tax)) r.f.tax = 'GST 18%'; refreshDups(); draw(); return; }
    if (t.dataset.f) { const k = t.dataset.f; r.f[k] = t.value; if (ai[k]) { delete ai[k]; delete src[k]; }
      if (k === 'cat' && IM.CATS[t.value]) { r.f.hs = r.f.hs || IM.CATS[t.value].hs; if (!asset()) r.f.gl = IM.CATS[t.value].gl; }
      if (k === 'assetClass' && IM.ASSET_CLASSES[t.value]) { r.f.life = r.f.life || String(IM.ASSET_CLASSES[t.value][1]); r.f.gl = glDefault(); }
      if (['cat', 'uom', 'hazard', 'priority', 'assetClass', 'cur'].includes(k)) { refreshDups(); draw(); } else softRefresh(); }
    if (t.id === 'repl') r.replacement = t.value;
    if (t.dataset.plant) { const s = new Set(r.f.plants); t.checked ? s.add(t.dataset.plant) : s.delete(t.dataset.plant); r.f.plants = [...s]; U.setErr('plants', ''); refreshDups(); draw(); }
    if (t.dataset.storage) { r.f.storageBy = { ...(r.f.storageBy || {}), [t.dataset.storage]: t.value }; r.f.storage = r.f.storageBy[r.f.plants[0]] || r.f.storage; }
    if (t.id === 'att-in') { r.f.attachments = [...new Set([...(r.f.attachments || []), ...[...t.files].map(f => f.name)])]; draw(); }
    if (t.id === 'img-in' && t.files[0]) { if (!/\.(png|jpe?g)$/i.test(t.files[0].name)) { PS.toast('Choose a JPG or PNG image.', { error: true }); return; } r.f.image = t.files[0].name; draw(); }
    if (t.id === 'ocr-in' && t.files[0]) readDoc(t.files[0].name);
  });

  const summary = () => { const f = r.f, t = target(), q = IM.completeness(r), a = ap();
    const rows = isNew() ? [['Item type', r.itemType], ['Short description', f.desc], ['Category', IM.CATS[f.cat]?.path || '—'], ['Base unit', IM.UOM[f.uom] || f.uom || '—'], ['Plants', f.plants.map(p => IM.PLANTS[p][0]).join(', ')], ['Standard price', f.price ? U.money(f.price, f.cur) : '—'], ['Image', f.image || 'None'], ['Attachments', (f.attachments || []).join(', ') || 'None'], ['Data quality', `${q.pct}% · ${q.done} of ${q.total} fields`], ['Similar items', dups.length ? dups.map(m => m.code).join(', ') + (r.dup?.reason ? ' · not a duplicate: ' + r.dup.reason : '') : 'None found']]
      : [['Item', `${t.code} · ${t.desc}`], ...(r.type === 'Update' ? (r.changes || []).map(c => [c[0], `${c[1] || '—'} → ${c[2]}`]) : []), ...(r.type === 'Extend' ? [['Extend to', f.plants.map(p => IM.PLANTS[p][0]).join(', ')]] : []), ...(r.type === 'Inactivate' ? [['Replacement', r.replacement || 'None']] : []), [LIFE.includes(r.type) ? 'Reason' : 'Justification', f.justification]];
    rows.push(['Priority, required by', `${f.priority} · ${U.fmtDate(f.needBy)}`], ['Approval', a ? `${a.approver}, ${a.role} (${a.rule})` : 'No approval rule, MDM completes it']);
    return `<dl class="ps-dl">${rows.map(([k, v]) => `<div><dt>${U.esc(k)}</dt><dd>${U.esc(v)}</dd></div>`).join('')}</dl>`; };
  const ask = () => new Promise(res => { const d = document.createElement('dialog'); d.className = 'ps-dialog im-sumdlg'; d.setAttribute('aria-labelledby', 'sum-t');
    d.innerHTML = `<form method="dialog"><div class="ps-dialog__head"><h2 class="ps-dialog__title" id="sum-t">Submit ${U.esc(r.id)}?</h2></div><div class="ps-dialog__body"><p>Check the summary. It goes to ${dups.length || r.type !== 'New' ? 'system checks and then ' : 'system checks and then '}${IM.steps({ ...r, status: 'Draft' }).slice(2, -1).map(s => s.label).join(', then ') || 'MDM'}.</p>${summary()}</div><div class="ps-dialog__foot"><button class="ps-btn ps-btn--text" type="button" data-no>Keep editing</button><button class="ps-btn ps-btn--primary" type="submit" data-yes>Submit request</button></div></form>`;
    document.body.append(d); const done = ok => { d.close(); d.remove(); res(ok); }; d.querySelector('[data-no]').addEventListener('click', () => done(false)); d.addEventListener('cancel', () => res(false)); d.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); done(true); }); d.showModal(); d.querySelector('[data-yes]').focus(); });
  const submit = async () => {
    const errs = IM.validate(r).filter(x => isNew() || !['desc', 'long', 'cat', 'uom'].includes(x.id));
    if (isNew()) { refreshDups(); if (blocking()) errs.unshift({ id: 'dup-t', msg: 'An exact duplicate or a blocked item exists. Use it or extend it.' }); if (needsReason() && !(r.dup?.reason || '').trim()) errs.push({ id: 'dupr', msg: 'Say why this is not a duplicate so MDM can confirm it.' }); if (r.itemType === 'Service' && !r.f.svcType) { /* P1 field, optional */ } }
    if (errs.length) { U.errsum($('errs'), errs); errs.forEach(x => U.setErr(x.id, x.msg)); return; }
    $('errs').hidden = true; if (!(await ask())) return;
    const b = $('submit'); b.classList.add('is-loading'); b.disabled = true;
    r.dup = { ...(r.dup || {}), checked: true, matches: dups.map(m => m.code), decision: needsReason() ? 'Not a duplicate' : r.dup?.decision }; r.replacement = r.replacement || '';
    if (!svc() && r.f.plants[0]) r.f.storage = (r.f.storageBy || {})[r.f.plants[0]] || r.f.storage || IM.PLANTS[r.f.plants[0]][1];
    if (r.type === 'Update' && (r.changes || []).some(c => /tax|unit|categor|hs|description/i.test(c[0]))) r.changes = r.changes;
    IM.saveRequest(r); const res = IM.act(r.id, 'submit', { who: ME }); b.classList.remove('is-loading'); b.disabled = false;
    if (!res.ok) { U.errsum($('errs'), res.errors || [{ id: 'errs', msg: res.error }]); return; }
    dirty = false; PS.toast(`${r.id} submitted to ${res.req.status === 'In review' ? 'the Quality team' : 'the MDM team'}`); setTimeout(() => { location.href = 'item-request.html?id=' + r.id; }, 900); };
  main.addEventListener('click', async e => { const t = e.target;
    if (t.closest('#submit')) return submit();
    if (t.closest('#draft')) { dirty = false; IM.saveRequest(r); PS.toast(`Draft ${r.id} saved`); return; }
    if (t.closest('#ocr-sample')) return readDoc('lenovo-thinkpad-t14-gen5-datasheet.pdf');
    const us = t.closest('[data-use]'); if (us) { const c = await U.confirm({ title: `Use ${us.dataset.use} instead?`, text: 'This request closes as a duplicate and you are taken to the existing item. No new code is created.', confirm: 'Use existing item', keep: 'Keep editing' }); if (c.ok) { r.status = 'Closed – duplicate'; r.itemCode = us.dataset.use; r.dup = { checked: true, matches: [us.dataset.use], decision: 'Use existing item' }; r.hist.push({ at: IM.today(), who: ME, action: 'Used existing item', comment: us.dataset.use }); IM.saveRequest(r); dirty = false; location.href = 'item-record.html?code=' + us.dataset.use; } return; }
    const rm = t.closest('[data-rmatt]'); if (rm) { r.f.attachments = r.f.attachments.filter(a => a !== rm.dataset.rmatt); draw(); return; }
    if (t.closest('[data-rmimg]')) { r.f.image = ''; draw(); return; }
    const ib = t.closest('[data-aiinfo]'); if (ib) { const k = ib.dataset.aiinfo; PS.toast(`${src[k] === 'ocr' ? 'Read from your document' : 'Suggested from your description'} · ${ai[k]}% confidence. Change the value to take it over.`); }
  });
  /* autosave instead of a leave-page prompt, so navigation never blocks (27 Nov: the form stopped responding to navigation) */
  window.addEventListener('pagehide', () => { if (dirty && r.status === 'Draft' && (r.f.desc || r.target)) IM.saveRequest(r); });
  if (isNew() && r.f.desc) refreshDups();
  draw();
  if (isNew() && qs.get('q')) runAi();
}
