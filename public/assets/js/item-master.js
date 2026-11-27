/* Procuresprint — Item master data layer (window.IM).
   Sample items and requests, one small store persisted in localStorage, and the rules from the Item Master BRD:
   workflow routing, duplicate check (BR21-BR29), data quality score (BR33), code generation (BR39).
   No network. Reset from Item requests > More > Reset sample data. */
{
  const KEY = 'ps-im-v1';
  const USD_INR = 85; /* ASSUMED sample rate, only used to compare a price with the USD 5,000 approval limit */
  const LIMIT_USD = 5000, DQ_MIN = 80;

  const PLANTS = { BLR1: ['Bangalore', 'WH01'], CHN1: ['Chennai', 'WH01'], CBE2: ['Coimbatore', 'WH02'], PNQ1: ['Pune', 'WH01'] };
  /* lowest-level categories; UNSPSC, HS and GL here are illustrative sample values to be confirmed by the MDM team */
  const CATS = {
    'it-lap': { path: 'IT hardware › Laptops', unspsc: '43211503', hs: '8471.30', gl: '520100', owner: 'Ananya Rao', ownerRole: 'IT category manager' },
    'it-mon': { path: 'IT hardware › Monitors', unspsc: '43211902', hs: '8528.52', gl: '520100', owner: 'Ananya Rao', ownerRole: 'IT category manager' },
    'it-net': { path: 'IT hardware › Networking', unspsc: '43222609', hs: '8517.62', gl: '520100', owner: 'Ananya Rao', ownerRole: 'IT category manager' },
    'ppe-glv': { path: 'Safety & PPE › Gloves', unspsc: '46181504', hs: '4015.19', gl: '530200', owner: 'Sanjay Pillai', ownerRole: 'Safety & PPE category owner' },
    'ppe-hlm': { path: 'Safety & PPE › Helmets', unspsc: '46181501', hs: '6506.10', gl: '530200', owner: 'Sanjay Pillai', ownerRole: 'Safety & PPE category owner' },
    'mro-brg': { path: 'Industrial & MRO › Bearings', unspsc: '31171504', hs: '8482.10', gl: '540100', owner: 'Sanjay Pillai', ownerRole: 'MRO category owner' },
    'mro-gsk': { path: 'Industrial & MRO › Gaskets', unspsc: '31401500', hs: '6806.20', gl: '540100', owner: 'Sanjay Pillai', ownerRole: 'MRO category owner' },
    'off-ppr': { path: 'Office supplies › Paper', unspsc: '14111507', hs: '4802.56', gl: '550100', owner: 'Divya Menon', ownerRole: 'Office category owner' },
    'off-fur': { path: 'Furniture › Chairs', unspsc: '56112102', hs: '9401.30', gl: '550300', owner: 'Divya Menon', ownerRole: 'Office category owner' },
    'food-spc': { path: 'Food ingredients › Spices', unspsc: '50171500', hs: '0910.30', gl: '560100', owner: 'Divya Menon', ownerRole: 'Food category owner' },
    'chem-sol': { path: 'Chemicals › Solvents', unspsc: '12352100', hs: '2905.12', gl: '570100', owner: 'Deepa Krishnan', ownerRole: 'HSE approver' },
    'svc-it': { path: 'IT services › Repair and support', unspsc: '81112300', hs: '998719', gl: '620100', owner: 'Ananya Rao', ownerRole: 'IT category manager' },
    'svc-cal': { path: 'Facility services › Calibration', unspsc: '81141600', hs: '998346', gl: '620200', owner: 'Sanjay Pillai', ownerRole: 'MRO category owner' },
    'uav': { path: 'Capital equipment › Aerial survey', unspsc: '25101700', hs: '8806.21', gl: '210500', owner: 'Vikram Sen', ownerRole: 'Finance controller' },
  };
  const UOM = { EA: 'Each', BX: 'Box', RM: 'Ream', PR: 'Pair', KG: 'Kilogram', L: 'Litre', JOB: 'Job', YR: 'Year', SET: 'Set' };
  const ASSET_CLASSES = { 'it-hw': ['IT hardware', 36], 'net': ['Network equipment', 60], 'plant': ['Plant and machinery', 120], 'cwip': ['Capital work in progress', 0] };
  const REVIEW_CATS = ['food-spc'];
  const PEOPLE = { approvers: { fin: ['Vikram Sen', 'Finance controller'], hse: ['Deepa Krishnan', 'HSE approver'], comp: ['Nirmala Bhat', 'Compliance approver'] } };

  /* status -> [tone, label, icon] shared by every Item master screen */
  const STATUS = {
    Draft: ['', 'Draft', 'edit_note'], Withdrawn: ['', 'Withdrawn', 'undo'], 'In review': ['ai', 'In review', 'rate_review'],
    'Pending MDM': ['info', 'Pending MDM', 'hourglass_top'], 'Pending finance review': ['info', 'Pending finance', 'account_balance'],
    'Pending approval': ['warning', 'Pending approval', 'pending_actions'], 'Sent back': ['danger', 'Sent back', 'reply'],
    Completed: ['success', 'Completed', 'check'], Rejected: ['danger', 'Rejected', 'block'], 'Closed – duplicate': ['', 'Closed – duplicate', 'content_copy'], Cancelled: ['', 'Cancelled', 'cancel'],
  };
  const stateOf = s => (s === 'Draft' || s === 'Withdrawn') ? 'Draft' : ['Completed', 'Rejected', 'Closed – duplicate', 'Cancelled'].includes(s) ? 'Completed' : 'In progress';
  const ITEM_STATUS = { Active: ['success', 'Active', 'check'], Blocked: ['danger', 'Blocked', 'block'], Inactive: ['', 'Inactive', 'do_not_disturb_on'] };

  const d = (iso, who, action, comment) => ({ at: iso, who, action, comment: comment || '' });
  const plant = (c, tax) => ({ code: c, name: PLANTS[c][0], storage: PLANTS[c][1], tax: tax || 'GST 18%' });
  const item = o => ({ docs: [], erp: '', long: '', mfr: '', mpn: '', gtin: '', country: 'India', alternates: [], replacement: '', catalog: true, hazard: 'None', qi: false, assetClass: '', life: 0, price: 0, cur: 'INR', lead: 0, moq: 1, history: [], ...o });
  const ITEMS = [
    item({ code: 'A-200118', erp: '10003877', desc: 'LAPTOP, LENOVO THINKPAD T14 GEN 4, 16GB', long: '14 inch business laptop, Intel Core i7, 16 GB RAM, 512 GB SSD, Windows 11 Pro, 3 year on-site warranty.', type: 'Asset', cat: 'it-lap', uom: 'EA', mfr: 'Lenovo', mpn: '21HD0012', country: 'China', assetClass: 'it-hw', life: 36, price: 98500, lead: 10, status: 'Active', plants: [plant('BLR1')], created: '2026-03-12', history: [d('2026-03-12', 'MDM team', 'Item created', 'From IR26000012')] }),
    item({ code: 'G-100330', erp: '10004102', desc: 'GLOVES, NITRILE, SIZE M, BOX 100', long: 'Disposable nitrile examination gloves, powder free, size M, box of 100.', type: 'Goods', cat: 'ppe-glv', uom: 'BX', mfr: '3M India', mpn: 'NG-M-100', gtin: '8901234567890', price: 640, lead: 4, moq: 10, status: 'Active', plants: [plant('CHN1')], created: '2026-11-25', history: [d('2026-11-25', 'MDM team', 'Item created', 'From IR26000080')] }),
    item({ code: 'G-100412', erp: '10003985', desc: 'HELMET, SAFETY, WHITE', long: 'Industrial safety helmet, white, ABS shell, 6 point suspension, IS 2925.', type: 'Goods', cat: 'ppe-hlm', uom: 'EA', mfr: 'Karam', mpn: 'PN-501', qi: true, docs: [['PR-2025-00131', 'Purchase request'], ['RFQ-2025-612', 'RFx event']], price: 410, lead: 5, status: 'Active', plants: [plant('BLR1'), plant('CHN1')], created: '2026-01-20', history: [d('2026-01-20', 'MDM team', 'Item created', 'From IR26000031')] }),
    item({ code: 'G-100771', desc: 'SLEEVE, LAPTOP, 14 INCH', long: 'Padded laptop sleeve for 14 inch devices.', type: 'Goods', cat: 'it-lap', uom: 'EA', mfr: 'Dell', mpn: 'SL-14', price: 780, lead: 3, status: 'Active', plants: [plant('BLR1')], created: '2026-05-04', history: [d('2026-05-04', 'MDM team', 'Item created', 'From IR26000044')] }),
    item({ code: 'G-100090', desc: 'KIT, GASKET, ASBESTOS', long: 'Gasket kit with asbestos fibre. Banned on compliance grounds.', type: 'Goods', cat: 'mro-gsk', uom: 'SET', mfr: 'Flexitallic', mpn: 'AG-220', hazard: 'Class 9', price: 3200, status: 'Blocked', plants: [plant('CHN1')], created: '2025-07-02', history: [d('2025-07-02', 'MDM team', 'Item created'), d('2026-11-24', 'MDM team', 'Blocked', 'Compliance: asbestos ban. IR26000076')] }),
    item({ code: 'G-100551', erp: '10004020', desc: 'BEARING, BALL, 6204-2RS', long: 'Sealed deep groove ball bearing, 20 x 47 x 14 mm, 2RS.', type: 'Goods', cat: 'mro-brg', uom: 'EA', mfr: 'SKF', mpn: '6204-2RSH', docs: [['PO-2603148', 'Purchase order'], ['CAT-1002', 'Catalogue listing']], price: 342, lead: 4, moq: 10, qi: true, status: 'Active', plants: [plant('CHN1'), plant('PNQ1')], created: '2026-02-10', history: [d('2026-02-10', 'MDM team', 'Item created', 'From IR26000019')] }),
    item({ code: 'G-100208', erp: '10003410', desc: 'PAPER, A4, 75 GSM, REAM', long: 'Copier paper A4, 75 GSM, 500 sheets per ream, bright white.', type: 'Goods', cat: 'off-ppr', uom: 'RM', mfr: 'JK Paper', mpn: 'JK-A4-75', price: 285, lead: 2, moq: 5, status: 'Active', plants: [plant('BLR1'), plant('CHN1'), plant('CBE2'), plant('PNQ1')], created: '2025-09-18', history: [d('2025-09-18', 'MDM team', 'Item created', 'From IR26000004')] }),
    item({ code: 'S-200031', desc: 'SERVICE, LAPTOP ANNUAL REPAIR', long: 'Annual laptop repair and replacement-part service, on-site.', type: 'Service', cat: 'svc-it', uom: 'YR', price: 125000, cur: 'INR', status: 'Active', plants: [plant('CHN1', 'GST 18% (SAC)'), plant('BLR1', 'GST 18% (SAC)')], created: '2026-04-16', history: [d('2026-04-16', 'MDM team', 'Item created', 'From IR26000039')] }),
    item({ code: 'G-100044', erp: '10001390', desc: 'MONITOR, CRT, 17 INCH', long: 'Obsolete CRT monitor, 17 inch.', type: 'Goods', cat: 'it-mon', uom: 'EA', mfr: 'Samsung', mpn: 'SM-795', price: 4200, status: 'Inactive', replacement: 'G-100912', plants: [plant('CHN1')], created: '2023-10-09', history: [d('2023-10-09', 'MDM team', 'Item created'), d('2026-11-23', 'MDM team', 'Inactivated', 'Obsolete. Replacement G-100912. IR26000072')] }),
    item({ code: 'G-100912', erp: '10004388', desc: 'MONITOR, QHD, 24 INCH, IPS', long: '24 inch QHD IPS monitor with USB-C and height-adjustable stand.', type: 'Goods', cat: 'it-mon', uom: 'EA', mfr: 'Dell', mpn: 'U2422H', docs: [['PR-2025-00123', 'Purchase request'], ['CAT-1003', 'Catalogue listing']], price: 18400, lead: 7, status: 'Active', alternates: ['G-100044'], plants: [plant('BLR1'), plant('CHN1')], created: '2026-06-01', history: [d('2026-06-01', 'MDM team', 'Item created', 'From IR26000047')] }),
    item({ code: 'A-200067', erp: '10003712', desc: 'ROUTER, CISCO ISR 1100, 8 PORT', long: 'Cisco ISR 1100 8 port dual GE WAN router.', type: 'Asset', cat: 'it-net', uom: 'EA', mfr: 'Cisco', mpn: 'C1111-8P', country: 'USA', assetClass: 'net', life: 60, price: 145000, lead: 21, status: 'Active', plants: [plant('BLR1')], created: '2026-02-27', history: [d('2026-02-27', 'MDM team', 'Item created', 'From IR26000022')] }),
    item({ code: 'G-100623', desc: 'CHAIR, ERGONOMIC, MESH BACK', long: 'Ergonomic task chair, mesh back, adjustable lumbar support and armrests.', type: 'Goods', cat: 'off-fur', uom: 'EA', mfr: 'Featherlite', mpn: 'FL-ERG-2', price: 8750, lead: 6, status: 'Active', plants: [plant('PNQ1')], created: '2026-11-24', history: [d('2026-11-24', 'MDM team', 'Item created', 'From IR26000073')] }),
  ];

  const fld = o => ({ desc: '', long: '', cat: '', uom: '', hs: '', mfr: '', mpn: '', gtin: '', country: '', hazard: 'None', plants: [], storage: '', tax: '', gl: '', price: '', cur: 'INR', lead: '', moq: '', catalog: true, qi: false, justification: '', priority: 'Medium', needBy: '', attachments: [], image: '', matType: '', svcType: '', assetClass: '', life: '', weight: '', pack: '', sustain: '', attrs: '', ...o });
  const REQS = [
    { id: 'IR26000081', type: 'New', itemType: 'Asset', requester: 'John Doe', channel: 'Portal form', status: 'Pending MDM', created: '2026-11-25', f: fld({ desc: 'LAPTOP, LENOVO THINKPAD T14, 16GB', long: '14 inch Lenovo ThinkPad T14, Intel Core i7, 16 GB RAM, 512 GB SSD, for new joiners in Chennai.', cat: 'it-lap', uom: 'EA', hs: '8471.30', mfr: 'Lenovo', mpn: '21HD0013', country: 'China', plants: ['CHN1'], gl: '520100', tax: 'GST 18%', price: 98500, justification: 'Twelve new joiners in Chennai in December need laptops.', needBy: '2026-12-02', attachments: ['T14-datasheet.pdf'] }), dup: { checked: true, matches: ['A-200118'], decision: 'Not a duplicate', reason: 'Different MPN and destination plant.' }, mdmChecks: [1, 1, 1, 1, 0], hist: [d('2026-11-25', 'John Doe', 'Submitted'), d('2026-11-25', 'System', 'Checks passed', 'Similar item A-200118 noted, requester gave a reason')] },
    { id: 'IR26000080', type: 'New', itemType: 'Goods', requester: 'Anna Reddy', channel: 'Teams agent', status: 'Completed', created: '2026-11-24', itemCode: 'G-100330', erp: '10004102', f: fld({ desc: 'GLOVES, NITRILE, SIZE M, BOX 100', long: 'Disposable nitrile examination gloves, powder free, size M, box of 100.', cat: 'ppe-glv', uom: 'BX', hs: '4015.19', mfr: '3M India', mpn: 'NG-M-100', plants: ['CHN1'], storage: 'WH01', gl: '530200', tax: 'GST 18%', price: 640, justification: 'Replenish stores gloves.', needBy: '2026-11-28' }), dup: { checked: true, matches: [] }, mdmChecks: [1, 1, 1, 1, 1], hist: [d('2026-11-24', 'Anna Reddy', 'Submitted'), d('2026-11-24', 'MDM team', 'Forwarded'), d('2026-11-25', 'System', 'Item created', 'G-100330, ERP 10004102')] },
    { id: 'IR26000079', type: 'New', itemType: 'Goods', requester: 'Rajesh Kumar', channel: 'Ask Me agent', status: 'In review', created: '2026-11-24', f: fld({ desc: 'TURMERIC POWDER, ORGANIC, 25KG BAG', long: 'Organic turmeric powder, 25 kg bag, curcumin 3 percent minimum, FSSAI compliant.', cat: 'food-spc', uom: 'KG', hs: '0910.30', mfr: 'Sresta Naturals', plants: ['CBE2'], storage: 'WH02', gl: '560100', tax: 'GST 5%', price: 6200, justification: 'Cafeteria supply for Coimbatore.', needBy: '2026-12-05', attachments: ['spec-sheet.pdf', 'lab-report.pdf', 'fssai-certificate.pdf'] }), dup: { checked: true, matches: [] }, review: { on: true, rule: 'Category = Food ingredients', team: 'Quality team', checks: [1, 1, 1, 0], remarks: 'Samples OK. Waiting for trial batch sign-off from production (expected 28 Nov).' }, hist: [d('2026-11-24', 'Rajesh Kumar', 'Submitted'), d('2026-11-24', 'System', 'Routed to In review', 'Rule: Category = Food ingredients')] },
    { id: 'IR26000078', type: 'Extend', itemType: 'Goods', requester: 'Ashok Subramanian', channel: 'Portal form', status: 'Pending approval', created: '2026-11-23', target: 'G-100412', f: fld({ desc: 'HELMET, SAFETY, WHITE', plants: ['PNQ1'], storage: 'WH01', tax: 'GST 18%', justification: 'New Pune warehouse opens in January.', needBy: '2026-12-15' }), dup: { checked: true, matches: ['G-100412'], decision: 'Extend' }, approval: { rule: 'Extend to a new plant for a hazardous-flagged category', approver: 'Sanjay Pillai', role: 'Safety & PPE category owner' }, mdmChecks: [1, 1, 1, 1, 1], hist: [d('2026-11-23', 'Ashok Subramanian', 'Submitted'), d('2026-11-24', 'MDM team', 'Forwarded to approver')] },
    { id: 'IR26000077', type: 'Update', itemType: 'Service', requester: 'John Doe', channel: 'Portal form', status: 'Sent back', created: '2026-11-22', target: 'S-200031', f: fld({ desc: 'SERVICE, LAPTOP ANNUAL REPAIR', tax: 'GST 18% (SAC)', justification: 'Tax code changed after supplier GST revision.' }), changes: [['Tax code', 'GST 18% (SAC)', 'GST 12% (SAC)']], dup: { checked: true, matches: [] }, hist: [d('2026-11-22', 'John Doe', 'Submitted'), d('2026-11-24', 'MDM team', 'Sent back', 'Attach the supplier GST revision note before we change a tax code.')] },
    { id: 'IR26000076', type: 'Block', itemType: 'Goods', requester: 'MDM team', channel: 'Portal form', status: 'Completed', created: '2026-11-23', target: 'G-100090', itemCode: 'G-100090', f: fld({ desc: 'KIT, GASKET, ASBESTOS', justification: 'Compliance: asbestos ban.', plants: ['CHN1'] }), action: 'Block', dup: { checked: true, matches: [] }, hist: [d('2026-11-23', 'MDM team', 'Submitted'), d('2026-11-24', 'Nirmala Bhat', 'Approved', 'Banned material.'), d('2026-11-24', 'System', 'Item blocked', 'Open documents continue; buyers informed')] },
    { id: 'IR26000075', type: 'New', itemType: 'Asset', requester: 'Divya Menon', channel: 'Portal form', status: 'Pending finance review', created: '2026-11-22', f: fld({ desc: 'ROUTER, CISCO C1111-8P, WAN', long: 'Cisco C1111-8P branch router for the Bangalore office.', cat: 'it-net', uom: 'EA', hs: '8517.62', mfr: 'Cisco', mpn: 'C1111-8P-K9', country: 'USA', plants: ['BLR1'], storage: 'WH01', gl: '520100', tax: 'GST 18%', price: 145000, justification: 'Branch WAN refresh.', needBy: '2026-12-10', attachments: ['quote.pdf'] }), dup: { checked: true, matches: ['A-200067'], decision: 'Not a duplicate', reason: 'Second branch router, different model suffix.' }, mdmChecks: [1, 1, 1, 1, 1], hist: [d('2026-11-22', 'Divya Menon', 'Submitted'), d('2026-11-24', 'MDM team', 'Forwarded to finance')] },
    { id: 'IR26000074', type: 'New', itemType: 'Goods', requester: 'Faizal Ahmed', channel: 'Portal bulk upload', status: 'Completed', created: '2026-11-22', itemCode: 'G-100623', erp: '10004391', f: fld({ desc: 'CHAIR, ERGONOMIC, MESH BACK', long: 'Ergonomic task chair, mesh back, adjustable lumbar support and armrests.', cat: 'off-fur', uom: 'EA', hs: '9401.30', mfr: 'Featherlite', mpn: 'FL-ERG-2', plants: ['PNQ1'], storage: 'WH01', gl: '550300', tax: 'GST 18%', price: 8750, justification: 'Pune office fit-out.', needBy: '2026-11-30' }), dup: { checked: true, matches: [] }, mdmChecks: [1, 1, 1, 1, 1], hist: [d('2026-11-22', 'Faizal Ahmed', 'Submitted', 'Bulk upload row 3'), d('2026-11-24', 'MDM team', 'Forwarded'), d('2026-11-24', 'System', 'Item created', 'G-100623, ERP 10004391')] },
    { id: 'IR26000073', type: 'Inactivate', itemType: 'Goods', requester: 'Lakshmi Narayanan', channel: 'Portal form', status: 'Completed', created: '2026-11-21', target: 'G-100044', itemCode: 'G-100044', f: fld({ desc: 'MONITOR, CRT, 17 INCH', justification: 'Obsolete. Replace with the QHD monitor.', plants: ['CHN1'] }), action: 'Inactivate', replacement: 'G-100912', dup: { checked: true, matches: [] }, hist: [d('2026-11-21', 'Lakshmi Narayanan', 'Submitted'), d('2026-11-23', 'Nirmala Bhat', 'Approved'), d('2026-11-23', 'System', 'Item inactivated', 'Replacement G-100912')] },
    { id: 'IR26000072', type: 'New', itemType: 'Goods', requester: 'Rajesh Kumar', channel: 'Teams agent', status: 'Pending approval', created: '2026-11-21', f: fld({ desc: 'SOLVENT, ISOPROPYL ALCOHOL, 5 LITRE', long: 'Isopropyl alcohol 99.9 percent, 5 litre can, for equipment cleaning.', cat: 'chem-sol', uom: 'L', hs: '2905.12', mfr: 'Merck', mpn: 'IPA-5L', hazard: 'Class 3', plants: ['CHN1'], storage: 'WH03', gl: '570100', tax: 'GST 18%', price: 4200, justification: 'Cleaning of precision equipment.', needBy: '2026-12-04', attachments: ['sds.pdf'] }), dup: { checked: true, matches: [] }, approval: { rule: 'Hazardous item (any value)', approver: 'Deepa Krishnan', role: 'HSE approver' }, mdmChecks: [1, 1, 1, 1, 1], hist: [d('2026-11-21', 'Rajesh Kumar', 'Submitted'), d('2026-11-23', 'MDM team', 'Forwarded to approver')] },
    { id: 'IR26000071', type: 'New', itemType: 'Goods', requester: 'Anna Reddy', channel: 'Portal form', status: 'Closed – duplicate', created: '2026-11-20', itemCode: 'G-100208', f: fld({ desc: 'PAPER, A4, 75 GSM, REAM', cat: 'off-ppr', uom: 'RM', plants: ['CHN1'] }), dup: { checked: true, matches: ['G-100208'], decision: 'Use existing item' }, hist: [d('2026-11-20', 'Anna Reddy', 'Used existing item', 'G-100208 is already active in Chennai')] },
    { id: 'IR26000070', type: 'New', itemType: 'Asset', requester: 'Faizal Ahmed', channel: 'Portal form', status: 'Rejected', created: '2026-11-19', f: fld({ desc: 'DRONE, SURVEY, QUADCOPTER', long: 'Survey quadcopter with RTK module.', cat: 'uav', uom: 'EA', hs: '8806.21', mfr: 'DJI', mpn: 'M300', plants: ['CHN1'], storage: 'WH01', gl: '210500', tax: 'GST 18%', price: 1250000, justification: 'Site survey.', needBy: '2026-12-20' }), dup: { checked: true, matches: [] }, approval: { rule: 'Asset above USD 5,000', approver: 'Vikram Sen', role: 'Finance controller' }, mdmChecks: [1, 1, 1, 1, 1], hist: [d('2026-11-19', 'Faizal Ahmed', 'Submitted'), d('2026-11-21', 'Vikram Sen', 'Rejected', 'No approved capital budget for this asset this year.')] },
    { id: 'IR26000069', type: 'New', itemType: 'Goods', requester: 'John Doe', channel: 'Portal form', status: 'Draft', created: '2026-11-26', f: fld({ desc: 'GLOVES, LEATHER, DRIVER, PAIR', cat: 'ppe-glv', uom: 'PR', plants: ['CHN1'] }), dup: { checked: false, matches: [] }, hist: [d('2026-11-26', 'John Doe', 'Draft saved')] },
    { id: 'IR26000068', type: 'New', itemType: 'Service', requester: 'Faizal Ahmed', channel: 'Portal form', status: 'Draft', created: '2026-11-25', f: fld({ desc: 'SERVICE, GAUGE CALIBRATION, ANNUAL', cat: 'svc-cal', uom: 'YR', plants: ['CHN1'] }), dup: { checked: false, matches: [] }, hist: [d('2026-11-25', 'Faizal Ahmed', 'Draft saved')] },
    { id: 'IR26000067', type: 'New', itemType: 'Goods', requester: 'Divya Menon', channel: 'Ask Me agent', status: 'Draft', created: '2026-11-25', f: fld({ desc: 'MONITOR, QHD, 27 INCH', cat: 'it-mon', uom: 'EA', plants: ['BLR1'] }), dup: { checked: false, matches: [] }, hist: [d('2026-11-25', 'Divya Menon', 'Draft saved')] },
    { id: 'IR26000066', type: 'New', itemType: 'Goods', requester: 'Lakshmi Narayanan', channel: 'Portal form', status: 'Withdrawn', created: '2026-11-18', f: fld({ desc: 'HELMET, SAFETY, YELLOW', cat: 'ppe-hlm', uom: 'EA', plants: ['CHN1'] }), dup: { checked: true, matches: ['G-100412'] }, hist: [d('2026-11-18', 'Lakshmi Narayanan', 'Submitted'), d('2026-11-19', 'Lakshmi Narayanan', 'Withdrawn', 'Colour not needed after all. Auto-cancels in 7 days.')] },
  ];

  /* ---------- store ---------- */
  let db = null;
  const clone = o => JSON.parse(JSON.stringify(o));
  const load = () => { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch { /* storage unavailable */ } return { items: clone(ITEMS), reqs: clone(REQS) }; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage unavailable */ } };
  db = load();
  const reset = () => { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } db = { items: clone(ITEMS), reqs: clone(REQS) }; save(); };

  const today = () => new Date().toISOString().slice(0, 10);
  const getReq = id => db.reqs.find(r => r.id === id);
  const getItem = code => db.items.find(i => i.code === code);
  const nextReqId = () => 'IR26' + String(Math.max(...db.reqs.map(r => +r.id.slice(4)), 81) + 1).padStart(6, '0');
  const nextCode = type => { const p = { Goods: 'G-', Service: 'S-', Asset: 'A-' }[type]; const base = { Goods: 100000, Service: 200000, Asset: 200000 }[type];
    const used = db.items.filter(i => i.code.startsWith(p)).map(i => +i.code.slice(2)); return p + (Math.max(base, ...used) + 1); };

  /* ---------- text normalisation and duplicate check (BR21-BR29) ---------- */
  const SYN = { notebook: 'laptop', laptops: 'laptop', pc: 'ea', each: 'ea', piece: 'ea' };
  const STOP = new Set(['the', 'of', 'for', 'and', 'in', 'size', 'inch', 'box']);
  const words = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean).map(w => SYN[w] || w).map(w => w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w).filter(w => !STOP.has(w));
  const norm = s => [...new Set(words(s))].sort().join(' ');
  const sim = (a, b) => { const A = new Set(words(a)), B = new Set(words(b)); if (!A.size || !B.size) return 0; let n = 0; A.forEach(w => { if (B.has(w)) n++; }); return Math.round(100 * n / (A.size + B.size - n)); };
  const eq = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  const uomEq = (a, b) => a === b || (['EA', 'PC'].includes(a) && ['EA', 'PC'].includes(b));

  /* f: { desc, mfr, mpn, gtin, cat, uom }, itemType, plant codes, ignoreId (own request) */
  const dupCheck = (f, itemType, plants, ignoreId, ignoreTarget) => {
    const out = [];
    const add = (rec, pct, kind, rule, isReq) => out.push({ code: rec.code || rec.id, desc: isReq ? rec.f.desc : rec.desc, type: isReq ? rec.itemType : rec.type, cat: isReq ? rec.f.cat : rec.cat, status: rec.status, plants: isReq ? rec.f.plants : rec.plants.map(p => p.code), pct, kind, rule, isReq, replacement: rec.replacement || '' });
    db.items.forEach(it => {
      if (it.code === ignoreTarget) return;
      const sameMpn = eq(f.mfr, it.mfr) && eq(f.mpn, it.mpn), sameGtin = eq(f.gtin, it.gtin) && f.gtin;
      const sameName = norm(f.desc) && norm(f.desc) === norm(it.desc);
      const p = sim(f.desc, it.desc);
      let kind = '', rule = '';
      if (sameMpn || sameGtin) { kind = 'exact'; rule = sameGtin ? 'Same GTIN (BR22)' : 'Same manufacturer and part number (BR22)'; }
      else if (sameName && itemType === it.type && f.cat && f.cat === it.cat && uomEq(f.uom || it.uom, it.uom)) { kind = 'exact'; rule = 'Same description, item type, category and unit (BR22)'; }
      else if (sameName && itemType !== it.type) { kind = 'diffType'; rule = 'Same name, different item type (BR23)'; }
      else if (p >= 85) { kind = 'similar'; rule = `Similarity ${p} percent, 85 or more (BR25)`; }
      else if (p >= 70) { kind = 'info'; rule = `Similarity ${p} percent, 70 to 84 (BR25)`; }
      if (!kind) return;
      if (it.status === 'Blocked' && kind !== 'info') kind = 'blocked';
      else if (it.status === 'Inactive' && kind !== 'info') kind = 'inactive';
      add(it, kind === 'exact' || kind === 'blocked' || kind === 'inactive' ? Math.max(p, 96) : p, kind, kind === 'blocked' ? 'Match is a blocked item (BR26)' : kind === 'inactive' ? 'Match is an inactive item (BR27)' : rule, false);
    });
    db.reqs.forEach(r => { if (r.id === ignoreId || ['Draft', 'Withdrawn', 'Rejected', 'Cancelled', 'Closed – duplicate', 'Completed'].includes(r.status) || r.type !== 'New') return;
      const p = sim(f.desc, r.f.desc); if (p >= 85) add(r, p, 'pending', 'A pending request for the same item exists (BR28)', true); });
    return out.sort((a, b) => b.pct - a.pct).slice(0, 4);
  };

  /* ---------- AI suggestions (level L1, BRD autonomy table): rules, not a model ---------- */
  const SUGG = [
    [/laptop|thinkpad|notebook|latitude/i, { cat: 'it-lap', itemType: 'Asset', uom: 'EA', conf: 92, mfrs: ['Lenovo', 'Dell', 'HP'] }],
    [/monitor|display/i, { cat: 'it-mon', itemType: 'Goods', uom: 'EA', conf: 88 }],
    [/glove/i, { cat: 'ppe-glv', itemType: 'Goods', uom: 'BX', conf: 90 }],
    [/helmet|hard hat/i, { cat: 'ppe-hlm', itemType: 'Goods', uom: 'EA', conf: 91 }],
    [/bearing/i, { cat: 'mro-brg', itemType: 'Goods', uom: 'EA', conf: 89 }],
    [/paper|ream/i, { cat: 'off-ppr', itemType: 'Goods', uom: 'RM', conf: 93 }],
    [/chair/i, { cat: 'off-fur', itemType: 'Goods', uom: 'EA', conf: 90 }],
    [/turmeric|spice|masala|pepper/i, { cat: 'food-spc', itemType: 'Goods', uom: 'KG', conf: 86 }],
    [/solvent|alcohol|thinner/i, { cat: 'chem-sol', itemType: 'Goods', uom: 'L', conf: 84 }],
    [/repair|service|calibration|amc/i, { cat: 'svc-it', itemType: 'Service', uom: 'YR', conf: 72 }],
  ];
  const suggest = text => {
    const t = String(text || '').trim(); if (t.length < 6) return null;
    const hit = SUGG.find(([re]) => re.test(t)); if (!hit) return null;
    const s = hit[1], c = CATS[s.cat];
    const spec = (t.match(/\b(\d{1,3}\s?(?:gb|tb|inch|in|mm|kg|l|ml))\b/gi) || []).map(x => x.replace(/\s+/g, '').toUpperCase().replace(/^(\d+)(INCH|IN)$/, '$1 IN'));
    const mfr = (s.mfrs || []).find(m => new RegExp(m, 'i').test(t)) || '';
    const noun = t.split(/\s+/).filter(w => !/^(i|need|a|an|the|for|in|to|of|new|joiners|chennai|pune|bangalore)$/i.test(w)).slice(0, 5).join(' ');
    const desc = (c.path.split(' › ')[1].replace(/s$/, '') + ', ' + (mfr ? mfr + ', ' : '') + spec.join(', ')).replace(/, $/, '').toUpperCase().slice(0, 40);
    return { cat: s.cat, itemType: s.itemType, uom: s.uom, unspsc: c.unspsc, hs: c.hs, desc: desc || noun.toUpperCase().slice(0, 40), mfr, conf: s.conf, path: c.path };
  };

  /* ---------- data quality score (BR33) ---------- */
  const MAND = [['desc', 'Short description'], ['long', 'Long description'], ['cat', 'Material category'], ['uom', 'Base unit'], ['hs', 'HSN / SAC / HS code'], ['gl', 'GL account'], ['tax', 'Tax code'], ['storage', 'Storage location']];
  const GOOD = [['mfr', 'Manufacturer'], ['mpn', 'Part number'], ['country', 'Country of origin'], ['lead', 'Lead time'], ['price', 'Standard price'], ['attachments', 'Attachment']];
  const filled = v => Array.isArray(v) ? v.length > 0 : String(v ?? '').trim() !== '';
  const dqScore = r => {
    const f = r.f, need = r.itemType === 'Service' ? MAND.filter(([k]) => k !== 'storage') : MAND;
    const missing = need.filter(([k]) => !filled(f[k])).map(x => x[1]);
    const good = (r.itemType === 'Service' ? GOOD.filter(([k]) => !['mfr', 'mpn', 'country'].includes(k)) : GOOD);
    const gm = good.filter(([k]) => !filled(f[k])).length;
    const checks = (r.mdmChecks || []); const cd = checks.filter(Boolean).length;
    const score = Math.round(((need.length - missing.length) / need.length) * 70 + ((good.length - gm) / good.length) * 20 + (cd / 5) * 10);
    return { score, missing, goodMissing: gm, checks: cd };
  };


  /* ---------- field registry: the 52 fields of the Item Master field mapping v4 (Pranav's list) ----------
     [no, section, label, key, filled by (req requester · mdm · fin finance · sys system), applies to (All · GA goods+asset · G · S · A), level (M mandatory · G good · O okay), phase] */
  const FIELDS = [
    [1, 'Request', 'Request number', 'reqNo', 'sys', 'All', 'M'], [2, 'Request', 'Request type', 'reqType', 'req', 'All', 'M'], [3, 'Request', 'Requested by', 'requester', 'sys', 'All', 'M'],
    [4, 'Request', 'Company and plants', 'plants', 'req', 'All', 'M'], [5, 'Request', 'Business justification', 'justification', 'req', 'All', 'M'], [6, 'Request', 'Channel', 'channel', 'sys', 'All', 'G'],
    [7, 'Request', 'Attachments', 'attachments', 'req', 'All', 'G'], [8, 'Request', 'Priority', 'priority', 'req', 'All', 'G'], [9, 'Request', 'Required by', 'needBy', 'req', 'All', 'G'],
    [10, 'Basic data', 'Item type', 'itemType', 'req', 'All', 'M'], [11, 'Basic data', 'Material type', 'matType', 'mdm', 'GA', 'G'], [12, 'Basic data', 'Short description', 'desc', 'req', 'All', 'M'],
    [13, 'Basic data', 'Long description and specification', 'long', 'req', 'All', 'M'], [14, 'Basic data', 'Material category', 'cat', 'req', 'All', 'M'], [15, 'Basic data', 'UNSPSC code', 'unspsc', 'sys', 'All', 'G'],
    [16, 'Basic data', 'Material group', 'matGroup', 'sys', 'All', 'O'], [17, 'Basic data', 'Base unit of measure', 'uom', 'req', 'All', 'M'], [18, 'Basic data', 'Manufacturer', 'mfr', 'req', 'GA', 'G'],
    [19, 'Basic data', 'Manufacturer part number', 'mpn', 'req', 'GA', 'G'], [20, 'Basic data', 'Attributes and specifications', 'attrs', 'req', 'GA', 'G', 'P1'], [21, 'Basic data', 'Item image', 'image', 'req', 'GA', 'O'],
    [22, 'Basic data', 'Material code (CPN)', 'cpn', 'sys', 'All', 'M'], [23, 'Basic data', 'ERP material code', 'erp', 'sys', 'All', 'G'], [24, 'Basic data', 'Item and request status', 'status', 'sys', 'All', 'M'],
    [25, 'Basic data', 'Country of origin', 'country', 'req', 'GA', 'G'], [26, 'Basic data', 'GTIN or barcode', 'gtin', 'req', 'G', 'O', 'P1'], [27, 'Basic data', 'Weight and dimensions', 'weight', 'mdm', 'GA', 'O', 'P1'],
    [28, 'Basic data', 'Packaging type', 'pack', 'mdm', 'G', 'O', 'P1'], [29, 'Basic data', 'Multi-language description', 'lang', 'mdm', 'All', 'O', 'P2'], [30, 'Compliance and quality', 'Hazard class and SDS', 'hazard', 'req', 'G', 'G'],
    [31, 'Compliance and quality', 'Quality inspection at receipt', 'qi', 'req', 'GA', 'G'], [32, 'Compliance and quality', 'Sustainability attributes', 'sustain', 'req', 'GA', 'O', 'P1'], [33, 'Tax and finance', 'HSN, SAC or HS code', 'hs', 'req', 'All', 'M'],
    [34, 'Tax and finance', 'Default tax code', 'tax', 'req', 'All', 'G'], [35, 'Tax and finance', 'Account assignment', 'accAssign', 'sys', 'All', 'M'], [36, 'Tax and finance', 'Default GL account', 'gl', 'mdm', 'All', 'G'],
    [37, 'Tax and finance', 'Standard price', 'price', 'req', 'All', 'G'], [38, 'Tax and finance', 'Currency', 'cur', 'req', 'All', 'G'], [39, 'Tax and finance', 'Price basis', 'priceBasis', 'sys', 'All', 'M'],
    [40, 'Procurement data', 'Lead time (days)', 'lead', 'req', 'GA', 'G'], [41, 'Procurement data', 'Minimum order quantity', 'moq', 'req', 'G', 'O'], [42, 'Procurement data', 'Catalogue eligible', 'catalog', 'req', 'All', 'G'],
    [43, 'Service', 'Service type', 'svcType', 'req', 'S', 'G', 'P1'], [44, 'Asset', 'Asset class', 'assetClass', 'fin', 'A', 'M'], [45, 'Asset', 'Useful life (months)', 'life', 'fin', 'A', 'G'],
    [46, 'Plant data', 'Storage location', 'storage', 'req', 'GA', 'M'], [47, 'Lifecycle', 'Alternate or substitute item', 'alternates', 'mdm', 'G', 'O', 'P1'], [48, 'Lifecycle', 'Replacement item (when inactive)', 'replacement', 'mdm', 'All', 'O', 'P1'],
    [49, 'MDM control', 'Duplicate and similar item check', 'dup', 'sys', 'All', 'M'], [50, 'MDM control', 'MDM remarks', 'mdmRemarks', 'mdm', 'All', 'M'], [51, 'MDM control', 'Approval history', 'apprHist', 'sys', 'All', 'M'],
    [52, 'MDM control', 'Data quality score', 'dq', 'sys', 'All', 'G'],
  ].map(([no, sec, label, key, who, applies, level, phase]) => ({ no, sec, label, key, who, applies, level, phase: phase || 'P0' }));
  const appliesTo = (fd, type) => fd.applies === 'All' || (fd.applies === 'GA' && type !== 'Service') || (fd.applies === 'G' && type === 'Goods') || (fd.applies === 'S' && type === 'Service') || (fd.applies === 'A' && type === 'Asset');
  const SVC_TYPES = { repair: 'Repair', maint: 'Maintenance', install: 'Installation', calib: 'Calibration', consult: 'Consulting', other: 'Other' };
  const MAT_TYPES = { cons: 'Consumable', spare: 'Spare part', raw: 'Raw material', trade: 'Trading good', capex: 'Capital good' };
  const PACKS = { box: 'Box', carton: 'Carton', bag: 'Bag', drum: 'Drum', pallet: 'Pallet', each: 'Loose, each' };

  /* request completeness: applicable fields of the 52 that hold a value now (system fields count when the system has set them) */
  const reqFieldVal = (r, k) => { const f = r.f, c = CATS[f.cat];
    switch (k) { case 'reqNo': return r.submitted ? r.id : ''; case 'reqType': return r.type; case 'requester': return r.requester; case 'channel': return r.channel; case 'itemType': return r.itemType;
      case 'unspsc': case 'matGroup': return c ? c.unspsc : ''; case 'cpn': return r.itemCode || ''; case 'erp': return r.erp || ''; case 'status': return r.status;
      case 'accAssign': case 'priceBasis': return r.itemType; case 'dup': return r.dup?.checked || (f.desc || '').length >= 4 ? 'checked' : ''; case 'mdmRemarks': return r.mdmRemarks || '';
      case 'apprHist': return (r.hist || []).some(h => /Approved/.test(h.action)) ? 'yes' : ''; case 'dq': return 'live'; case 'catalog': return 'set'; case 'qi': return 'set'; case 'cur': return f.cur || '';
      case 'assetClass': return r.fin?.cls || f.assetClass; case 'life': return r.fin?.life || f.life; case 'lang': return ''; case 'alternates': return ''; case 'replacement': return r.replacement || '';
      default: return f[k]; } };
  const completeness = r => { const list = FIELDS.filter(fd => appliesTo(fd, r.itemType)); const done = list.filter(fd => filled(reqFieldVal(r, fd.key))).length; return { done, total: list.length, pct: Math.round(100 * done / list.length) }; };
  /* item master data quality: the same 52-field count on a live item record */
  const itemFieldVal = (it, k) => { const c = CATS[it.cat] || {};
    return { reqNo: 'x', reqType: 'x', requester: 'x', plants: it.plants, justification: 'x', channel: 'x', attachments: it.docs, priority: 'x', needBy: 'x', itemType: it.type, matType: it.matType, desc: it.desc, long: it.long, cat: it.cat, unspsc: c.unspsc, matGroup: c.unspsc, uom: it.uom, mfr: it.mfr, mpn: it.mpn, attrs: it.attrs, image: it.image, cpn: it.code, erp: it.erp, status: it.status, country: it.country, gtin: it.gtin, weight: it.weight, pack: it.pack, lang: '', hazard: it.hazard, qi: 'x', sustain: it.sustain, hs: c.hs, tax: it.plants[0]?.tax, accAssign: 'x', gl: c.gl, price: it.price || '', cur: it.cur, priceBasis: 'x', lead: it.lead || '', moq: it.moq || '', catalog: 'x', svcType: it.svcType, assetClass: it.assetClass, life: it.life || '', storage: it.plants[0]?.storage, alternates: it.alternates, replacement: it.replacement, dup: 'x', mdmRemarks: 'x', apprHist: it.history, dq: 'x' }[k]; };
  const itemDq = it => { const list = FIELDS.filter(fd => appliesTo(fd, it.type)); const done = list.filter(fd => filled(itemFieldVal(it, fd.key))).length; return { done, total: list.length, pct: Math.round(100 * done / list.length) }; };
  const masterDq = () => { const live = db.items.filter(i => i.status !== 'Inactive'); return live.length ? Math.round(live.reduce((a, i) => a + itemDq(i).pct, 0) / live.length) : 0; };

  /* approval criteria table (from the approval module) used to show the chain before submit */
  const CRITERIA = [
    { rule: 'Hazardous item (any value)', when: 'Goods with a hazard class', approver: 'Deepa Krishnan', role: 'HSE approver' },
    { rule: 'Asset above USD 5,000', when: 'Item type Asset, price over USD 5,000', approver: 'Vikram Sen', role: 'Finance controller' },
    { rule: 'Asset (any value)', when: 'Item type Asset, up to USD 5,000', approver: 'Category owner', role: 'From the category' },
    { rule: 'Goods above USD 5,000', when: 'Goods or service, price over USD 5,000', approver: 'Category owner', role: 'From the category' },
    { rule: 'Critical field changed (BR42)', when: 'Update to tax, unit, category, asset class or description', approver: 'Vikram Sen', role: 'Finance controller' },
    { rule: 'Block, Unblock or Inactivate', when: 'Any lifecycle change', approver: 'Nirmala Bhat', role: 'Compliance approver' },
    { rule: 'Extend a hazardous item', when: 'Extend request for a hazardous item', approver: 'Deepa Krishnan', role: 'HSE approver' },
  ];

  /* ---------- routing helpers ---------- */
  const usd = f => f.cur === 'USD' ? Number(f.price) || 0 : (Number(f.price) || 0) / USD_INR;
  const reviewRule = r => REVIEW_CATS.includes(r.f.cat) && r.type === 'New' ? { on: true, rule: 'Category = Food ingredients', team: 'Quality team' } : null;
  const approvalFor = r => {
    const c = CATS[r.f.cat] || {}, owner = [c.owner || 'Category owner', c.ownerRole || 'Category owner'], F = PEOPLE.approvers;
    if (['Block', 'Unblock', 'Inactivate'].includes(r.type)) return { rule: r.type + ' needs a compliance approver', approver: F.comp[0], role: F.comp[1] };
    if (r.type === 'Extend') return r.f.hazard && r.f.hazard !== 'None' ? { rule: 'Extend a hazardous item', approver: F.hse[0], role: F.hse[1] } : null;
    if (r.type === 'Update') { const crit = (r.changes || []).some(ch => /tax|hs|hsn|sac|unit|categor|asset|description/i.test(ch[0])); return crit ? { rule: 'Critical field changed (BR42)', approver: F.fin[0], role: F.fin[1] } : null; }
    if (r.f.hazard && r.f.hazard !== 'None') return { rule: 'Hazardous item (any value)', approver: F.hse[0], role: F.hse[1] };
    if (r.itemType === 'Asset') return usd(r.f) > LIMIT_USD ? { rule: 'Asset above USD 5,000', approver: F.fin[0], role: F.fin[1] } : { rule: 'Asset (any value)', approver: owner[0], role: owner[1] };
    if (usd(r.f) > LIMIT_USD) return { rule: 'Goods above USD 5,000', approver: owner[0], role: owner[1] };
    return null;
  };
  const financeOn = r => r.type === 'New' && r.itemType === 'Asset';

  /* ---------- workflow actions ---------- */
  const log = (r, who, action, comment) => r.hist.push(d(today(), who, action, comment));
  const need = (c, msg) => c && String(c).trim() ? null : msg;
  const finish = r => {
    const f = r.f;
    if (r.type === 'New') { const code = nextCode(r.itemType); const c = CATS[f.cat] || {};
      db.items.push(item({ code, erp: String(10004400 + db.items.length), desc: f.desc, long: f.long, type: r.itemType, cat: f.cat, uom: f.uom, mfr: f.mfr, mpn: f.mpn, gtin: f.gtin, country: f.country || 'India', hazard: f.hazard, qi: f.qi, catalog: f.catalog !== false, price: Number(f.price) || 0, cur: f.cur, lead: Number(f.lead) || 0, moq: Number(f.moq) || 1, assetClass: r.fin?.cls || '', life: r.fin?.life || 0, status: 'Active', created: today(),
        plants: f.plants.map(p => plant(p, f.tax)), history: [d(today(), 'System', 'Item created', 'From ' + r.id)] }));
      r.itemCode = code; r.erp = String(10004400 + db.items.length); }
    const it = getItem(r.target);
    if (r.type === 'Extend' && it) { f.plants.forEach(p => { if (!it.plants.some(x => x.code === p)) it.plants.push({ ...plant(p, f.tax), storage: f.storage || PLANTS[p][1] }); }); it.history.push(d(today(), 'System', 'Extended to ' + f.plants.map(p => PLANTS[p][0]).join(', '), r.id)); r.itemCode = it.code; }
    if (r.type === 'Update' && it) { it.history.push(d(today(), 'System', 'Updated', (r.changes || []).map(c => `${c[0]}: ${c[1]} to ${c[2]}`).join('; '))); (r.changes || []).forEach(c => { if (/^description/i.test(c[0])) it.desc = c[2]; if (/^lead/i.test(c[0])) it.lead = +c[2]; if (/^standard price/i.test(c[0])) it.price = +c[2]; }); r.itemCode = it.code; }
    if (['Block', 'Unblock', 'Inactivate'].includes(r.type) && it) { it.status = { Block: 'Blocked', Unblock: 'Active', Inactivate: 'Inactive' }[r.type]; if (r.type === 'Inactivate') it.replacement = r.replacement || ''; it.history.push(d(today(), 'System', { Block: 'Blocked', Unblock: 'Unblocked', Inactivate: 'Inactivated' }[r.type], r.f.justification)); r.itemCode = it.code; }
    r.status = 'Completed'; r.completed = today();
    log(r, 'System', r.type === 'New' ? 'Item created' : 'Change applied', r.itemCode + (r.erp ? ', ERP ' + r.erp : ''));
  };
  const goApprovalOrFinish = (r, who) => { const ap = approvalFor(r); if (ap) { r.approval = ap; r.status = 'Pending approval'; log(r, who, 'Forwarded to approver', ap.rule); } else finish(r); };

  const validate = r => {
    const f = r.f, e = [];
    const add = (id, msg) => e.push({ id, msg });
    if (r.type === 'New') {
      if (!f.desc.trim()) add('desc', 'Enter a short description.'); else if (f.desc.length > 40) add('desc', 'Short description is limited to 40 characters.');
      if (!f.long.trim()) add('long', 'Describe the item so MDM and buyers can recognise it.');
      if (!f.cat) add('cat', 'Choose the lowest category level (BR10).');
      if (!f.uom) add('uom', 'Choose the base unit.');
      if (!f.plants.length) add('plants', 'Choose at least one plant.');
      if (f.gtin && !gtinOk(f.gtin)) add('gtin', 'The GTIN check digit is wrong. Check the barcode number (BR20).');
      if (f.hazard && f.hazard !== 'None' && !(f.attachments || []).some(a => /sds|safety/i.test(a))) add('att', 'A hazardous item needs a safety data sheet attached (BR14).');
    } else if (['Block', 'Unblock', 'Inactivate'].includes(r.type)) { if (!f.justification.trim()) add('just', 'Give the reason. It is mandatory for ' + r.type.toLowerCase() + ' requests.'); }
    else if (r.type === 'Extend') { if (!f.plants.length) add('plants', 'Choose the plant to extend to.'); else if (getItem(r.target)?.plants.some(p => f.plants.includes(p.code))) add('plants', 'The item is already extended to that plant (BR43).'); }
    else if (r.type === 'Update') { if (!(r.changes || []).length) add('chg', 'Change at least one field.'); }
    if (!f.justification.trim()) add('just', 'Give a business justification.');
    if (f.needBy && f.needBy < today()) add('needby', 'Required by date cannot be in the past (BR17).');
    if (f.priority && ['High', 'Critical'].includes(f.priority) && !f.priorityReason) add('prio', 'High and Critical priority needs a reason (BR17).');
    return e;
  };
  const gtinOk = g => { if (!/^\d{8}$|^\d{12,14}$/.test(g)) return false; const dg = g.split('').map(Number), chk = dg.pop(); const s = dg.reverse().reduce((a, v, i) => a + v * (i % 2 ? 1 : 3), 0); return (10 - s % 10) % 10 === chk; };

  const act = (id, action, p = {}) => {
    const r = getReq(id); if (!r) return { ok: false, error: 'Request not found.' };
    const who = p.who || 'MDM team', c = p.comment, S = r.status;
    const bad = m => ({ ok: false, error: m });
    const done = () => { save(); return { ok: true, req: r }; };
    switch (action) {
      case 'submit': { const e = validate(r); if (e.length) return { ok: false, errors: e };
        const ex = (r.dup?.matches || []).length && dupCheck(r.f, r.itemType, r.f.plants, r.id, r.target).some(m => ['exact', 'blocked'].includes(m.kind));
        if (ex && r.type === 'New') return bad('An exact duplicate or a blocked item exists. Use the existing item or extend it.');
        r.submitted = today(); log(r, r.requester, S === 'Draft' || S === 'Withdrawn' || S === 'Sent back' ? 'Submitted' : 'Submitted'); log(r, 'System', 'Checks passed', 'Mandatory fields, defaults and duplicate check');
        const rv = reviewRule(r); if (rv && !r.review?.done) { r.review = { ...rv, checks: [0, 0, 0, 0], remarks: '' }; r.status = 'In review'; log(r, 'System', 'Routed to In review', 'Rule: ' + rv.rule); } else r.status = 'Pending MDM';
        r.mdmChecks = r.mdmChecks || [0, 0, 0, 0, 0]; return done(); }
      case 'withdraw': if (stateOf(S) !== 'In progress' || S === 'Sent back') return bad('Only a request that is in progress can be withdrawn.'); r.status = 'Withdrawn'; r.approval = null; log(r, r.requester, 'Withdrawn', c || 'Approvals reset (BR38)'); return done();
      case 'discard': if (!['Draft', 'Withdrawn', 'Sent back'].includes(S)) return bad('Only a draft, withdrawn or sent back request can be discarded.'); r.status = 'Cancelled'; log(r, r.requester, 'Discarded'); return done();
      case 'review-approve': r.review.done = true; r.review.remarks = p.remarks ?? r.review.remarks; r.status = 'Pending MDM'; log(r, who, 'Review approved', r.review.remarks); return done();
      case 'review-sendback': case 'mdm-sendback': case 'appr-sendback': { const m = need(c, 'Add a comment. It is mandatory when you send a request back (BR32).'); if (m) return bad(m); r.status = 'Sent back'; log(r, who, 'Sent back', c); return done(); }
      case 'sendback-to': { const m = need(c, 'Add a comment. It is mandatory when you send a request back (BR32).'); if (m) return bad(m);
        const to = { requester: 'Sent back', review: 'In review', mdm: 'Pending MDM', finance: 'Pending finance review' }[p.to]; if (!to) return bad('Choose the step to send it back to.');
        if (p.to === 'review') { r.review = { ...(r.review || { on: true, rule: 'Sent back by ' + who, team: 'Quality team', checks: [0, 0, 0, 0] }), done: false }; }
        if (p.to === 'finance' && r.fin) r.fin.done = false; r.approval = p.to === 'requester' ? null : r.approval; r.status = to;
        log(r, who, p.to === 'requester' ? 'Sent back' : 'Sent back to ' + { review: 'review', mdm: 'MDM', finance: 'finance' }[p.to], c); return done(); }
      case 'review-reject': case 'mdm-reject': case 'fin-reject': case 'appr-reject': { const m = need(c, 'Add a comment. It is mandatory when you reject a request (BR32).'); if (m) return bad(m); r.status = 'Rejected'; log(r, who, 'Rejected', c); return done(); }
      case 'mdm-review': if (r.review?.done) return bad('This request has already been reviewed.'); r.review = { on: true, rule: 'Sent by MDM (BR47)', team: 'Quality team', checks: [0, 0, 0, 0], remarks: c || '' }; r.status = 'In review'; log(r, who, 'Sent to review', c || ''); return done();
      case 'mdm-save': Object.assign(r.f, p.fields || {}); if (p.checks) r.mdmChecks = p.checks; if (p.remarks != null) r.mdmRemarks = p.remarks; return done();
      case 'mdm-forward': { Object.assign(r.f, p.fields || {}); if (p.checks) r.mdmChecks = p.checks; r.mdmRemarks = p.remarks ?? r.mdmRemarks;
        const q = dqScore(r); if (q.score < DQ_MIN) return bad(`Data quality is ${q.score} percent. Approval is blocked below ${DQ_MIN} percent (BR33).`);
        if (financeOn(r) && !r.fin?.done) { r.status = 'Pending finance review'; log(r, who, 'Forwarded to finance'); } else goApprovalOrFinish(r, who); return done(); }
      case 'fin-forward': { const m = need(p.cls, 'Choose the asset class.') || need(p.life, 'Enter the useful life in months.') || need(p.gl, 'Choose the asset GL account.'); if (m) return bad(m);
        r.fin = { cls: p.cls, reg: p.reg, life: +p.life, dep: p.dep, gl: p.gl, done: true }; log(r, who, 'Asset class set', `${ASSET_CLASSES[p.cls][0]}, ${p.life} months`); goApprovalOrFinish(r, who); return done(); }
      case 'fin-sendback': { const m = need(c, 'Add a comment. It is mandatory when you send a request back (BR32).'); if (m) return bad(m); r.status = 'Pending MDM'; log(r, who, 'Sent back to MDM', c); return done(); }
      case 'appr-approve': if (eq(r.requester, who)) return bad('You raised this request. A different approver must decide (BR37).'); log(r, who, 'Approved', c || ''); finish(r); return done();
      default: return bad('Unknown action.');
    }
  };

  const saveRequest = r => { const i = db.reqs.findIndex(x => x.id === r.id); if (i < 0) db.reqs.unshift(r); else db.reqs[i] = r; save(); return r; };
  const blank = (type, itemType, requester) => ({ id: nextReqId(), type, itemType, requester, channel: 'Portal form', status: 'Draft', created: today(), f: fld({ plants: ['CHN1'], needBy: '' }), dup: { checked: false, matches: [] }, hist: [d(today(), requester, 'Draft started')] });

  /* timeline of workflow steps for a request: [{label, who, note, state: done|now|todo}] */
  const steps = r => {
    const S = r.status, list = [];
    const sub = !['Draft', 'Withdrawn'].includes(S);
    const idx = { 'In review': 2, 'Pending MDM': 3, 'Pending finance review': 4, 'Pending approval': 5, 'Sent back': 3 }[S] || 0;
    const final = ['Completed', 'Rejected', 'Closed – duplicate', 'Cancelled'].includes(S);
    const st = n => final ? 'done' : (idx > n ? 'done' : idx === n ? 'now' : 'todo');
    list.push({ label: 'Request', who: r.requester + ' · ' + r.channel, state: sub || final ? 'done' : 'now' });
    list.push({ label: 'System checks', who: 'Mandatory fields, defaults, duplicates', state: sub || final ? 'done' : 'todo' });
    if (r.review?.on) list.push({ label: 'In review', who: r.review.team + ' · ' + r.review.rule, state: r.review.done ? 'done' : st(2) });
    list.push({ label: 'MDM review', who: 'MDM team', state: final && S !== 'Rejected' || idx > 3 ? 'done' : st(3) });
    if (financeOn(r)) list.push({ label: 'Finance, asset class', who: 'Finance (assets)', state: r.fin?.done ? 'done' : st(4) });
    const ap = r.approval || approvalFor(r);
    if (ap) list.push({ label: 'Approval', who: `${ap.approver} · ${ap.role}`, note: ap.rule, state: st(5) });
    list.push({ label: r.type === 'New' ? 'Item created and sent to ERP' : 'Change applied', who: 'System', state: S === 'Completed' ? 'done' : 'todo' });
    return list;
  };

  window.IM = { db: () => db, reset, save, today, getReq, getItem, saveRequest, blank, act, validate, dupCheck, suggest, dqScore, approvalFor, financeOn, steps, norm, sim, gtinOk,
    CATS, PLANTS, UOM, ASSET_CLASSES, FIELDS, appliesTo, completeness, reqFieldVal, itemDq, masterDq, CRITERIA, SVC_TYPES, MAT_TYPES, PACKS, STATUS, ITEM_STATUS, stateOf, DQ_MIN, LIMIT_USD, MAND, GOOD, newItemCode: nextCode, usd };
}
