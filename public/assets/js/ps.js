/* Procuresprint 2.0 — shell + shared behaviours. No dependencies.
   A page declares: <body data-shell="buyer|supplier" data-root="." data-module="pr" data-crumbs="Procurement|Purchase Request">
   and puts its content in <main id="main">. The sidebar, its active group and the first two breadcrumbs come from NAV,
   so a module only has to say which module it is. Navigation mirrors Figma "Application Chrome / Buyer Menu" (183:1088). */
{
  const NAV = {
    buyer: {
      user: { initials: 'JD', name: 'John Doe', role: 'Procurement Lead' },
      bu: 'Mindsprint Digital · IN01',
      approvals: 24,
      groups: [
        { id: 'home', label: 'Home', icon: 'home', href: 'modules/home.html' },
        { id: 'procurement', label: 'Procurement', icon: 'shopping_cart', items: [
          { id: 'pr', label: 'Purchase Request', href: 'modules/pr.html' },
          { id: 'e-catalogue', label: 'E-Catalog', href: 'modules/e-catalogue.html', also: ['e-catalogue-marketplace'] },
          { id: 'asn', label: 'ASN', href: 'modules/asn.html' },
          { id: 'grn', label: 'GRN', href: 'modules/grn.html' },
          { id: 'demand-intake', label: 'Demand Intake', href: 'modules/demand-intake.html' } ] },
        { id: 'suppliers', label: 'Supplier Management', icon: 'groups', items: [
          { id: 'onboarding', label: 'Vendor Onboarding', href: 'modules/onboarding.html' },
          { id: 'supplier-scout', label: 'Supplier Scout', href: 'modules/supplier-scout.html' },
          { id: 'supplier-risk', label: 'Supplier Risk Analysis', href: 'modules/supplier-risk.html' },
          { id: 'srm', label: 'Supplier Relationship', href: 'modules/srm.html' } ] },
        { id: 'sourcing', label: 'Sourcing', icon: 'source', items: [
          { id: 'rfq', label: 'RFx', href: 'modules/rfq.html' },
          { id: 'rfq-automation', label: 'RFx Automation', href: 'modules/rfq-automation.html' },
          { id: 'evaluation', label: 'Evaluation', href: 'modules/evaluation.html' },
          { id: 'e-awarding', label: 'Awarding', href: 'modules/e-awarding.html' },
          { id: 'reverse-auction', label: 'Reverse Auctions', href: 'modules/reverse-auction.html' },
          { id: 'e-sourcing', label: 'E-Sourcing', href: 'modules/e-sourcing.html' } ] },
        { id: 'contracts', label: 'Contracts', icon: 'description', items: [
          { id: 'agreement-architect', label: 'Agreement Architect', href: 'modules/agreement-architect.html' },
          { id: 'contract-workbench', label: 'Contract Workbench', href: 'modules/contract-workbench.html' } ] },
        { id: 'invoicing', label: 'Invoicing', icon: 'receipt_long', href: 'modules/invoicing.html' },
        { id: 'reports', label: 'Reports & Analytics', icon: 'bar_chart', items: [
          { id: 'spend', label: 'Spend Analytics', href: 'modules/spend.html' },
          { id: 'reports', label: 'Reports', href: 'modules/reports.html' } ] },
        { id: 'users', label: 'User Management', icon: 'manage_accounts', items: [
          { id: 'users', label: 'Users', href: 'modules/users.html' },
          { id: 'roles', label: 'Roles & Permissions', href: 'modules/roles.html' } ] },
        { id: 'items', label: 'Item Master', icon: 'inventory_2', items: [
          { id: 'item-requests', label: 'Item requests', href: 'modules/item-requests.html', also: ['item-request-new', 'item-request', 'item-mdm-review', 'item-review', 'item-finance-review', 'item-approval'] },
          { id: 'item-master', label: 'Item master', href: 'modules/item-master.html', also: ['item-record'] },
          { id: 'item-bulk-upload', label: 'Bulk upload', href: 'modules/item-bulk-upload.html', also: ['item-bulk-results'] },
          { id: 'item-insights', label: 'Item insights', href: 'modules/item-insights.html' },
          { id: 'item-settings', label: 'Item master settings', href: 'modules/item-settings.html' } ] },
        { id: 'mdm', label: 'Master Data Management', icon: 'dns', href: 'modules/mdm.html' },
        { id: 'admin', label: 'Administration', icon: 'admin_panel_settings', href: 'modules/administration.html' },
      ],
    },
    supplier: {
      user: { initials: 'AM', name: 'Arjun Mehta', role: 'Aster Components Ltd · Admin' },
      bu: 'Buyer: Mindsprint Digital',
      groups: [
        { id: 'home', label: 'Home', icon: 'home', href: 'modules/supplier-home.html' },
        { id: 'supplier-invitations', label: 'Invitations', icon: 'mail', badge: 3, href: 'modules/supplier-invitations.html', also: ['rfx'] },
        { id: 'supplier-orders', label: 'Orders', icon: 'receipt_long', href: 'modules/supplier-orders.html' },
        { id: 'supplier-shipments', label: 'Shipments', icon: 'local_shipping', href: 'modules/supplier-shipments.html', also: ['shipments'] },
      ],
    },
  };

  const body = document.body;
  const root = (body.dataset.root || '.').replace(/\/$/, '');
  const url = h => h ? `${root}/${h}` : '#';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LOGO = '<svg width="181" height="32" viewBox="0 0 181 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M24.601 16.4671C25.5337 14.8311 26 12.9999 26 10.9734C26 7.63631 24.9565 4.97313 22.8695 2.98388C20.7917 0.99463 17.8089 0 13.9212 0H0C0 4.43399 3.57378 8.04532 7.99254 8.04532H9.7016V7.0533C9.7016 6.05633 10.7845 5.44209 11.6324 5.95806L17.9213 9.78476C18.7398 10.2828 18.7398 11.4772 17.9213 11.9752L11.6324 15.8019C10.7845 16.3179 9.7016 15.7037 9.7016 14.7067V13.9071C3.82551 13.7523 0.591649 16.1534 0 21.1102V32H9.95951V21.8353H13.9212C16.4884 21.8353 18.6816 21.3519 20.5008 20.3852C22.3108 19.4184 23.6775 18.1124 24.601 16.4671Z" fill="currentColor"/><path d="M39.872 9.2C43.04 9.2 45.44 11.6 45.44 14.72C45.44 17.816 43.04 20.24 39.872 20.24H36.44V26H33.68V9.2H39.872ZM39.872 17.648C41.504 17.648 42.68 16.4 42.68 14.72C42.68 13.016 41.504 11.792 39.872 11.792H36.44V17.648H39.872ZM49.5259 16.016C50.2459 14.384 51.7099 13.784 53.2219 13.784V16.592C51.5179 16.472 49.5259 17.264 49.5259 19.952V26H46.9339V14H49.5259V16.016ZM59.7385 26.312C56.2345 26.312 53.4025 23.552 53.4025 20C53.4025 16.424 56.2345 13.688 59.7385 13.688C63.2665 13.688 66.0745 16.424 66.0745 20C66.0745 23.552 63.2665 26.312 59.7385 26.312ZM59.7385 23.792C61.8505 23.792 63.4825 22.184 63.4825 20C63.4825 17.816 61.8505 16.208 59.7385 16.208C57.6265 16.208 55.9945 17.816 55.9945 20C55.9945 22.184 57.6265 23.792 59.7385 23.792ZM73.5823 26.312C69.9583 26.312 67.2463 23.552 67.2463 20C67.2463 16.424 69.9583 13.688 73.5823 13.688C75.9342 13.688 77.9743 14.912 78.9342 16.784L76.7023 18.08C76.1743 16.952 74.9982 16.232 73.5583 16.232C71.4463 16.232 69.8382 17.84 69.8382 20C69.8382 22.16 71.4463 23.768 73.5583 23.768C74.9982 23.768 76.1743 23.024 76.7503 21.92L78.9823 23.192C77.9743 25.088 75.9342 26.312 73.5823 26.312ZM88.5141 14H91.1061V26H88.5141V24.464C87.7221 25.712 86.4261 26.312 84.7941 26.312C82.1061 26.312 80.1861 24.488 80.1861 21.368V14H82.7781V21.104C82.7781 22.928 83.8341 23.888 85.4661 23.888C87.1701 23.888 88.5141 22.88 88.5141 20.432V14ZM96.229 16.016C96.949 14.384 98.413 13.784 99.925 13.784V16.592C98.221 16.472 96.229 17.264 96.229 19.952V26H93.637V14H96.229V16.016ZM102.818 21.104C103.226 22.976 104.738 23.936 106.658 23.936C108.098 23.936 109.178 23.288 109.754 22.448L111.89 23.696C110.786 25.328 108.986 26.312 106.634 26.312C102.674 26.312 100.106 23.6 100.106 20C100.106 16.448 102.674 13.688 106.442 13.688C110.018 13.688 112.466 16.568 112.466 20.024C112.466 20.384 112.418 20.768 112.37 21.104H102.818ZM102.794 18.992H109.85C109.49 16.928 107.978 16.04 106.418 16.04C104.474 16.04 103.154 17.192 102.794 18.992Z" fill="currentColor"/><path d="M116.106 17.312C116.106 19.496 122.562 18.176 122.562 22.616C122.562 25.016 120.474 26.312 117.882 26.312C115.482 26.312 113.754 25.232 112.986 23.504L115.218 22.208C115.602 23.288 116.562 23.936 117.882 23.936C119.034 23.936 119.922 23.552 119.922 22.592C119.922 20.456 113.466 21.656 113.466 17.36C113.466 15.104 115.41 13.688 117.858 13.688C119.826 13.688 121.458 14.6 122.298 16.184L120.114 17.408C119.682 16.472 118.842 16.04 117.858 16.04C116.922 16.04 116.106 16.448 116.106 17.312ZM131.132 13.688C134.396 13.688 137.108 16.448 137.108 20C137.108 23.576 134.396 26.312 131.132 26.312C129.26 26.312 127.844 25.544 126.932 24.296V30.8H124.34V14H126.932V15.728C127.844 14.456 129.26 13.688 131.132 13.688ZM130.724 23.84C132.884 23.84 134.516 22.232 134.516 20C134.516 17.768 132.884 16.16 130.724 16.16C128.564 16.16 126.932 17.768 126.932 20C126.932 22.232 128.564 23.84 130.724 23.84ZM141.549 16.016C142.269 14.384 143.733 13.784 145.245 13.784V16.592C143.541 16.472 141.549 17.264 141.549 19.952V26H138.957V14H141.549V16.016ZM147.956 12.2C147.044 12.2 146.3 11.432 146.3 10.544C146.3 9.632 147.044 8.888 147.956 8.888C148.868 8.888 149.612 9.632 149.612 10.544C149.612 11.432 148.868 12.2 147.956 12.2ZM146.66 26V14H149.252V26H146.66ZM158.074 13.688C160.762 13.688 162.682 15.512 162.682 18.632V26H160.09V18.896C160.09 17.072 159.034 16.112 157.402 16.112C155.698 16.112 154.354 17.12 154.354 19.568V26H151.762V14H154.354V15.536C155.146 14.288 156.442 13.688 158.074 13.688ZM171.669 16.496H168.693V22.256C168.693 23.792 169.701 23.768 171.669 23.672V26C167.685 26.48 166.101 25.376 166.101 22.256V16.496H163.893V14H166.101V11.408L168.693 10.64V14H171.669V16.496Z" fill="#56B1A8"/><path d="M176.97 1.88C178.97 1.88 180.59 3.5 180.59 5.5C180.59 7.5 178.97 9.12 176.97 9.12C174.97 9.12 173.35 7.5 173.35 5.5C173.35 3.5 174.97 1.88 176.97 1.88ZM176.97 8.8C178.78 8.8 180.24 7.32 180.24 5.5C180.24 3.67 178.78 2.2 176.97 2.2C175.17 2.2 173.7 3.67 173.7 5.5C173.7 7.32 175.17 8.8 176.97 8.8ZM178.49 4.86C178.49 5.36 178.27 5.74 177.9 5.96L178.66 7.35H177.66L177.07 6.18H176.62V7.35H175.7V3.65H177.07C177.9 3.65 178.49 4.17 178.49 4.86ZM176.62 4.5V5.38H177.02C177.37 5.38 177.57 5.2 177.57 4.94C177.57 4.65 177.37 4.5 177.02 4.5H176.62Z" fill="#56B1A8"/></svg>';
  const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } } };

  /* ---------- shell ---------- */
  function renderShell() {
    const kind = body.dataset.shell;
    if (!kind || !NAV[kind]) return;
    const cfg = NAV[kind];
    const main = document.getElementById('main');
    const m = body.dataset.module;
    const hit = x => x.id === m || (x.also || []).includes(m);
    const grp = cfg.groups.find(g => hit(g) || (g.items || []).some(hit));
    const itm = grp?.items?.find(hit);

    /* breadcrumbs: group › module come from NAV, anything after comes from the page */
    let crumbs = (body.dataset.crumbs || '').split('|').filter(Boolean);
    if (kind === 'buyer' && grp && grp.id !== 'home') {
      const tail = itm ? crumbs.slice(2) : crumbs.slice(1);
      const isDetail = tail.length > 0;
      crumbs = [grp.label, ...(itm ? [`${itm.label}${isDetail ? '>' + itm.href : ''}`] : []), ...tail];
      if (!itm && !isDetail) crumbs = [grp.label];
    }
    const crumbHtml = crumbs.map((c, i) => { const [t, h] = c.split('>');
      return i === crumbs.length - 1 ? `<li aria-current="page">${esc(t)}</li>` : h ? `<li><a href="${url(h)}">${esc(t)}</a></li>` : `<li><span>${esc(t)}</span></li>`; }).join('');

    const leaf = g => `<li><a class="ps-side__link ps-side__top${hit(g) ? ' is-active' : ''}" href="${url(g.href)}"${hit(g) ? ' aria-current="page"' : ''}><span class="ms" aria-hidden="true">${g.icon}</span><span class="ps-side__text">${esc(g.label)}</span>${g.badge ? `<span class="ps-side__badge" aria-label="${g.badge} new">${g.badge}</span>` : ''}</a></li>`;
    const group = g => { const on = g === grp;
      return `<li class="ps-side__grp${on ? ' is-active' : ''}"><button class="ps-side__top" type="button" aria-expanded="${on}" aria-controls="nav-${g.id}"><span class="ms" aria-hidden="true">${g.icon}</span><span class="ps-side__text">${esc(g.label)}</span><span class="ms ps-side__chev" aria-hidden="true">expand_more</span></button>
        <ul class="ps-side__sub" id="nav-${g.id}" aria-label="${esc(g.label)}"><li class="ps-side__subhead" aria-hidden="true">${esc(g.label)}</li>${g.items.map(x => `<li><a class="ps-side__link${hit(x) ? ' is-active' : ''}" href="${url(x.href)}"${hit(x) ? ' aria-current="page"' : ''}>${esc(x.label)}</a></li>`).join('')}</ul></li>`; };

    const side = document.createElement('nav');
    side.className = 'ps-side'; side.id = 'ps-side'; side.setAttribute('aria-label', 'Main');
    side.innerHTML = `
      <div class="ps-side__head"><a class="ps-side__logo" href="${url(kind === 'supplier' ? 'modules/supplier-home.html' : 'modules/home.html')}" aria-label="Procuresprint home">${LOGO}</a>
        <button class="ps-side__collapse" type="button" aria-label="Collapse navigation" aria-pressed="false"><span class="ms" aria-hidden="true">chevron_left</span></button></div>
      <ul class="ps-side__nav">${cfg.groups.map(g => g.items ? group(g) : leaf(g)).join('')}</ul>
      <div class="ps-side__foot ps-menuwrap">
        <button class="ps-side__user" type="button" data-menu="ps-user-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Account: ${esc(cfg.user.name)}, ${esc(cfg.user.role)}"><span class="ps-side__avatar" aria-hidden="true">${esc(cfg.user.initials)}</span><span class="ps-side__text"><span class="ps-side__name">${esc(cfg.user.name)}</span><span class="ps-side__role">${esc(cfg.user.role)}</span></span><span class="ms ps-side__more" aria-hidden="true">unfold_more</span></button>
        <div class="ps-menu ps-menu--up" id="ps-user-menu" role="menu" aria-label="Account">
          <div class="ps-menu__head">${esc(cfg.user.name)}<br><span class="t-body-sm">${esc(cfg.user.role)}</span></div><hr>
          <a role="menuitem" href="#" data-todo><span class="ms" aria-hidden="true">person</span>My profile</a>
          <a role="menuitem" href="#" data-todo><span class="ms" aria-hidden="true">tune</span>Preferences</a>
          <a role="menuitem" href="#" data-todo><span class="ms" aria-hidden="true">swap_horiz</span>Delegations</a><hr>
          <a role="menuitem" href="#" data-todo><span class="ms" aria-hidden="true">logout</span>Sign out</a>
        </div>
      </div>`;

    const top = document.createElement('header');
    top.className = 'ps-topbar';
    top.innerHTML = `
      <svg class="ps-topbar__wave" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 70C140 20 300 24 470 66S820 128 1010 84 1290 6 1440 38V160H0Z"/><path d="M0 104C170 58 330 66 520 106S880 160 1080 116 1330 52 1440 80V160H0Z"/><path d="M0 128C200 92 380 100 580 132S940 170 1140 138 1360 94 1440 112V160H0Z"/><path d="M0 40C120 78 280 92 450 58S780 -6 980 30 1300 96 1440 60"/></svg>
      <button class="ps-iconbtn ps-topbar__menu" type="button" aria-label="Open navigation" aria-controls="ps-side" aria-expanded="false"><span class="ms ms--24" aria-hidden="true">menu</span></button>
      <div class="ps-topbar__head">
        <nav class="ps-crumbs ps-topbar__crumbs${crumbs.length > 2 ? '' : ' sr-only'}" aria-label="Breadcrumb"><ol>${crumbHtml}</ol></nav>
        <div class="ps-topbar__title" data-title-slot></div>
      </div>
      <div class="ps-topbar__actions">
        ${cfg.approvals ? `<a class="ps-iconbtn" href="${url('modules/approvals.html')}" aria-label="Approvals, ${cfg.approvals} pending"${m === 'approvals' ? ' aria-current="page"' : ''}><span class="ms" aria-hidden="true">task_alt</span><span class="ps-iconbtn__badge" aria-hidden="true">${cfg.approvals}</span></a>` : ''}
        ${kind === 'buyer' ? `<button class="ps-btn ps-btn--ai ps-btn--sm ps-topbar__ask" type="button" data-open="ps-assistant" aria-label="Ask Me"><span class="ms ms--fill" aria-hidden="true">smart_toy</span><span class="ps-topbar__asklabel">Ask Me</span></button>` : ''}
        <button class="ps-iconbtn" type="button" aria-label="Notifications, 5 unread" data-todo><span class="ms ms--fill" aria-hidden="true">notifications</span><span class="ps-dot" aria-hidden="true"></span></button>
        <button class="ps-topbar__refresh" type="button" data-refresh aria-label="Refresh this page"><span class="ps-topbar__refreshlabel">Refresh</span><span class="ms" aria-hidden="true">refresh</span></button>
      </div>`;

    /* the page's own h1 becomes the banner title (workbench pages render theirs after this script) */
    const slot = top.querySelector('[data-title-slot]');
    const adoptTitle = () => { const h = main.querySelector('h1'); if (!h) return false; h.classList.add('ps-topbar__h1'); slot.append(h); return true; };
    if (!adoptTitle()) {
      const mo = new MutationObserver(() => { if (adoptTitle()) mo.disconnect(); });
      mo.observe(main, { childList: true, subtree: true });
      window.addEventListener('load', () => {
        mo.disconnect();
        if (!slot.querySelector('h1') && !adoptTitle()) { const h = document.createElement('h1'); h.className = 'ps-topbar__h1'; h.textContent = top.querySelector('.ps-crumbs [aria-current="page"]')?.textContent || document.title; slot.append(h); }
      });
    }
    top.querySelector('[data-refresh]').addEventListener('click', () => location.reload());

    const app = document.createElement('div');
    app.className = 'ps-app' + (kind === 'supplier' ? ' ps-app--supplier' : '');
    const col = document.createElement('div'); col.className = 'ps-main';
    main.classList.add('ps-page'); main.tabIndex = -1;
    main.replaceWith(app);
    col.append(top, main); app.append(side, col);
    body.prepend(Object.assign(document.createElement('a'), { className: 'ps-skip', href: '#main', textContent: 'Skip to content' }));
    if (kind === 'buyer') body.append(assistant());

    /* collapse to the 64px icon rail (desktop) — remembered per browser */
    const cb = side.querySelector('.ps-side__collapse');
    const setCollapsed = on => { app.classList.toggle('is-collapsed', on); cb.setAttribute('aria-pressed', String(on)); cb.setAttribute('aria-label', on ? 'Expand navigation' : 'Collapse navigation'); cb.querySelector('.ms').textContent = on ? 'chevron_right' : 'chevron_left'; closePops(); };
    const closePops = () => { if (app.classList.contains('is-collapsed')) side.querySelectorAll('.ps-side__grp > button[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false')); };
    setCollapsed(store.get('ps-nav') === 'collapsed');
    cb.addEventListener('click', () => { const on = !app.classList.contains('is-collapsed'); setCollapsed(on); store.set('ps-nav', on ? 'collapsed' : 'expanded'); });

    /* groups: accordion when expanded, fly-out popover when collapsed */
    side.addEventListener('click', e => {
      const b = e.target.closest('.ps-side__grp > button'); if (!b) return;
      const open = b.getAttribute('aria-expanded') === 'true';
      if (app.classList.contains('is-collapsed')) closePops();
      b.setAttribute('aria-expanded', String(!open));
      if (!open && app.classList.contains('is-collapsed')) b.nextElementSibling.querySelector('a')?.focus();
    });
    document.addEventListener('click', e => { if (!side.contains(e.target)) closePops(); });
    document.addEventListener('keydown', e => { if (e.key !== 'Escape' || !app.classList.contains('is-collapsed')) return; const b = side.querySelector('.ps-side__grp > button[aria-expanded="true"]'); if (b) { closePops(); b.focus(); } });

    /* mobile drawer */
    const mb = top.querySelector('.ps-topbar__menu'); let scrim;
    const setNav = on => { side.classList.toggle('is-open', on); mb.setAttribute('aria-expanded', String(on));
      if (on) { scrim = Object.assign(document.createElement('div'), { className: 'ps-scrim' }); scrim.onclick = () => setNav(false); body.append(scrim); side.querySelector('a,button')?.focus(); }
      else { scrim?.remove(); } };
    mb.addEventListener('click', () => setNav(!side.classList.contains('is-open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && side.classList.contains('is-open')) { setNav(false); mb.focus(); } });

    /* "/" focuses global search */
  }

  /* Ask Me: the AI-native S2P frame (black and red) with starter prompts. Item master pages get item starters. */
  function assistant() {
    const d = document.createElement('dialog');
    d.className = 'ps-drawer im-askme'; d.id = 'ps-assistant'; d.setAttribute('aria-labelledby', 'ps-assistant-title');
    const items = body.dataset.group === 'items';
    const S = items ? [['upload_file', 'Bulk upload new items', 'item-bulk-upload.html?action=create', 'Open bulk upload. Download the template, fill one row per item, upload it, and I check every row for you.'],
      ['edit_note', 'Bulk update items', 'item-bulk-upload.html?action=update', 'Open bulk update. The template has the item code plus only the fields you want to change.'],
      ['add_circle', 'Create an item', 'item-request-new.html', 'Open a new item request. Type what you need or drop a supplier PDF and I fill the fields.'],
      ['add_location', 'Extend an item to a plant', 'item-master.html?pick=Extend', 'Open the item master. Pick the item, then Extend to plant.'],
      ['reply', 'Show my requests that were sent back', 'item-requests.html?view=sent-back', 'One request is waiting for you. Opening the list.'],
      ['fact_check', 'How good is our item data?', 'item-requests.html', 'Item master data quality is shown on the Item requests page, with the fields most often missing.']]
      : [['receipt_long', 'Which approved PRs are waiting for a PO?', '', 'Three approved PRs are older than 7 days without a PO: PR-2025-00114, PR-2025-00115 and PR-2025-00116.'], ['groups', 'Find suppliers for a category', '', 'Tell me the category and region and I search supplier scout.'], ['upload_file', 'Bulk upload items', 'item-bulk-upload.html', 'Opening bulk upload.']];
    const root = body.dataset.root || '..';
    d.innerHTML = `<div class="ps-drawer__head"><span class="im-askme__logo"><span class="ms" aria-hidden="true">smart_toy</span></span><div style="flex:1"><h2 class="ps-drawer__title" id="ps-assistant-title">Ask Me</h2><p class="t-body-sm">Your procurement agent. It acts on your data; always check before you confirm.</p></div><button class="ps-iconbtn" type="button" data-close aria-label="Close Ask Me"><span class="ms" aria-hidden="true">close</span></button></div>
      <div class="ps-drawer__body"><div class="ps-chat" id="ps-ask-chat"><div class="ps-chat__msg ps-chat__msg--ai">Hi${body.dataset.user ? ' ' + esc(body.dataset.user) : ''}. What should we do${items ? ' with the item master' : ''} today?</div></div>
        <div class="im-askme__starters" id="ps-ask-starters" aria-label="Starter prompts">${S.map((x, i) => `<button type="button" data-ask="${i}"><span class="ms" aria-hidden="true">${x[0]}</span>${esc(x[1])}</button>`).join('')}</div></div>
      <div class="ps-drawer__foot" style="justify-content:stretch"><label class="sr-only" for="ps-ask">Ask me</label><input class="ps-input" id="ps-ask" placeholder="Ask or tell me what to do…" style="flex:1"><button class="ps-btn ps-btn--primary" type="button" id="ps-ask-send" aria-label="Send"><span class="ms" aria-hidden="true">send</span></button></div>`;
    const chat = d.querySelector('#ps-ask-chat');
    const add = (me, html) => { const m = document.createElement('div'); m.className = 'ps-chat__msg ps-chat__msg--' + (me ? 'me' : 'ai'); m.innerHTML = html; chat.append(m); m.scrollIntoView({ block: 'nearest' }); };
    const answer = x => { add(true, esc(x[1])); setTimeout(() => add(false, esc(x[3]) + (x[2] ? `<div class="ps-chat__cite"><a href="${root}/modules/${x[2]}" style="color:inherit">Open it <span class="ms" aria-hidden="true">arrow_forward</span></a></div>` : '')), 250); };
    d.addEventListener('click', e => { const b = e.target.closest('[data-ask]'); if (b) answer(S[+b.dataset.ask]); if (e.target.closest('#ps-ask-send')) { const q = d.querySelector('#ps-ask'); const v = q.value.trim(); if (!v) return; const hit = S.find(x => x[1].toLowerCase().split(' ').filter(w => w.length > 3).some(w => v.toLowerCase().includes(w))); q.value = ''; hit ? answer([hit[0], v, hit[2], hit[3]]) : (add(true, esc(v)), setTimeout(() => add(false, 'I can help with that. Try one of the starters, or be more specific about the item, plant or request.'), 250)); } });
    d.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'ps-ask') { e.preventDefault(); d.querySelector('#ps-ask-send').click(); } });
    return d;
  }

  /* ---------- toast ---------- */
  let region;
  function toast(text, opt = {}) {
    if (!region) { region = Object.assign(document.createElement('div'), { className: 'ps-toasts' }); region.setAttribute('role', 'status'); region.setAttribute('aria-live', 'polite'); body.append(region); }
    const t = document.createElement('div');
    t.className = 'ps-toast' + (opt.error ? ' ps-toast--error' : '');
    t.innerHTML = `<span class="ms" aria-hidden="true">${opt.error ? 'error' : 'check_circle'}</span><span class="ps-toast__text"></span>${opt.action ? '<button class="ps-toast__action" type="button"></button>' : ''}<button type="button" aria-label="Dismiss"><span class="ms" aria-hidden="true">close</span></button>`;
    t.querySelector('.ps-toast__text').textContent = text;
    if (opt.action) t.querySelector('button').textContent = opt.action;
    t.querySelectorAll('button').forEach(b => b.addEventListener('click', () => t.remove()));
    region.append(t); setTimeout(() => t.remove(), opt.ms || 6000);
  }

  /* ---------- behaviours (event delegation, works for shell + page) ---------- */
  /* row menus live inside scrolling tables, so they are positioned against the viewport instead of the cell */
  function portalMenu(btn, mn) {
    if (!mn.classList.contains('ps-menu--float') && btn.closest('.ps-table, .ps-table-scroll')) mn.classList.add('ps-menu--float');
    if (mn.classList.contains('ps-menu--float') && mn.parentElement !== document.body) document.body.append(mn);
  }
  function placeFloat(btn, mn) {
    const r = btn.getBoundingClientRect(); mn.style.right = `${Math.max(8, innerWidth - r.right)}px`; mn.style.left = 'auto';
    const h = mn.offsetHeight; const below = r.bottom + 4 + h <= innerHeight - 8;
    mn.style.top = below ? `${r.bottom + 4}px` : `${Math.max(8, r.top - 4 - h)}px`;
  }
  const refloat = () => document.querySelectorAll('.ps-menu--float.is-open').forEach(mn => { const b = document.querySelector(`[data-menu="${mn.id}"]`); if (b) placeFloat(b, mn); });
  addEventListener('scroll', refloat, { passive: true, capture: true });
  addEventListener('resize', refloat);
  function closeMenus(except) {
    document.querySelectorAll('.ps-menu.is-open').forEach(mn => { if (mn !== except) { mn.classList.remove('is-open'); document.querySelector(`[data-menu="${mn.id}"]`)?.setAttribute('aria-expanded', 'false'); } });
  }
  document.addEventListener('click', e => {
    const t = e.target;
    const mb = t.closest('[data-menu]');
    if (mb) { const mn = document.getElementById(mb.dataset.menu); const on = !mn.classList.contains('is-open'); closeMenus(mn); mn.classList.toggle('is-open', on); mb.setAttribute('aria-expanded', String(on)); if (on) { portalMenu(mb, mn); if (mn.classList.contains('ps-menu--float')) placeFloat(mb, mn); } if (on) mn.querySelector('[role^="menuitem"]')?.focus({ preventScroll: true }); return; }
    if (!t.closest('.ps-menu')) closeMenus();
    if (t.closest('.ps-menu [role^="menuitem"]')) closeMenus();

    const op = t.closest('[data-open]'); if (op) { document.getElementById(op.dataset.open)?.showModal(); return; }
    const cl = t.closest('[data-close]'); if (cl) { cl.closest('dialog')?.close(); return; }
    if (t.matches('dialog.ps-drawer, dialog.ps-dialog')) { t.close(); return; } // click on backdrop
    const td = t.closest('[data-todo]'); if (td) { e.preventDefault(); toast('Not wired up in this prototype.'); return; }
    const ts = t.closest('[data-toast]'); if (ts) { toast(ts.dataset.toast, { action: ts.dataset.toastAction }); }

    const seg = t.closest('.ps-seg button'); if (seg) { seg.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === seg))); if (seg.dataset.density) seg.closest('[data-density-scope]')?.setAttribute('data-density', seg.dataset.density); }
    const fc = t.closest('.ps-fchip[aria-pressed]'); if (fc && !fc.closest('[data-exclusive]')) fc.setAttribute('aria-pressed', String(fc.getAttribute('aria-pressed') !== 'true'));
    const tile = t.closest('.ps-tile[aria-pressed]'); if (tile) {
      const on = tile.getAttribute('aria-pressed') !== 'true';
      tile.parentElement.querySelectorAll('.ps-tile[aria-pressed]').forEach(x => x.setAttribute('aria-pressed', 'false'));
      tile.setAttribute('aria-pressed', String(on));
      filterRows(tile.dataset.target, on ? tile.dataset.match : '');
    }
    const sort = t.closest('.ps-sort'); if (sort) sortBy(sort);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { const open = document.querySelector('.ps-menu.is-open'); if (open) { closeMenus(); document.querySelector(`[data-menu="${open.id}"]`)?.focus(); } }
    const mn = e.target.closest('.ps-menu'); if (mn && /Arrow(Up|Down)/.test(e.key)) { e.preventDefault(); const it = [...mn.querySelectorAll('[role^="menuitem"]')]; const i = it.indexOf(e.target); it.at((i + (e.key === 'ArrowDown' ? 1 : -1)) % it.length)?.focus({ preventScroll: true }); }
    const tab = e.target.closest('[role="tab"]'); if (tab && /Arrow(Left|Right)|Home|End/.test(e.key)) {
      const all = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')]; let i = all.indexOf(tab);
      i = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
      all.at(i).focus(); all.at(i).click(); e.preventDefault();
      all.at(i).scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  });

  /* tabs: select + optional row filter (data-target table id, data-match row value) */
  document.addEventListener('click', e => {
    const tab = e.target.closest('[role="tab"]'); if (!tab) return;
    const list = tab.closest('[role="tablist"]');
    list.querySelectorAll('[role="tab"]').forEach(x => { const on = x === tab; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; const p = x.getAttribute('aria-controls'); if (p && !list.dataset.target) document.getElementById(p)?.toggleAttribute('hidden', !on); });
    if (list.dataset.target) filterRows(list.dataset.target, tab.dataset.match || '');
  });

  function filterRows(id, match) {
    const tb = document.querySelector(`#${id} tbody`); if (!tb) return;
    let n = 0;
    tb.querySelectorAll('tr').forEach(r => { const show = !match || (r.dataset.tags || '').split(' ').includes(match); r.hidden = !show; if (show) n++; });
    const out = document.querySelector(`[data-count-for="${id}"]`); if (out) out.textContent = n;
    const empty = document.querySelector(`[data-empty-for="${id}"]`); if (empty) empty.hidden = n > 0;
  }

  function sortBy(btn) {
    const th = btn.closest('th'), table = th.closest('table'), idx = [...th.parentElement.children].indexOf(th);
    const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
    table.querySelectorAll('th[aria-sort]').forEach(x => { x.removeAttribute('aria-sort'); const i = x.querySelector('.ps-sort .ms'); if (i) i.textContent = 'swap_vert'; });
    th.setAttribute('aria-sort', dir); btn.querySelector('.ms').textContent = dir === 'ascending' ? 'arrow_upward' : 'arrow_downward';
    const tb = table.tBodies[0];
    const key = r => { const c = r.children[idx]; const v = c?.dataset.sort ?? c?.textContent.trim() ?? ''; const n = parseFloat(v); return isNaN(n) ? v.toLowerCase() : n; };
    [...tb.rows].sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * (dir === 'ascending' ? 1 : -1); }).forEach(r => tb.append(r));
  }

  /* row selection + bulk bar */
  document.addEventListener('change', e => {
    const cb = e.target; if (!cb.matches('.ps-table input[type="checkbox"]')) return;
    const table = cb.closest('table');
    if (cb.dataset.all !== undefined) table.querySelectorAll('tbody tr:not([hidden]) input[type="checkbox"]').forEach(x => { x.checked = cb.checked; });
    table.querySelectorAll('tbody tr').forEach(r => { const c = r.querySelector('input[type="checkbox"]'); if (c) r.setAttribute('aria-selected', String(c.checked)); });
    const n = table.querySelectorAll('tbody input[type="checkbox"]:checked').length;
    const bar = document.querySelector(`[data-bulk-for="${table.id}"]`);
    if (bar) { bar.classList.toggle('is-visible', n > 0); bar.querySelector('[data-bulk-count]').textContent = `${n} selected`; }
    const all = table.querySelector('[data-all]'); if (all && cb !== all) { const tot = table.querySelectorAll('tbody tr:not([hidden]) input[type="checkbox"]').length; all.checked = n === tot; all.indeterminate = n > 0 && n < tot; }
  });

  window.PS = { toast, filterRows, NAV };
  renderShell();
  /* horizontally scrollable regions get keyboard access only when they actually overflow (WCAG 2.1.1) */
  const scrollFix = () => document.querySelectorAll('.ps-table-scroll, .ds-table-scroll').forEach(el => {
    const over = el.scrollWidth > el.clientWidth + 1;
    if (over && !el.hasAttribute('tabindex')) {
      el.tabIndex = 0; el.setAttribute('role', 'region');
      const h = el.querySelector('caption')?.textContent || el.closest('section')?.querySelector('h2, h3')?.textContent || 'Table';
      el.setAttribute('aria-label', `${h.trim()} (scrolls sideways)`); el.dataset.psScroll = '1';
    } else if (!over && el.dataset.psScroll) { el.removeAttribute('tabindex'); el.removeAttribute('role'); el.removeAttribute('aria-label'); delete el.dataset.psScroll; }
  });
  setTimeout(scrollFix, 50);
  new ResizeObserver(() => scrollFix()).observe(document.documentElement);
  /* tabs that filter a table control that table (gives screen readers the tab → content relationship) */
  setTimeout(() => document.querySelectorAll('[role="tablist"][data-target] [role="tab"]').forEach(t => t.setAttribute('aria-controls', t.closest('[role="tablist"]').dataset.target)), 0);
}

