/* Procuresprint — Item master bulk actions (window.IMB). Shared by the bulk upload and bulk results pages.
   Five actions (create, update, extend, block or unblock, inactivate), a template per action with every field and dropdown lists,
   CSV and Excel (SpreadsheetML) parsing, row checks with the reason per field, and the request each valid row becomes. */
{
  const U = IMUI, KEY = 'ps-im-bulk';
  const ACTIONS = {
    create: { label: 'Create new items', icon: 'add_circle', text: 'One row per new item. Runs the duplicate check on every row.' },
    update: { label: 'Update items', icon: 'edit', text: 'Item code plus only the fields that change. Code and item type stay locked.' },
    extend: { label: 'Extend to plants', icon: 'add_location', text: 'Item code and the plant to add. No new code is created.' },
    block: { label: 'Block or unblock', icon: 'block', text: 'Item code, Block or Unblock, and the reason.' },
    inactivate: { label: 'Inactivate', icon: 'do_not_disturb_on', text: 'Item code, the reason and an optional replacement item.' },
  };
  const TAX = ['GST 5%', 'GST 12%', 'GST 18%', 'GST 28%', 'GST 18% (SAC)', 'GST 12% (SAC)'];
  const LISTS = {
    item_type: ['Goods', 'Service', 'Asset'], category: Object.keys(IM.CATS), base_unit: Object.keys(IM.UOM), plant: Object.keys(IM.PLANTS), storage_location: ['WH01', 'WH02', 'WH03'],
    tax_code: TAX, currency: ['INR', 'USD'], hazard_class: ['None', 'Class 3', 'Class 8', 'Class 9'], country_of_origin: ['India', 'China', 'USA', 'Germany', 'Japan', 'Taiwan', 'Vietnam', 'Other'],
    quality_inspection: ['Yes', 'No'], catalogue_eligible: ['Yes', 'No'], priority: ['Low', 'Medium', 'High', 'Critical'], service_type: Object.keys(IM.SVC_TYPES), asset_class: Object.keys(IM.ASSET_CLASSES), action: ['Block', 'Unblock'],
  };
  /* create: every field a requester fills, in the order of the 52-field mapping; [column, field no, what to enter, mandatory] */
  const CREATE = [['item_type', 10, 'Goods, Service or Asset', 1], ['short_description', 12, 'Up to 40 characters, upper case. Noun first', 1], ['long_description', 13, 'Full specification: size, grade, standard, colour', 1],
    ['category', 14, 'Lowest category code from the list, e.g. it-lap', 1], ['base_unit', 17, 'Unit code from the list: ' + Object.keys(IM.UOM).join(', '), 1], ['manufacturer', 18, 'Goods and assets. Who makes it', 0], ['part_number', 19, 'Manufacturer part number. Used for the duplicate check', 0],
    ['attributes', 20, 'Size, colour, grade, rating (P1)', 0], ['image_file', 21, 'File name of the catalogue image, uploaded with the file', 0], ['country_of_origin', 25, 'From the list', 0], ['gtin', 26, '8, 12, 13 or 14 digits. Goods only', 0],
    ['hazard_class', 30, 'None or Class 1 to 9. Hazardous needs an SDS file name in attachments', 0], ['quality_inspection', 31, 'Yes or No', 0], ['sustainability', 32, 'Recycled content, eco-label, energy rating (P1)', 0], ['hs_code', 33, 'HSN or HS code for goods, SAC for services', 1],
    ['tax_code', 34, 'Default tax code for the plant country, from the list', 0], ['standard_price', 37, 'Number, two decimals', 0], ['currency', 38, 'INR or USD', 0], ['lead_time_days', 40, 'Whole number of days', 0], ['min_order_qty', 41, 'Whole number', 0],
    ['catalogue_eligible', 42, 'Yes or No', 0], ['service_type', 43, 'Services only, from the list', 0], ['asset_class', 44, 'Assets only, your proposal. Finance confirms', 0], ['useful_life_months', 45, 'Assets only. Defaults from the asset class', 0],
    ['plant', 4, 'Plant code from the list: ' + Object.keys(IM.PLANTS).join(', '), 1], ['storage_location', 46, 'Goods and assets. WH01, WH02 or WH03', 0], ['priority', 8, 'Low, Medium, High or Critical', 0], ['required_by', 9, 'Date as YYYY-MM-DD, not in the past', 0],
    ['justification', 5, 'Why the item is needed, up to 1,000 characters', 1], ['attachments', 7, 'File names, separated by semicolons', 0]];
  const UPDATE_COLS = [['short_description', 'desc', 'Short description'], ['long_description', 'long', 'Long description'], ['manufacturer', 'mfr', 'Manufacturer'], ['part_number', 'mpn', 'Manufacturer part number'], ['country_of_origin', 'country', 'Country of origin'], ['gtin', 'gtin', 'GTIN or barcode'], ['hazard_class', 'hazard', 'Hazard class'], ['tax_code', 'tax', 'Tax code'], ['standard_price', 'price', 'Standard price'], ['lead_time_days', 'lead', 'Lead time (days)'], ['min_order_qty', 'moq', 'Minimum order quantity']];
  const COLS = {
    create: CREATE,
    update: [['item_code', 0, 'Existing active item code, e.g. G-100412', 1], ...UPDATE_COLS.map(([c, , l]) => [c, 0, `New ${l.toLowerCase()}. Leave empty to keep it`, 0]), ['justification', 5, 'Why the change is needed', 1]],
    extend: [['item_code', 0, 'Existing active item code', 1], ['plant', 4, 'Plant code to add', 1], ['storage_location', 46, 'WH01, WH02 or WH03', 0], ['tax_code', 34, 'From the list', 0], ['justification', 5, 'Why the plant needs it', 1]],
    block: [['item_code', 0, 'Existing item code', 1], ['action', 0, 'Block or Unblock', 1], ['justification', 5, 'Reason. Mandatory', 1]],
    inactivate: [['item_code', 0, 'Existing item code', 1], ['replacement_item', 48, 'Optional active item users are sent to', 0], ['justification', 5, 'Reason. Mandatory', 1]],
  };
  const SAMPLES = {
    create: [['Goods', 'GLOVES, LEATHER, DRIVER, PAIR', 'Leather driver gloves, cow split leather, pair', 'ppe-glv', 'PR', 'Karam', 'KG-LD1', '', '', 'India', '', 'None', 'No', '', '4203.21', 'GST 12%', '420', 'INR', '4', '10', 'Yes', '', '', '', 'CHN1', 'WH01', 'Medium', '', 'Replenish workshop stock', ''],
      ['Goods', 'HELMET, SAFETY, WHITE', 'Industrial safety helmet, white, ABS shell', 'ppe-hlm', 'EA', 'Karam', 'PN-501', '', '', 'India', '', 'None', 'Yes', '', '6506.10', 'GST 18%', '410', 'INR', '5', '1', 'Yes', '', '', '', 'CHN1', 'WH01', 'Medium', '', 'Second plant', ''],
      ['Goods', 'CABLE, USB-C, 1 M', 'USB-C to USB-C cable, 1 m', '', 'EA', 'Belkin', 'CAB-1', '', '', 'Taiwan', '890123456789', 'None', 'No', '', '8544.42', 'GST 18%', '650', 'INR', '3', '5', 'Yes', '', '', '', 'BLR1', 'WH01', 'Low', '', 'New joiner kits', ''],
      ['Service', 'SERVICE, CHILLER AMC, ANNUAL', 'Annual maintenance contract for chillers', 'svc-it', 'YR', '', '', '', '', '', '', '', '', '', '998719', 'GST 18% (SAC)', '240000', 'INR', '', '', 'No', 'maint', '', '', 'CHN1', '', 'High', '', 'Plant cooling uptime', ''],
      ['Goods', 'BEARING, BALL, 6205-2RS', 'Sealed deep groove ball bearing 25 x 52 x 15 mm', 'mro-brg', 'EA', 'SKF', '6205-2RSH', '', 'bearing-6205.jpg', 'Sweden', '', 'None', 'Yes', '', '8482.10', 'GST 18%', '395', 'INR', '4', '10', 'Yes', '', '', '', 'PNQ1', 'WH01', 'Medium', '', 'Pune line spares', 'skf-6205-datasheet.pdf'],
      ['Asset', 'ROUTER, CISCO ISR 1100, 4 PORT', 'Cisco ISR 1100 4 port router for the Coimbatore branch', 'it-net', 'EA', 'Cisco', 'C1111-4P', '', '', 'USA', '', 'None', 'No', '', '8517.62', 'GST 18%', '98000', 'INR', '21', '1', 'No', '', 'net', '60', 'CBE2', 'WH02', 'Medium', '', 'Branch network refresh', 'quote-c1111.pdf'],
      ['Goods', 'MONITOR, QHD, 24 INCH, IPS, USB-C', '24 inch QHD IPS monitor with USB-C hub', 'it-mon', 'EA', 'LG', '24QP750', '', 'lg-24qp750.jpg', 'China', '', 'None', 'No', '', '8528.52', 'GST 18%', '21900', 'INR', '7', '1', 'Yes', '', '', '', 'CHN1', 'WH01', 'Medium', '', 'Designers in Chennai', 'lg-datasheet.pdf'],
      ['Goods', 'SOLVENT, ACETONE, 5 LITRE', 'Acetone 99.5 percent, 5 litre can', 'chem-sol', 'L', 'Merck', 'ACE-5L', '', '', 'India', '', 'Class 3', 'No', '', '2914.11', 'GST 18%', '1850', 'INR', '6', '2', 'Yes', '', '', '', 'CHN1', 'WH03', 'Medium', '', 'Lab cleaning', 'spec.pdf']],
    update: [['G-100412', 'HELMET, SAFETY, WHITE, VENTED', '', '', 'PN-521', '', '', '', '', '', '', '', 'Vented model replaces the old one'], ['S-200031', '', '', '', '', '', '', '', 'GST 12% (SAC)', '', '', '', 'Supplier GST revision'], ['G-100999', '', '', '', '', '', '', '', '', '450', '', '', 'Price revision'], ['G-100208', '', '', '', '', '', '', '', '', '', '3', '', '']],
    extend: [['G-100412', 'PNQ1', 'WH01', 'GST 18%', 'Pune warehouse opens in January'], ['G-100208', 'CHN1', 'WH01', 'GST 18%', 'Already there'], ['G-100551', 'BLR1', 'WH02', 'GST 18%', 'Bangalore line spares'], ['G-100090', 'PNQ1', '', '', 'Needed in Pune']],
    block: [['G-100771', 'Block', 'Supplier recall on the padded sleeve'], ['G-100090', 'Unblock', 'Ban lifted'], ['G-100090', 'Block', 'Already blocked'], ['G-100623', 'Block', '']],
    inactivate: [['G-100771', 'G-100912', 'Discontinued by the maker'], ['G-100208', '', 'Moving to recycled paper'], ['G-100044', '', 'Already inactive'], ['G-100912', 'G-999999', 'Old model']],
  };

  /* ---------- parsing ---------- */
  const parseCsv = text => { const out = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) { const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); out.push(row); row = []; cur = ''; } else cur += c; }
    if (cur || row.length) { row.push(cur); out.push(row); } return out.filter(r => r.some(x => String(x).trim())); };
  const parseXml = text => { const doc = new DOMParser().parseFromString(text, 'application/xml'); const ws = doc.getElementsByTagName('Worksheet')[0]; if (!ws) return [];
    return [...ws.getElementsByTagName('Row')].map(r => { const out = []; [...r.getElementsByTagName('Cell')].forEach(c => { const ix = c.getAttribute('ss:Index'); if (ix) while (out.length < +ix - 1) out.push(''); out.push(c.textContent); }); return out; }).filter(r => r.some(x => String(x).trim())); };
  const parse = (text, name) => /<\?xml|<Workbook/.test(text.slice(0, 400)) || /\.xls$/i.test(name || '') ? parseXml(text) : parseCsv(text);
  const csvLine = a => a.map(v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(',');

  /* ---------- template as an Excel workbook (SpreadsheetML) with dropdowns from the master lists ---------- */
  const xesc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const colName = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const template = (action, withSample) => { const cols = COLS[action], listCols = Object.keys(LISTS);
    const valid = cols.map(([c], i) => { const k = c === 'action' && action === 'block' ? 'action' : c; if (!LISTS[k]) return ''; const li = listCols.indexOf(k); return `<DataValidation xmlns="urn:schemas-microsoft-com:office:excel"><Range>R2C${i + 1}:R1000C${i + 1}</Range><Type>List</Type><Value>Lists!R2C${li + 1}:R${LISTS[k].length + 1}C${li + 1}</Value></DataValidation>`; }).join('');
    const rows = (withSample ? SAMPLES[action] : []).map(r => `<Row>${r.map(v => `<Cell><Data ss:Type="String">${xesc(v)}</Data></Cell>`).join('')}</Row>`).join('');
    const maxL = Math.max(...Object.values(LISTS).map(l => l.length));
    const listRows = Array.from({ length: maxL }, (_, i) => `<Row>${listCols.map(k => `<Cell><Data ss:Type="String">${xesc(LISTS[k][i] ?? '')}</Data></Cell>`).join('')}</Row>`).join('');
    return `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel">
<Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#E8F2EB" ss:Pattern="Solid"/></Style><Style ss:ID="m"><Font ss:Bold="1" ss:Color="#B42318"/><Interior ss:Color="#E8F2EB" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="Items"><Table>${cols.map(() => '<Column ss:Width="140"/>').join('')}<Row>${cols.map(([c, , , m]) => `<Cell ss:StyleID="${m ? 'm' : 'h'}"><Data ss:Type="String">${c}</Data></Cell>`).join('')}</Row>${rows}</Table>${valid}</Worksheet>
<Worksheet ss:Name="What to enter"><Table><Column ss:Width="160"/><Column ss:Width="80"/><Column ss:Width="420"/><Row><Cell ss:StyleID="h"><Data ss:Type="String">Column</Data></Cell><Cell ss:StyleID="h"><Data ss:Type="String">Mandatory</Data></Cell><Cell ss:StyleID="h"><Data ss:Type="String">What to enter</Data></Cell></Row>${cols.map(([c, , w, m]) => `<Row><Cell><Data ss:Type="String">${c}</Data></Cell><Cell><Data ss:Type="String">${m ? 'Yes' : 'No'}</Data></Cell><Cell><Data ss:Type="String">${xesc(w)}</Data></Cell></Row>`).join('')}</Table></Worksheet>
<Worksheet ss:Name="Lists"><Table><Row>${listCols.map(k => `<Cell ss:StyleID="h"><Data ss:Type="String">${k}</Data></Cell>`).join('')}</Row>${listRows}</Table></Worksheet>
</Workbook>`; };
  const download = (name, text, type) => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type: type || 'text/csv' })), download: name }); document.body.append(a); a.click(); a.remove(); };

  /* ---------- row checks: errs [{col, msg}], warn [{col, msg}], dup matches ---------- */
  const v = (rec, k) => String(rec[k] ?? '').trim();
  const yes = s => /^(y|yes|true|1)$/i.test(s);
  const check = (action, rec, n) => { const errs = [], warn = [], E = (col, msg) => errs.push({ col, msg }), W = (col, msg) => warn.push({ col, msg }); let dup = [], type = '', label = '';
    const itemFor = () => { const code = v(rec, 'item_code').toUpperCase(), it = IM.getItem(code); if (!code) E('item_code', 'Item code is empty'); else if (!it) E('item_code', `No item has the code ${code}`); label = it ? `${it.code} · ${it.desc}` : code; type = it?.type || ''; return it; };
    if (v(rec, 'required_by') && v(rec, 'required_by') < IM.today()) E('required_by', 'Required by date is in the past (BR17)');
    if (action === 'create') {
      type = ['Goods', 'Service', 'Asset'].find(t => t.toLowerCase() === v(rec, 'item_type').toLowerCase()) || '';
      const desc = v(rec, 'short_description').toUpperCase(), plant = v(rec, 'plant').toUpperCase(), cat = v(rec, 'category'), uom = v(rec, 'base_unit').toUpperCase(); label = desc || '(no description)';
      if (!type) E('item_type', 'Item type must be Goods, Service or Asset');
      if (!desc) E('short_description', 'Short description is empty'); else if (desc.length > 40) E('short_description', 'Short description is longer than 40 characters');
      if (!v(rec, 'long_description')) E('long_description', 'Long description is empty');
      if (!IM.CATS[cat]) E('category', cat ? `Category ${cat} is not in the list` : 'Category is empty');
      if (!IM.UOM[uom]) E('base_unit', uom ? `Base unit ${uom} is not in the list` : 'Base unit is empty'); else if (type === 'Service' && !['JOB', 'YR'].includes(uom)) E('base_unit', 'Services use JOB or YR');
      if (!v(rec, 'hs_code')) E('hs_code', type === 'Service' ? 'SAC code is empty' : 'HSN or HS code is empty');
      if (!IM.PLANTS[plant]) E('plant', plant ? `Plant ${plant} is not in the list` : 'Plant is empty');
      if (!v(rec, 'justification')) E('justification', 'Justification is empty');
      if (v(rec, 'gtin') && !IM.gtinOk(v(rec, 'gtin'))) E('gtin', 'GTIN check digit is wrong (BR20)');
      if (v(rec, 'tax_code') && !TAX.includes(v(rec, 'tax_code'))) E('tax_code', 'Tax code is not in the list');
      if (v(rec, 'standard_price') && isNaN(+v(rec, 'standard_price'))) E('standard_price', 'Standard price must be a number');
      const hz = v(rec, 'hazard_class'); if (hz && hz !== 'None' && !/sds|safety/i.test(v(rec, 'attachments'))) E('attachments', 'Hazardous item needs a safety data sheet file name (BR14)');
      if (type === 'Asset' && v(rec, 'asset_class') && !IM.ASSET_CLASSES[v(rec, 'asset_class')]) E('asset_class', 'Asset class is not in the list');
      if (!errs.some(e => ['item_type', 'short_description', 'category', 'base_unit'].includes(e.col))) {
        dup = IM.dupCheck({ desc, mfr: v(rec, 'manufacturer'), mpn: v(rec, 'part_number'), gtin: v(rec, 'gtin'), cat, uom }, type, [plant]);
        const hard = dup.find(m => ['exact', 'blocked'].includes(m.kind)); if (hard) E('short_description', `${hard.kind === 'blocked' ? 'Matches blocked item' : 'Exact duplicate of'} ${hard.code} (${hard.pct}%)`);
        dup.filter(m => ['similar', 'pending', 'diffType', 'inactive'].includes(m.kind)).forEach(m => W('short_description', `Similar to ${m.code} (${m.pct}%). MDM will check`)); }
      if (!v(rec, 'manufacturer') && type !== 'Service') W('manufacturer', 'Manufacturer is empty. Data quality drops');
    }
    if (action === 'update') { const it = itemFor(); if (it && it.status !== 'Active') E('item_code', `${it.code} is ${it.status.toLowerCase()}. Only active items can be updated`);
      const ch = UPDATE_COLS.filter(([c]) => v(rec, c)); if (!ch.length) E('short_description', 'No field to change. Fill at least one column');
      if (v(rec, 'short_description').length > 40) E('short_description', 'Short description is longer than 40 characters');
      if (v(rec, 'tax_code') && !TAX.includes(v(rec, 'tax_code'))) E('tax_code', 'Tax code is not in the list');
      if (v(rec, 'standard_price') && isNaN(+v(rec, 'standard_price'))) E('standard_price', 'Standard price must be a number');
      if (!v(rec, 'justification')) E('justification', 'Justification is empty'); if (ch.some(([c]) => ['tax_code', 'short_description', 'long_description'].includes(c))) W('tax_code', 'Critical field changes go to the finance approver (BR42)'); }
    if (action === 'extend') { const it = itemFor(), plant = v(rec, 'plant').toUpperCase(); if (it && it.status !== 'Active') E('item_code', `${it.code} is ${it.status.toLowerCase()} and cannot be extended`);
      if (!IM.PLANTS[plant]) E('plant', plant ? `Plant ${plant} is not in the list` : 'Plant is empty'); else if (it?.plants.some(p => p.code === plant)) E('plant', `${it.code} is already in ${IM.PLANTS[plant][0]} (BR43)`);
      if (!v(rec, 'justification')) E('justification', 'Justification is empty'); }
    if (action === 'block') { const it = itemFor(), a = v(rec, 'action'); if (!['Block', 'Unblock'].includes(a)) E('action', 'Action must be Block or Unblock');
      else if (it && a === 'Block' && it.status === 'Blocked') E('action', `${it.code} is already blocked`); else if (it && a === 'Unblock' && it.status !== 'Blocked') E('action', `${it.code} is not blocked`);
      if (!v(rec, 'justification')) E('justification', 'The reason is mandatory'); if (it?.docs.length) W('item_code', `Open documents: ${it.docs.map(d => d[0]).join(', ')}. Buyers are told`); }
    if (action === 'inactivate') { const it = itemFor(); if (it && it.status === 'Inactive') E('item_code', `${it.code} is already inactive`);
      const rp = v(rec, 'replacement_item').toUpperCase(); if (rp && !(IM.getItem(rp)?.status === 'Active')) E('replacement_item', `Replacement ${rp} is not an active item`);
      if (!v(rec, 'justification')) E('justification', 'The reason is mandatory'); }
    const exact = errs.some(e => /duplicate|blocked item/i.test(e.msg)), similar = !errs.length && warn.some(w => /Similar/.test(w.msg));
    return { n, rec, type, label, errs, warn, dup, state: errs.length ? (exact ? 'duplicate' : 'error') : similar ? 'similar' : 'ready' }; };

  /* ---------- a valid row becomes a request ---------- */
  const submitRow = (action, x, who) => { const rec = x.rec;
    if (action === 'create') { const r = IM.blank('New', x.type, who); r.channel = 'Portal bulk upload'; const c = IM.CATS[v(rec, 'category')]; const plant = v(rec, 'plant').toUpperCase();
      Object.assign(r.f, { desc: v(rec, 'short_description').toUpperCase(), long: v(rec, 'long_description'), cat: v(rec, 'category'), uom: v(rec, 'base_unit').toUpperCase(), hs: v(rec, 'hs_code') || c.hs, mfr: v(rec, 'manufacturer'), mpn: v(rec, 'part_number'), gtin: v(rec, 'gtin'), country: v(rec, 'country_of_origin'), hazard: v(rec, 'hazard_class') || 'None', qi: yes(v(rec, 'quality_inspection')), attrs: v(rec, 'attributes'), image: v(rec, 'image_file'), sustain: v(rec, 'sustainability'),
        gl: c.gl, plants: [plant], storage: v(rec, 'storage_location') || (x.type === 'Service' ? '' : IM.PLANTS[plant][1]), tax: v(rec, 'tax_code') || (x.type === 'Service' ? 'GST 18% (SAC)' : 'GST 18%'), price: v(rec, 'standard_price'), cur: v(rec, 'currency') || 'INR', lead: v(rec, 'lead_time_days'), moq: v(rec, 'min_order_qty'), catalog: v(rec, 'catalogue_eligible') ? yes(v(rec, 'catalogue_eligible')) : true, svcType: v(rec, 'service_type'), assetClass: v(rec, 'asset_class'), life: v(rec, 'useful_life_months'),
        priority: v(rec, 'priority') || 'Medium', needBy: v(rec, 'required_by'), justification: v(rec, 'justification'), attachments: v(rec, 'attachments') ? v(rec, 'attachments').split(/;\s*/) : [] });
      r.dup = { checked: true, matches: x.dup.map(m => m.code), decision: x.state === 'similar' ? 'Not a duplicate' : '', reason: x.state === 'similar' ? `Bulk upload row ${x.n}: MDM to confirm` : '' }; IM.saveRequest(r); return IM.act(r.id, 'submit', { who }).ok; }
    const it = IM.getItem(v(rec, 'item_code').toUpperCase()); const ty = action === 'block' ? v(rec, 'action') : { update: 'Update', extend: 'Extend', inactivate: 'Inactivate' }[action];
    const r = IM.blank(ty, it.type, who); r.channel = 'Portal bulk upload'; r.target = it.code; r.f.desc = it.desc; r.f.cat = it.cat; r.f.hazard = it.hazard; r.f.justification = v(rec, 'justification');
    r.f.plants = action === 'extend' ? [v(rec, 'plant').toUpperCase()] : it.plants.map(p => p.code); if (action === 'extend') { r.f.storage = v(rec, 'storage_location') || IM.PLANTS[r.f.plants[0]][1]; r.f.tax = v(rec, 'tax_code') || it.plants[0]?.tax; }
    if (action === 'update') { const cur = { desc: it.desc, long: it.long, mfr: it.mfr, mpn: it.mpn, country: it.country, gtin: it.gtin, hazard: it.hazard, tax: it.plants[0]?.tax, price: String(it.price || ''), lead: String(it.lead || ''), moq: String(it.moq || '') };
      r.changes = UPDATE_COLS.filter(([c]) => v(rec, c)).map(([c, k, l]) => [l === 'Short description' ? 'Description' : l, cur[k] || '', v(rec, c)]); }
    if (action === 'inactivate') r.replacement = v(rec, 'replacement_item').toUpperCase();
    r.dup = { checked: true, matches: [] }; IM.saveRequest(r); return IM.act(r.id, 'submit', { who }).ok; };

  const store = { save: o => { try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch { /* storage unavailable */ } }, load: () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } } };
  window.IMB = { ACTIONS, COLS, LISTS, SAMPLES, parse, csvLine, template, download, check, submitRow, store, v };
}
