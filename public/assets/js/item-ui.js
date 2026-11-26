/* Procuresprint — Item master shared UI helpers (window.IMUI). Classic script, no dependencies. */
{
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = iso => { if (!iso) return '—'; const [y, m, d] = String(iso).split('-'); return `${d} ${MON[+m - 1]} ${y}`; };
  const age = iso => { const n = Math.round((new Date(IM.today()) - new Date(iso)) / 864e5); return n <= 0 ? 'Today' : n === 1 ? '1 day' : n + ' days'; };
  const chip = (tone, label, icon) => `<span class="ps-chip${tone ? ' ps-chip--' + tone : ''}">${icon ? `<span class="ms" aria-hidden="true">${icon}</span>` : ''}${esc(label)}</span>`;
  const statusChip = s => { const t = IM.STATUS[s] || ['', s]; return chip(t[0], t[1], t[2]); };
  const itemChip = s => { const t = IM.ITEM_STATUS[s] || ['', s]; return chip(t[0], t[1], t[2]); };
  const typeChip = t => chip('plain', t);
  const num = n => Number(n || 0).toLocaleString('en-IN');
  const money = (n, cur) => n ? `${cur === 'USD' ? '$' : '₹'}${num(n)}` : '—';

  /* labelled field wrapper in the design system's field pattern */
  const field = (id, label, control, o = {}) => `<div class="ps-field${o.span ? ' span-2' : ''}"><label class="ps-field__label" for="${id}">${esc(label)}${o.opt ? ' <span class="ps-field__opt">(optional)</span>' : ''}${o.ai ? ' ' + o.ai : ''}</label>${control}${o.help ? `<span class="ps-field__help" id="${id}-h">${esc(o.help)}</span>` : ''}<span class="ps-field__error" id="${id}-e" hidden></span></div>`;
  const options = (map, sel, blank) => (blank ? `<option value="">${esc(blank)}</option>` : '') + Object.entries(map).map(([k, v]) => `<option value="${esc(k)}"${k === sel ? ' selected' : ''}>${esc(Array.isArray(v) ? v[0] : v.path || v)}</option>`).join('');
  const setErr = (id, msg) => { const el = document.getElementById(id), er = document.getElementById(id + '-e'); if (el) el.setAttribute('aria-invalid', String(!!msg)); if (er) { er.hidden = !msg; er.innerHTML = msg ? `<span class="ms" aria-hidden="true">error</span>${esc(msg)}` : ''; } };

  const timeline = steps => `<ol class="ps-timeline">${steps.map(s => `<li><span class="ps-timeline__mark${s.state === 'done' ? ' ps-timeline__mark--done' : s.state === 'now' ? ' ps-timeline__mark--now' : ''}"><span class="ms" aria-hidden="true">${s.state === 'done' ? 'check' : s.state === 'now' ? 'hourglass_top' : 'more_horiz'}</span></span><div><div class="ps-timeline__title">${esc(s.label)}${s.state === 'now' ? ' <span class="t-body-sm ink-3">(current)</span>' : ''}</div><div class="ps-timeline__meta">${esc(s.who)}${s.note ? ' · ' + esc(s.note) : ''}</div></div></li>`).join('')}</ol>`;
  const history = h => h.length ? `<ol class="ps-timeline">${[...h].reverse().map(x => `<li><span class="ps-timeline__mark"><span class="ms" aria-hidden="true">history</span></span><div><div class="ps-timeline__title">${esc(x.action)}</div><div class="ps-timeline__meta">${esc(x.who)} · ${fmtDate(x.at)}</div>${x.comment ? `<p class="t-body-sm" style="margin-top:2px">${esc(x.comment)}</p>` : ''}</div></li>`).join('')}</ol>` : '<p class="ink-3 t-body-sm">No activity yet.</p>';

  let dlg;
  /* confirm dialog; opts: title, text, confirm, danger, icon, comment: { label, required } -> Promise<{ ok, comment }> */
  const confirm = o => new Promise(res => {
    dlg?.remove(); dlg = document.createElement('dialog'); dlg.className = 'ps-dialog'; dlg.setAttribute('aria-labelledby', 'imd-t');
    const c = o.comment;
    dlg.innerHTML = `<form method="dialog"><div class="ps-dialog__head">${o.danger ? `<span class="ps-dialog__icon ps-dialog__icon--danger"><span class="ms" aria-hidden="true">${o.icon || 'warning'}</span></span>` : ''}<h2 class="ps-dialog__title" id="imd-t">${esc(o.title)}</h2></div>
      <div class="ps-dialog__body"><p>${esc(o.text || '')}</p>${c ? `<div class="ps-field"><label class="ps-field__label" for="imd-c">${esc(c.label)}${c.required ? '' : ' <span class="ps-field__opt">(optional)</span>'}</label><textarea class="ps-textarea" id="imd-c" style="min-height:72px" ${c.required ? 'aria-describedby="imd-e"' : ''}></textarea><span class="ps-field__error" id="imd-e" hidden><span class="ms" aria-hidden="true">error</span>This comment is mandatory.</span></div>` : ''}</div>
      <div class="ps-dialog__foot"><button class="ps-btn ps-btn--text" type="button" data-no>${esc(o.keep || 'Keep as is')}</button><button class="ps-btn ps-btn--${o.danger ? 'danger' : 'primary'}" type="submit" data-yes>${esc(o.confirm)}</button></div></form>`;
    document.body.append(dlg);
    const done = (ok, comment) => { dlg.close(); res({ ok, comment }); };
    dlg.querySelector('[data-no]').addEventListener('click', () => done(false));
    dlg.addEventListener('cancel', () => res({ ok: false }));
    dlg.querySelector('form').addEventListener('submit', e => { e.preventDefault(); const v = dlg.querySelector('#imd-c')?.value.trim() || ''; if (c?.required && !v) { const er = dlg.querySelector('#imd-e'); er.hidden = false; dlg.querySelector('#imd-c').setAttribute('aria-invalid', 'true'); dlg.querySelector('#imd-c').focus(); return; } done(true, v); });
    dlg.showModal(); (dlg.querySelector('#imd-c') || dlg.querySelector('[data-yes]')).focus();
  });

  const errsum = (el, errs) => { el.innerHTML = `<span class="ms" aria-hidden="true">error</span><div><div class="ps-alert__title">${errs.length} ${errs.length === 1 ? 'thing needs' : 'things need'} attention</div><ul>${errs.map(e => `<li><a href="#${esc(e.id)}">${esc(e.msg)}</a></li>`).join('')}</ul></div>`; el.hidden = false; el.focus(); };
  const qs = new URLSearchParams(location.search);
  window.IMUI = { esc, fmtDate, age, chip, statusChip, itemChip, typeChip, num, money, field, options, setErr, timeline, history, confirm, errsum, qs };
}
