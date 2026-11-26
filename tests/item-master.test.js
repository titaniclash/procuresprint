import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';
import { screens } from '../scripts/screens.mjs';
import { exists, read } from './helpers.js';

/** Loads the classic item-master.js script into a sandbox with an in-memory localStorage. */
function load() {
  const store = {};
  const win = {};
  const ctx = { window: win, localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } } };
  vm.runInNewContext(read('public/assets/js/item-master.js'), ctx);
  return win.IM;
}

let IM;
beforeEach(() => { IM = load(); });

/** A complete New goods request that passes validation and data quality. */
function goodRequest(over = {}) {
  const r = IM.blank('New', 'Goods', 'John Doe');
  Object.assign(r.f, { desc: 'CABLE, USB-C TO USB-C, 1 M', long: 'USB-C cable, 1 metre', cat: 'it-net', uom: 'EA', hs: '8517.62', gl: '520100', tax: 'GST 18%', storage: 'WH01', mfr: 'Belkin', mpn: 'CAB-1', country: 'India', lead: 5, price: 900, attachments: ['spec.pdf'], plants: ['CHN1'], justification: 'Joiner kits' }, over);
  r.mdmChecks = [1, 1, 1, 1, 1];
  IM.saveRequest(r);
  return r;
}

describe('item master sample data', () => {
  it('has items and requests across every state', () => {
    const { items, reqs } = IM.db();
    expect(items.length).toBeGreaterThanOrEqual(10);
    expect(new Set(items.map((i) => i.status))).toEqual(new Set(['Active', 'Blocked', 'Inactive']));
    expect(new Set(reqs.map((r) => IM.stateOf(r.status)))).toEqual(new Set(['Draft', 'In progress', 'Completed']));
    expect(new Set(reqs.map((r) => r.type)).size).toBeGreaterThanOrEqual(5);
  });
  it('every completed request points at an item that exists', () => {
    for (const r of IM.db().reqs.filter((x) => x.status === 'Completed' && x.itemCode)) expect(IM.getItem(r.itemCode)).toBeTruthy();
  });
});

describe('duplicate check', () => {
  it('blocks the same manufacturer and part number (BR22)', () => {
    const m = IM.dupCheck({ desc: 'laptop', mfr: 'Lenovo', mpn: '21HD0012' }, 'Asset', ['CHN1']);
    expect(m[0]).toMatchObject({ code: 'A-200118', kind: 'exact' });
  });
  it('treats word order, plural and case as the same description (BR21)', () => {
    const m = IM.dupCheck({ desc: 'nitrile gloves size m box 100', cat: 'ppe-glv', uom: 'BX' }, 'Goods', ['CHN1']);
    expect(m[0].kind).toBe('exact');
  });
  it('refuses a match with a blocked item (BR26)', () => {
    expect(IM.dupCheck({ desc: 'gasket kit asbestos', mfr: 'Flexitallic', mpn: 'AG-220' }, 'Goods', ['CHN1'])[0].kind).toBe('blocked');
  });
  it('only warns when the same name has another item type (BR23)', () => {
    expect(IM.dupCheck({ desc: 'LAPTOP, LENOVO THINKPAD T14 GEN 4, 16GB' }, 'Goods', ['CHN1'])[0].kind).toBe('diffType');
  });
  it('finds nothing for a new item', () => {
    expect(IM.dupCheck({ desc: 'CABLE, USB-C TO USB-C, 1 M', cat: 'it-net', uom: 'EA' }, 'Goods', ['CHN1'])).toEqual([]);
  });
});

describe('validation', () => {
  it('limits the short description to 40 characters and validates the GTIN check digit', () => {
    const r = goodRequest({ desc: 'X'.repeat(41), gtin: '8901234567891' });
    expect(IM.validate(r).map((e) => e.id)).toEqual(expect.arrayContaining(['desc', 'gtin']));
    expect(IM.gtinOk('8901234567890')).toBe(true);
  });
  it('needs a safety data sheet for hazardous goods (BR14) and a reason for the lifecycle change', () => {
    expect(IM.validate(goodRequest({ hazard: 'Class 3', attachments: ['spec.pdf'] })).some((e) => e.id === 'att')).toBe(true);
    const b = IM.blank('Block', 'Goods', 'John Doe');
    expect(IM.validate(b).some((e) => e.id === 'just')).toBe(true);
  });
  it('refuses extending an item to a plant it already has (BR43)', () => {
    const r = IM.blank('Extend', 'Goods', 'John Doe');
    Object.assign(r, { target: 'G-100412' }); Object.assign(r.f, { plants: ['CHN1'], justification: 'x' });
    expect(IM.validate(r).some((e) => e.id === 'plants')).toBe(true);
  });
});

