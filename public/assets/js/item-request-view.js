/* Procuresprint — Item request record, one runtime for five roles chosen by <body data-role>:
   requester (tracker, S05 detail) · mdm (S03 review workspace) · review (In review step) · finance (S12 asset class) · approval (S04 approval task).
   Reads ?id=. Every action goes through IM.act and ends on the request page, so each step shows the next one. */
{
  const U = IMUI, ME = 'John Doe', ROLE = document.body.dataset.role, id = U.qs.get('id');
  const main = document.getElementById('main');
  const WAIT = { 'Pending MDM': ['mdm', 'item-mdm-review.html', 'MDM team', 'Open MDM review'], 'In review': ['review', 'item-review.html', 'Quality team', 'Open review'], 'Pending finance review': ['finance', 'item-finance-review.html', 'Finance (assets)', 'Open asset class review'], 'Pending approval': ['approval', 'item-approval.html', 'Approver', 'Open approval task'] };
  const FOR = { mdm: 'Pending MDM', review: 'In review', finance: 'Pending finance review', approval: 'Pending approval' };
  const ACTING = { requester: 'Requester', mdm: 'MDM team', review: 'Quality team (reviewer)', finance: 'Finance (assets)', approval: 'Approver' };
  const TITLE = { requester: 'Item request', mdm: 'MDM review', review: 'Review', finance: 'Asset class review', approval: 'Approval task' };
  const CHECKS = ['Description follows the naming standard', 'No duplicate in any plant', 'UNSPSC, HSN and tax code correct for India', 'Storage location and GL set', 'Attachments (spec sheet) present'];
  const RCHECKS = ['Supplier samples received and tested', 'Lab report attached (moisture, colour, purity)', 'Halal or FSSAI certificate valid', 'Trial batch approved by production'];
  const GLASSET = { 'it-hw': '120100 · IT equipment', net: '120200 · Network equipment', plant: '120300 · Plant and machinery', cwip: '120900 · Capital work in progress' };
  let r = id ? IM.getReq(id) : null;
  if (!r && ROLE !== 'requester') r = IM.db().reqs.find(x => x.status === FOR[ROLE]) || null;
  if (!r && ROLE === 'requester') r = IM.db().reqs.find(x => x.requester === ME) || null;

  const empty = () => { main.innerHTML = `<div class="ps-state"><div class="ps-state__art"><span class="ms" aria-hidden="true">inbox</span></div><div class="ps-state__title">${id ? 'That request does not exist' : 'Nothing waiting here'}</div><p class="ps-state__text">${id ? 'Check the request number, or open the list.' : 'No request is at this step. New requests appear when the step before is done.'}</p><a class="ps-btn ps-btn--primary" href="item-requests.html">Open item requests</a></div>`; };
  if (!r) empty();
if (r) {

  const f = r.f, plantNames = f.plants.map(p => IM.PLANTS[p][0]).join(', ') || '—';
  const stage = WAIT[r.status];
  const here = !FOR[ROLE] || r.status === FOR[ROLE];
  const dl = rows => `<dl class="ps-dl">${rows.filter(Boolean).map(([k, v]) => `<div><dt>${U.esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const cat = IM.CATS[f.cat];
  const summary = () => dl([
    ['Request type', U.esc(r.type)], ['Item type', U.esc(r.itemType)], r.target ? ['Item', `<a href="item-record.html?code=${U.esc(r.target)}">${U.esc(r.target)}</a>`] : null,
    ['Category', U.esc(cat?.path || '—')], ['Base unit', U.esc(IM.UOM[f.uom] || '—')], ['HSN or HS code', U.esc(f.hs || '—')], ['Plant', U.esc(plantNames)],
    f.mfr ? ['Manufacturer', U.esc(f.mfr + (f.mpn ? ' · ' + f.mpn : ''))] : null, f.price ? ['Standard price', U.money(f.price, f.cur)] : null, ['Priority', U.esc(f.priority)], ['Required by', U.fmtDate(f.needBy)],
    ['Attachments', (f.attachments || []).length ? U.esc(f.attachments.join(', ')) : '—']]);
  const last = a => r.hist.filter(h => h.action === a).at(-1)?.comment || '';
  const dupNote = () => r.dup?.matches?.length ? `<div class="ps-alert ps-alert--info" role="note"><span class="ms" aria-hidden="true">content_copy</span><div><div class="ps-alert__title">Similar items were found: ${r.dup.matches.map(c => `<a href="item-record.html?code=${U.esc(c)}">${U.esc(c)}</a>`).join(', ')}</div><div class="ps-alert__text">${U.esc(r.dup.decision || 'Checked')}${r.dup.reason ? '. Requester says: ' + U.esc(r.dup.reason) : ''}</div></div></div>` : '';
  const changes = () => r.type === 'Update' ? `<div class="ps-table-scroll"><table class="ps-table"><caption class="sr-only">Proposed changes</caption><thead><tr><th>Field</th><th>Old value</th><th>New value</th></tr></thead><tbody>${(r.changes || []).map(c => `<tr><td data-l="Field">${U.esc(c[0])}</td><td data-l="Old value">${U.esc(c[1] || '—')}</td><td data-l="New value"><strong>${U.esc(c[2])}</strong></td></tr>`).join('')}</tbody></table></div>` : '';
  const impact = () => { const t = IM.getItem(r.target); return ['Block', 'Unblock', 'Inactivate'].includes(r.type) && t ? `<div class="ps-alert ps-alert--warning" role="note"><span class="ms" aria-hidden="true">warning</span><div><div class="ps-alert__title">Impact on open documents</div><div class="ps-alert__text">${t.docs.length ? t.docs.map(d => `${U.esc(d[0])} (${U.esc(d[1])})`).join(', ') + '. Open documents continue and their buyers are told.' : 'No open purchase requests, RFx events or catalogue listings use this item.'}</div></div></div>` : ''; };

  /* ---------- panels per role ---------- */
  const section = (title, sub, body) => `<section class="ps-section"><div class="ps-section__head"><div><h2 class="ps-section__title">${title}</h2>${sub ? `<p class="ps-section__sub">${sub}</p>` : ''}</div></div><div class="ps-section__body">${body}</div></section>`;
  const notHere = () => `<div class="ps-alert ps-alert--info" role="status"><span class="ms" aria-hidden="true">info</span><div><div class="ps-alert__title">This request is ${U.esc(r.status)}</div><div class="ps-alert__text">${ACTING[ROLE]} can act only on a request at the ${U.esc(FOR[ROLE])} step. ${stage ? `It is waiting on ${U.esc(stage[2])}: <a href="${stage[1]}?id=${U.esc(r.id)}">${stage[3]}</a>.` : 'It is finished.'}</div></div></div>`;
  const remarks = (k, label) => `<div class="ps-field"><label class="ps-field__label" for="rem">${label}</label><textarea class="ps-textarea" id="rem" maxlength="1000">${U.esc(k || '')}</textarea></div>`;
  const checklist = (labels, vals, pre) => `<fieldset style="border:0;padding:0"><legend class="t-title-sm" style="margin-bottom:6px">${pre}</legend><div class="ps-stack" style="gap:4px">${labels.map((l, i) => `<label class="ps-check"><input type="checkbox" data-chk="${i}"${vals[i] ? ' checked' : ''}><span>${U.esc(l)}</span></label>`).join('')}</div></fieldset>`;

  const requesterPanel = () => {
    let top = '';
    if (r.status === 'Completed') top = `<section class="ps-section"><div class="ps-section__body"><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><span class="ps-dialog__icon" style="background:var(--ps-success-bg);color:var(--ps-success-fg)"><span class="ms" aria-hidden="true">check_circle</span></span><div><div class="t-title-md">${r.type === 'New' ? 'Item created' : 'Change applied'}${r.itemCode ? ' · <a href="item-record.html?code=' + U.esc(r.itemCode) + '">' + U.esc(r.itemCode) + '</a>' : ''}</div><div class="t-body-sm ink-3">${r.type === 'New' ? 'The code was generated after final approval. Status Active.' : 'The change is live. Buyers of open documents were informed.'}</div></div></div>
      ${dl([r.erp ? ['ERP sync', `SAP material ${U.esc(r.erp)} returned · sync complete`] : null, ['Notifications', U.esc(`${r.requester} (requester), MDM team${r.type === 'New' ? ', buyer group ' + (cat?.path.split(' › ')[0] || '') : ''}`)], r.type === 'New' ? ['Catalogue eligible', f.catalog === false ? 'No, bought through RFx' : 'Yes, buyers can add it to a catalogue'] : null, ['Turnaround', turnaround()]])}</div></section>`;
    else if (r.status === 'Sent back') top = `<div class="ps-alert ps-alert--warning" role="note"><span class="ms" aria-hidden="true">reply</span><div><div class="ps-alert__title">Sent back. Changes needed</div><div class="ps-alert__text">${U.esc(last('Sent back'))}</div></div></div>`;
    else if (r.status === 'Rejected') top = `<div class="ps-alert ps-alert--danger" role="note"><span class="ms" aria-hidden="true">block</span><div><div class="ps-alert__title">Rejected</div><div class="ps-alert__text">${U.esc(last('Rejected'))}</div></div></div>`;
    else if (r.status === 'Closed – duplicate') top = `<div class="ps-alert ps-alert--info" role="note"><span class="ms" aria-hidden="true">content_copy</span><div><div class="ps-alert__title">Closed. An existing item is used</div><div class="ps-alert__text">Use <a href="item-record.html?code=${U.esc(r.itemCode)}">${U.esc(r.itemCode)}</a>. No new code was created.</div></div></div>`;
    else if (r.status === 'Withdrawn') top = `<div class="ps-alert ps-alert--info" role="note"><span class="ms" aria-hidden="true">undo</span><div><div class="ps-alert__title">Withdrawn</div><div class="ps-alert__text">Approvals were reset. Edit and resubmit it, or discard it. It cancels itself after 7 days without action.</div></div></div>`;
    else if (stage) top = `<div class="ps-alert ps-alert--info" role="status"><span class="ms" aria-hidden="true">hourglass_top</span><div><div class="ps-alert__title">Waiting on ${U.esc(r.status === 'Pending approval' ? (r.approval?.approver || 'the approver') : stage[2])}</div><div class="ps-alert__text">Target time is 24 hours. <a href="${stage[1]}?id=${U.esc(r.id)}">${stage[3]}</a> to take the next step.</div></div></div>`;
    return top + section('Request', '', summary() + (f.justification ? `<div><div class="t-label-md ink-3">Justification</div><p>${U.esc(f.justification)}</p></div>` : '') + (f.long ? `<div><div class="t-label-md ink-3">Specification</div><p>${U.esc(f.long)}</p></div>` : '') + changes() + impact()) + dupNote();
  };
  const turnaround = () => { const n = Math.max(0, Math.round((new Date(r.hist.at(-1).at) - new Date(r.hist[0].at)) / 864e5)); return `${n} ${n === 1 ? 'day' : 'days'}, target under 2 days`; };

  let dq;
  const mdmPanel = () => {
    if (!here) return notHere() + requesterPanel();
    dq = IM.dqScore(r);
    const t = IM.getItem(r.target), isNew = r.type === 'New';
    const data = isNew ? `<div class="ps-formgrid">${U.field('m-desc', 'Short description', `<input class="ps-input" id="m-desc" data-m="desc" maxlength="40" value="${U.esc(f.desc)}" style="text-transform:uppercase">`)}
      ${U.field('m-cat', 'Material category', `<select class="ps-select" id="m-cat" data-m="cat">${U.options(IM.CATS, f.cat, 'Choose')}</select>`)}
      ${U.field('m-uom', 'Base unit', `<select class="ps-select" id="m-uom" data-m="uom">${U.options(IM.UOM, f.uom, 'Choose')}</select>`)}
      ${U.field('m-hs', 'HSN, SAC or HS code', `<input class="ps-input" id="m-hs" data-m="hs" value="${U.esc(f.hs)}">`)}
      ${U.field('m-tax', 'Tax code, India', `<select class="ps-select" id="m-tax" data-m="tax"><option value="">Choose</option>${['GST 5%', 'GST 12%', 'GST 18%', 'GST 28%', 'GST 18% (SAC)'].map(x => `<option${f.tax === x ? ' selected' : ''}>${x}</option>`).join('')}</select>`)}
      ${U.field('m-gl', 'GL account', `<input class="ps-input" id="m-gl" data-m="gl" value="${U.esc(f.gl)}">`)}
      ${U.field('m-storage', 'Storage location', r.itemType === 'Service' ? '<span class="ps-field__help">Not used for services.</span>' : `<select class="ps-select" id="m-storage" data-m="storage"><option value="">Choose</option>${['WH01', 'WH02', 'WH03'].map(x => `<option${f.storage === x ? ' selected' : ''}>${x}</option>`).join('')}</select>`)}
      ${U.field('m-code', 'Item code', `<input class="ps-input" id="m-code" value="Generated on approval" disabled>`, { help: 'Prefix and number follow the code format. The item type cannot change after creation.' })}</div>` : `${changes()}${impact()}${r.type === 'Extend' ? dl([['Item', U.esc(t?.code + ' · ' + (t?.desc || ''))], ['Extend to', U.esc(plantNames)], ['Storage location', U.esc(f.storage || 'Plant default')], ['Tax code', U.esc(f.tax || 'Default')]]) : ''}`;
    return dupNote() + section(isNew ? 'Item data, complete and clean' : 'Check the change', isNew ? 'MDM can edit any field. Changes are saved with the request.' : '', data)
      + section('MDM checklist', `${dq.checks} of 5 done`, checklist(CHECKS, r.mdmChecks || [0, 0, 0, 0, 0], 'Confirm each point') + remarks(r.mdmRemarks, 'MDM remarks'))
      + section('Data quality', '', `<div style="display:flex;gap:16px;align-items:center"><strong class="t-headline" id="dq-n">${dq.score} / 100</strong><div class="ps-progress" style="flex:1" role="img" aria-label="Data quality score ${dq.score} of 100"><i id="dq-b" style="width:${dq.score}%"></i></div></div><p class="t-body-sm" id="dq-m" style="color:${dq.score >= IM.DQ_MIN ? 'var(--ps-success-fg)' : 'var(--ps-danger-fg)'}">${dq.score >= IM.DQ_MIN ? 'Meets the target of ' + IM.DQ_MIN + ' or more.' : 'Below ' + IM.DQ_MIN + '. Missing: ' + (dq.missing.concat(dq.checks < 5 ? ['checklist'] : [])).join(', ')}</p>`);
  };
  const reviewPanel = () => { if (!here) return notHere() + requesterPanel(); const rv = r.review || {};
    return `<div class="ps-alert ps-alert--info" role="note"><span class="ms" aria-hidden="true">help</span><div><div class="ps-alert__title">Why is it here?</div><div class="ps-alert__text">The review step is on and the rule <strong>${U.esc(rv.rule)}</strong> matched. The reviewer follows a separate approval path before MDM. The requester could not skip this step.</div></div></div>`
      + section('Review checks', U.esc(rv.team || 'Quality team'), checklist(RCHECKS, rv.checks || [0, 0, 0, 0], 'Quality team') + remarks(rv.remarks, 'Review remarks')) + section('Item summary', '', summary() + (f.long ? `<p>${U.esc(f.long)}</p>` : '')); };
  const finPanel = () => { if (!here) return notHere() + requesterPanel(); const fn = r.fin || {};
    return section('Asset accounting', 'Finance sets the asset class and useful life', `<div class="ps-formgrid">${U.field('fcls', 'Asset class', `<select class="ps-select" id="fcls" aria-describedby="fcls-e">${U.options(IM.ASSET_CLASSES, fn.cls, 'Choose')}</select>`)}
      ${U.field('freg', 'Regular or CWIP', `<select class="ps-select" id="freg"><option value="regular"${fn.reg === 'regular' ? ' selected' : ''}>Regular asset</option><option value="cwip"${fn.reg === 'cwip' ? ' selected' : ''}>CWIP, capital work in progress</option></select>`)}
      ${U.field('flife', 'Useful life (months)', `<input class="ps-input" id="flife" inputmode="numeric" value="${U.esc(fn.life || '')}" aria-describedby="flife-e">`, { help: 'Defaults from the asset class.' })}
      ${U.field('fdep', 'Depreciation key', `<select class="ps-select" id="fdep"><option>Straight line</option><option>Written down value</option></select>`)}
      ${U.field('fgl', 'GL account, asset', `<select class="ps-select" id="fgl" aria-describedby="fgl-e"><option value="">Choose</option>${Object.values(GLASSET).map(g => `<option${fn.gl === g ? ' selected' : ''}>${g}</option>`).join('')}</select>`, { help: 'Only GL accounts valid today are offered.' })}</div><p class="t-body-sm ink-3">Asset numbers are created in ERP after the purchase order and goods receipt, not here.</p>`)
      + section('Item summary', '', summary()); };
  const apPanel = () => { if (!here) return notHere() + requesterPanel(); const ap = r.approval || {};
    const self = ap.approver === r.requester;
    return `<div class="ps-alert ps-alert--info" role="note"><span class="ms" aria-hidden="true">rule</span><div><div class="ps-alert__title">Rule matched: ${U.esc(ap.rule)}</div><div class="ps-alert__text">Routed to ${U.esc(ap.approver)}, ${U.esc(ap.role)}. View only: to change data, send it back.</div></div></div>${self ? '<div class="ps-alert ps-alert--warning" role="alert"><span class="ms" aria-hidden="true">person_off</span><div><div class="ps-alert__title">You raised this request</div><div class="ps-alert__text">A different approver must decide it.</div></div></div>' : ''}`
      + section('Request summary', '', summary() + dl([['Reviewed by', ['Quality team', 'MDM', ...(r.fin?.done ? ['Finance'] : [])].filter((x, i) => i || r.review?.done).map(x => x + ' ✓').join(' · ') || 'MDM ✓'], ['Data quality score', `${IM.dqScore(r).score} / 100`], ['Account assignment', r.itemType === 'Asset' ? 'A (asset)' : 'K (cost centre)']]) + changes() + impact())
      + section('Your decision', '', remarks('', 'Comment (mandatory on reject or send back)')); };

  /* ---------- actions ---------- */
  const bar = () => {
    const b = (id, label, kind, extra = '') => `<button type="button" class="ps-btn ps-btn--${kind}" id="${id}"${extra}>${label}</button>`, mine = r.requester === ME;
    if (ROLE === 'requester') {
      const edit = ['Draft', 'Withdrawn', 'Sent back'].includes(r.status) && mine, wd = IM.stateOf(r.status) === 'In progress' && r.status !== 'Sent back' && mine;
      return [wd ? b('a-withdraw', 'Withdraw request', 'secondary') : '', edit && r.status !== 'Draft' ? b('a-discard', 'Discard', 'text') : '', edit ? `<a class="ps-btn ps-btn--primary" href="item-request-new.html?id=${U.esc(r.id)}">${r.status === 'Draft' ? 'Continue editing' : 'Edit and resubmit'}</a>` : '',
        r.status === 'Completed' && r.itemCode ? `<a class="ps-btn ps-btn--secondary" href="item-request-new.html?type=Extend&item=${U.esc(r.itemCode)}">Extend to another plant</a><a class="ps-btn ps-btn--primary" href="item-record.html?code=${U.esc(r.itemCode)}">Open item</a>` : '',
        stage ? `<a class="ps-btn ps-btn--primary" href="${stage[1]}?id=${U.esc(r.id)}">${stage[3]}</a>` : ''].join('');
    }
    if (!here) return `<a class="ps-btn ps-btn--secondary" href="item-request.html?id=${U.esc(r.id)}">Open the request</a>`;
    if (ROLE === 'mdm') { const fwd = r.type === 'New' && IM.financeOn(r) ? 'Forward to finance' : IM.approvalFor(r) ? 'Forward to approver' : r.type === 'New' ? 'Approve and create item' : 'Approve and apply change';
      return b('a-reject', 'Reject', 'danger-outline') + b('a-back', 'Send back', 'secondary') + (r.review?.done ? '' : b('a-review', 'Send to review', 'secondary')) + b('a-save', 'Save changes', 'text') + b('a-fwd', fwd, 'primary'); }
    if (ROLE === 'review') return b('a-reject', 'Reject', 'danger-outline') + b('a-back', 'Send back to requester', 'secondary') + b('a-ok', 'Approve, to MDM', 'primary');
    if (ROLE === 'finance') return b('a-reject', 'Reject', 'danger-outline') + b('a-fback', 'Send back to MDM', 'secondary') + b('a-ffwd', IM.approvalFor(r) ? 'Forward to approver' : 'Approve and create item', 'primary');
    return b('a-reject', 'Reject', 'danger-outline') + b('a-back', 'Send back', 'secondary') + b('a-ok', 'Approve', 'primary');
  };
  const who = () => ({ requester: ME, mdm: 'MDM team', review: 'Quality team', finance: 'Finance (assets)', approval: r.approval?.approver || 'Approver' }[ROLE]);
  const go = (msg, to) => { PS.toast(msg); setTimeout(() => { location.href = to || 'item-request.html?id=' + r.id; }, 800); };
  const run = (action, p, msg) => { const res = IM.act(r.id, action, { who: who(), ...p }); if (!res.ok) { const e = $('errs'); e.innerHTML = `<span class="ms" aria-hidden="true">error</span><div><div class="ps-alert__title">${U.esc(res.error)}</div><div class="ps-alert__text">Nothing was changed.</div></div>`; e.hidden = false; e.focus(); return false; } go(msg(res.req)); return true; };
  const $ = i => document.getElementById(i);
  const mdmFields = () => { const o = {}; main.querySelectorAll('[data-m]').forEach(e => { o[e.dataset.m] = e.dataset.m === 'desc' ? e.value.toUpperCase() : e.value; }); return o; };
  const checks = (n) => [...main.querySelectorAll('[data-chk]')].map(c => c.checked ? 1 : 0);
  const liveDq = () => { if (ROLE !== 'mdm' || !$('dq-n')) return; Object.assign(r.f, mdmFields()); r.mdmChecks = checks(); const q = IM.dqScore(r); $('dq-n').textContent = q.score + ' / 100'; $('dq-b').style.width = q.score + '%'; const m = $('dq-m'); m.style.color = q.score >= IM.DQ_MIN ? 'var(--ps-success-fg)' : 'var(--ps-danger-fg)'; m.textContent = q.score >= IM.DQ_MIN ? `Meets the target of ${IM.DQ_MIN} or more.` : `Below ${IM.DQ_MIN}. Missing: ` + q.missing.concat(q.checks < 5 ? ['checklist'] : []).join(', '); };
  main.addEventListener('input', liveDq); main.addEventListener('change', e => { if (e.target.id === 'fcls') { const c = IM.ASSET_CLASSES[e.target.value]; if (c) { $('flife').value = c[1] || ''; $('fgl').value = GLASSET[e.target.value]; if (e.target.value === 'cwip') $('freg').value = 'cwip'; } } liveDq(); });

  const decide = async (kind) => {
    const cmt = $('rem')?.value.trim() || '';
    const verb = { reject: ['Reject', `Reject ${r.id}?`, 'The requester is told why and the request ends. This cannot be undone.', true], back: ['Send back', `Send ${r.id} back?`, 'The requester changes it and submits again.', false] }[kind];
    if (kind === 'reject' || kind === 'back') {
      const c = await U.confirm({ title: verb[1], text: verb[2], confirm: verb[0], danger: verb[3], icon: 'block', comment: { label: 'Comment', required: true }, keep: 'Keep request' }); if (!c.ok) return;
      const map = { mdm: { reject: 'mdm-reject', back: 'mdm-sendback' }, review: { reject: 'review-reject', back: 'review-sendback' }, approval: { reject: 'appr-reject', back: 'appr-sendback' }, finance: { reject: 'fin-reject', back: 'mdm-sendback' } }[ROLE];
      if (ROLE === 'mdm') IM.act(r.id, 'mdm-save', { fields: mdmFields(), checks: checks(), remarks: cmt });
      run(map[kind], { comment: c.comment }, () => kind === 'reject' ? `${r.id} rejected. The requester is told why` : `${r.id} sent back to ${r.requester}`);
    }
  };
  main.addEventListener('click', async e => { const id = e.target.closest('button')?.id; if (!id) return;
    if (id === 'a-reject') return decide('reject'); if (id === 'a-back') return decide('back');
    if (id === 'a-withdraw') { const c = await U.confirm({ title: `Withdraw ${r.id}?`, text: 'Approvals are reset. You can edit it and submit it again. It cancels itself after 7 days without action.', confirm: 'Withdraw request', danger: true, icon: 'undo', keep: 'Keep request', comment: { label: 'Reason', required: false } }); if (c.ok) run('withdraw', { who: ME, comment: c.comment }, () => `${r.id} withdrawn`); return; }
    if (id === 'a-discard') { const c = await U.confirm({ title: `Discard ${r.id}?`, text: 'The request is cancelled and kept in the list as Cancelled.', confirm: 'Discard request', danger: true, icon: 'delete', keep: 'Keep request' }); if (c.ok) run('discard', { who: ME }, () => `${r.id} discarded`); return; }
    if (id === 'a-save') { IM.act(r.id, 'mdm-save', { fields: mdmFields(), checks: checks(), remarks: $('rem').value }); PS.toast('MDM changes saved'); return; }
    if (id === 'a-review') { const c = await U.confirm({ title: `Send ${r.id} to review?`, text: 'The quality team reviews it on a separate approval path. The requester cannot skip it.', confirm: 'Send to review', keep: 'Keep with MDM', comment: { label: 'Why is a review needed?', required: false } }); if (c.ok) run('mdm-review', { comment: c.comment }, () => `${r.id} sent to review`); return; }
    if (id === 'a-fwd') { return run('mdm-forward', { fields: mdmFields(), checks: checks(), remarks: $('rem').value }, q => q.status === 'Completed' ? `Item ${q.itemCode || ''} created. Requester and MDM notified` : `${r.id} forwarded to ${q.status === 'Pending finance review' ? 'finance' : q.approval?.approver}`); }
    if (id === 'a-ok' && ROLE === 'review') { r.review.checks = checks(); r.review.remarks = $('rem').value; IM.save(); return run('review-approve', { remarks: $('rem').value }, () => `${r.id} approved by review, now with MDM`); }
    if (id === 'a-ok' && ROLE === 'approval') return run('appr-approve', { comment: $('rem').value }, q => `${r.id} approved. Item ${q.itemCode || 'updated'}`);
    if (id === 'a-fback') { const c = await U.confirm({ title: `Send ${r.id} back to MDM?`, text: 'MDM corrects the data and forwards it to finance again.', confirm: 'Send back', keep: 'Keep request', comment: { label: 'Comment', required: true } }); if (c.ok) run('fin-sendback', { comment: c.comment }, () => `${r.id} sent back to MDM`); return; }
    if (id === 'a-ffwd') { ['fcls', 'flife', 'fgl'].forEach(k => U.setErr(k, '')); const p = { cls: $('fcls').value, reg: $('freg').value, life: $('flife').value, dep: $('fdep').value, gl: $('fgl').value };
      const errs = []; if (!p.cls) errs.push(['fcls', 'Choose the asset class.']); if (p.reg !== 'cwip' && !(+p.life > 0)) errs.push(['flife', 'Enter the useful life in months.']); if (!p.gl) errs.push(['fgl', 'Choose the asset GL account.']);
      if (errs.length) { errs.forEach(([k, m]) => U.setErr(k, m)); U.errsum($('errs'), errs.map(([k, m]) => ({ id: k, msg: m }))); return; }
      if (p.reg === 'cwip') p.life = p.life || '0'; return run('fin-forward', p, q => q.status === 'Completed' ? `Item ${q.itemCode} created` : `${r.id} forwarded to ${q.approval?.approver}`); }
  });

  /* ---------- page ---------- */
  const steps = IM.steps(r);
  const body = { requester: requesterPanel, mdm: mdmPanel, review: reviewPanel, finance: finPanel, approval: apPanel }[ROLE]();
  const since = U.age(r.created);
  main.innerHTML = `<div class="ps-pagehead"><div class="ps-pagehead__text"><a class="ps-back" href="item-requests.html"><span class="ms" aria-hidden="true">arrow_back</span>Item requests</a><h1 class="t-headline">${U.esc(r.id)} · ${U.esc(f.desc)}</h1>
    <p class="ps-pagehead__meta">${U.esc(r.type)} · ${U.esc(r.itemType)} · ${U.esc(plantNames)} · requested by ${U.esc(r.requester)} via ${U.esc(r.channel.toLowerCase())} · ${U.fmtDate(r.created)}</p></div><div>${U.statusChip(r.status)}</div></div>
    ${ROLE !== 'requester' ? `<p class="t-body-sm ink-3" style="margin-top:-8px">Acting as ${U.esc(ACTING[ROLE])}. ${U.esc(TITLE[ROLE])} step.</p>` : ''}
    <div id="errs" class="ps-alert ps-alert--danger ps-errsum" role="alert" tabindex="-1" hidden></div>
    <div class="ps-split"><div class="ps-stack" style="gap:16px">${body}</div>
      <aside class="ps-split__aside" aria-label="Request progress"><section class="ps-section"><div class="ps-section__head"><h2 class="ps-section__title">Workflow</h2></div><div class="ps-section__body">${U.timeline(steps)}<p class="t-body-sm ink-3">Raised ${since === 'Today' ? 'today' : since + ' ago'}. Order of steps follows the customer's setup.</p></div></section>
      <section class="ps-section"><div class="ps-section__head"><h2 class="ps-section__title">Activity</h2></div><div class="ps-section__body">${U.history(r.hist)}</div></section></aside></div>
    <div class="ps-actionbar"><div class="ps-actionbar__sum"><div><span>Status</span><b>${U.esc(IM.STATUS[r.status]?.[1] || r.status)}</b></div><div><span>State</span><b>${U.esc(IM.stateOf(r.status))}</b></div></div><div class="ps-actionbar__btns">${bar()}</div></div>`;
  document.title = `${TITLE[ROLE]} · ${r.id}`;
}
}
