# Procuresprint 2.0 design-system preview

The Procuresprint 2.0 HTML design system (foundations, components, page templates, screens, validation) and its 46 buyer, supplier and template screens, served by Vite exactly as the connected folder defines them. Nothing in the source has been changed; this project is the preview that enhancement requests will build on.

## Pages

| Where | What |
|---|---|
| `index.html` | Foundations: principles, colour with live contrast check, status map, type, spacing, layout, icons, accessibility |
| `components.html` | Every component with variants and states |
| `templates.html` | The three landing archetypes and the module to template map |
| `screens.html` | Index of every module page and the Home persona views, with the consistency review |
| `validation.html` | Seven success criteria, accessibility and responsive results, open gaps |
| `templates/` | Workbench, event console, insight and supplier portal archetypes |
| `modules/` | 42 buyer and supplier module pages (workbench landings and detail or form screens) |
| `404.html` | Not-found page in the system's own chrome |

Workbench pages declare `window.PAGE` and are rendered by `public/assets/js/workbench.js`. Every page joins the shell with `<body data-shell="buyer|supplier" data-root=".." data-module="...">`, rendered by `public/assets/js/ps.js`.

## Layout of this project

```
index.html, components.html, templates.html, screens.html, validation.html
modules/*.html            module pages (same tree as the source so relative links work)
templates/*.html          archetype templates
src/styles/tokens.css     Procuresprint tokens (verbatim) plus Studio role aliases at the end
src/styles/ps.css         components, shell and layout
src/styles/docs.css       documentation chrome
src/main.js               Studio inspector bridge (development only)
public/assets/js/         ps.js, workbench.js, ps-charts.js served verbatim (classic scripts sharing globals)
public/assets/brand/      logo.svg, logo-on-light.svg
public/theme/mui-theme.js MUI theme mirror of the tokens (reference)
scripts/screens.mjs       the screen inventory (source of truth for .ai/screen-architecture.json)
scripts/write-architecture.mjs  regenerates .ai/screen-architecture.json and .ai/frontend-manifest.json from the inventory
tests/                    Vitest checks: links resolve, every page is complete, the shared shell rules hold
```

## Item Master

Built from the Item Master BRD pack (v5, 26 Nov 2026) and its prototype, revised after the 26 Nov walkthrough (tracker of 27 Nov): one-page request form with all 52 fields, AI per field and OCR, change requests started from the item record, bulk actions with a full-screen results page, single Send back with a step choice, the Ask Me frame, and the admin settings screen (BRD S11). Request by chat stays in MS Teams and is no longer built here.

| Page | What it does |
|---|---|
| `modules/item-requests.html` | Tracker, MDM worklist and In review queue; AI command bar that works without Ask Me; Item master data quality KPI; Request ID column frozen |
| `modules/item-request-new.html` | One page. New item: all 52 fields shown or greyed by item type, live data quality, AI per field, create from a document, image upload, workflow journey, approval chain, summary pop-up on submit. Update, Extend, Block, Unblock and Inactivate open from the item record |
| `modules/item-request.html` | One request: workflow, activity, withdraw, resubmit, created item |
| `modules/item-mdm-review.html`, `item-review.html`, `item-finance-review.html`, `item-approval.html` | The MDM, quality review, asset class and approval steps |
| `modules/item-master.html`, `item-record.html` | Search the items and open one; Update, Extend, Block and Inactivate are buttons at the top right; every field shown by section |
| `modules/item-bulk-upload.html`, `item-bulk-results.html` | Choose create, update, extend, block or inactivate; Excel template with every field and dropdowns; upload or create from supplier documents; loader with live counts; full-screen results with a fix-in-place side panel, duplicates view and error log |
| `modules/item-settings.html` | Admin: Item Field Configuration, Item Sequencing, Item ERP Sync, Item Management Audit, General Settings |
| `modules/item-insights.html` | Turnaround, right first time, queue age, channels |

The 52-field registry, the sample items and requests, the workflow rules, the duplicate check and the data quality score live in `public/assets/js/item-master.js` (`window.IM`). They are saved in this browser under the key `ps-im-v1`; use More, Reset sample data on Item requests to start again. To connect a real API, replace the functions on `IM` (`act`, `saveRequest`, `dupCheck`, `getReq`, `getItem`) with service calls.

## Install, run, test, build

```
npm install          # done by the Studio; otherwise install once
npm run dev          # the Studio starts this for the preview
npm test             # link integrity, page completeness and the Item Master rules
npm run build        # production build to dist/
```

Fonts (Plus Jakarta Sans) and icons (Material Symbols Rounded) load from Google Fonts, as the source does, so the preview needs network access. Gilroy is used when installed locally.

## Environment

`VITE_API_BASE_URL` and `VITE_USE_MOCKS` in `.env.example` are reserved for the enhancement phase. The preview has no API: every page carries its own illustrative sample data in an inline script, as the source does.

## Connecting a real API later

Move each page's inline sample data behind a service module in `src/services/api/` and have `workbench.js` read `window.PAGE.rows` from that service; the token and component layers do not change.