describe('workflow', () => {
  it('submits to MDM, then MDM completes a clean goods item and creates the code (BR39)', () => {
    const r = goodRequest();
    expect(IM.act(r.id, 'submit', { who: 'John Doe' }).req.status).toBe('Pending MDM');
    const done = IM.act(r.id, 'mdm-forward', { who: 'MDM team' });
    expect(done.req.status).toBe('Completed');
    expect(done.req.itemCode).toMatch(/^G-\d{6}$/);
    expect(IM.getItem(done.req.itemCode).status).toBe('Active');
  });
  it('routes a food ingredient through In review before MDM (BR46)', () => {
    const r = goodRequest({ cat: 'food-spc', desc: 'TURMERIC, WHOLE, 25KG', mfr: '', mpn: '' });
    expect(IM.act(r.id, 'submit').req.status).toBe('In review');
    expect(IM.act(r.id, 'review-approve', { who: 'Quality team' }).req.status).toBe('Pending MDM');
  });
  it('blocks MDM approval under a data quality of 80 (BR33)', () => {
    const r = goodRequest({ hs: '', gl: '', tax: '', storage: '', long: '' });
    r.mdmChecks = [0, 0, 0, 0, 0];
    IM.act(r.id, 'submit');
    const res = IM.act(r.id, 'mdm-forward');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/80 percent/);
  });
  it('requires a comment to send back or reject (BR32)', () => {
    const r = goodRequest(); IM.act(r.id, 'submit');
    expect(IM.act(r.id, 'mdm-sendback', {}).ok).toBe(false);
    expect(IM.act(r.id, 'mdm-reject', { comment: '  ' }).ok).toBe(false);
    expect(IM.act(r.id, 'mdm-sendback', { comment: 'Add the datasheet' }).req.status).toBe('Sent back');
  });
  it('sends Asset items to finance, then to the approver when over USD 5,000, and the requester cannot approve (BR37)', () => {
    const r = goodRequest({ cat: 'it-lap', desc: 'LAPTOP, DELL LATITUDE 5440', mfr: 'Dell', mpn: 'L5440', price: 120000 });
    r.itemType = 'Asset'; IM.saveRequest(r); IM.act(r.id, 'submit');
    expect(IM.act(r.id, 'mdm-forward').req.status).toBe('Pending finance review');
    expect(IM.act(r.id, 'fin-forward', { cls: 'it-hw', life: 36, gl: '120100', reg: 'regular' }).req.status).toBe('Pending approval');
    expect(IM.act(r.id, 'appr-approve', { who: 'John Doe' }).error).toMatch(/different approver/);
    expect(IM.act(r.id, 'appr-approve', { who: 'Ananya Rao' }).req.status).toBe('Completed');
  });
  it('lets the requester withdraw an in-progress request (BR38) and applies a block on completion', () => {
    const r = goodRequest(); IM.act(r.id, 'submit');
    expect(IM.act(r.id, 'withdraw', { who: 'John Doe' }).req.status).toBe('Withdrawn');
    const b = IM.blank('Block', 'Goods', 'MDM team'); b.target = 'G-100208'; b.f.justification = 'Quality recall'; b.f.plants = ['CHN1']; IM.saveRequest(b);
    IM.act(b.id, 'submit'); IM.act(b.id, 'mdm-forward', { who: 'MDM team' });
    expect(IM.act(b.id, 'appr-approve', { who: 'Nirmala Bhat' }).req.status).toBe('Completed');
    expect(IM.getItem('G-100208').status).toBe('Blocked');
  });
  it('persists to localStorage and resets to the sample data', () => {
    const r = goodRequest(); IM.act(r.id, 'submit');
    expect(IM.getReq(r.id)).toBeTruthy();
    IM.reset();
    expect(IM.getReq(r.id)).toBeUndefined();
  });
});

describe('the Item master screens', () => {
  const item = screens.filter((s) => s.file.startsWith('modules/item-'));
  it('twelve screens are registered, built, and cite features and journeys', () => {
    expect(item).toHaveLength(12);
    for (const s of item) { expect(exists(s.file)).toBe(true); expect(s.features.length).toBeGreaterThan(0); expect(s.journeys.length).toBeGreaterThan(0); }
  });
  it('the admin configuration screen is not built', () => {
    expect(item.some((s) => /admin|settings/i.test(s.name))).toBe(false);
  });
  it('the sidebar has an Item Master group pointing at them', () => {
    const js = read('public/assets/js/ps.js');
    for (const h of ['item-requests', 'item-master', 'item-bulk-upload', 'item-ask-me', 'item-insights']) expect(js).toContain(`modules/${h}.html`);
  });
});
