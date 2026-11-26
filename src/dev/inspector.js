/**
 * Point-and-edit bridge. Active only when the product runs inside the Studio
 * preview (an iframe). Highlights the element under the cursor, reports the
 * clicked element's source location to the parent, and forwards runtime
 * errors so a fix can be requested with one click. Dropped from
 * production builds by the `import.meta.env.DEV` guard.
 */
if (import.meta.env.DEV && typeof window !== 'undefined' && window.parent !== window) {
  const post = (message) => window.parent.postMessage({ source: 'studio-product', ...message }, '*');
  let inspecting = false;
  let overlay = null;
  let label = null;

  const ensureOverlay = () => {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483646;border:1.5px solid #d51313;background:rgba(213,19,19,.06);border-radius:3px;transition:all .06s ease-out;display:none';
    label = document.createElement('div');
    label.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483647;background:#17191c;color:#fff;font:11px/1.4 ui-monospace,Menlo,monospace;padding:2px 6px;border-radius:3px;display:none;max-width:70vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    document.body.append(overlay, label);
  };

  const target = (el) => (el && el.closest ? el.closest('[data-loc]') : null);

  const describe = (el) => {
    const rect = el.getBoundingClientRect();
    return {
      loc: el.getAttribute('data-loc') ?? '',
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 80),
      role: el.getAttribute('role') ?? '',
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      route: location.pathname,
    };
  };

  const onMove = (e) => {
    if (!inspecting || !overlay || !label) return;
    const el = target(e.target);
    if (!el) {
      overlay.style.display = 'none';
      label.style.display = 'none';
      return;
    }
    const r = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = `${r.left}px`;
    overlay.style.top = `${r.top}px`;
    overlay.style.width = `${r.width}px`;
    overlay.style.height = `${r.height}px`;
    label.style.display = 'block';
    label.textContent = `${el.tagName.toLowerCase()} · ${el.getAttribute('data-loc')}`;
    label.style.left = `${Math.max(4, r.left)}px`;
    label.style.top = `${Math.max(4, r.top - 20)}px`;
  };

  const onClick = (e) => {
    if (!inspecting) return;
    const el = target(e.target);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    post({ type: 'selected', ...describe(el) });
  };

  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.source !== 'studio') return;
    if (m.type === 'inspect') {
      inspecting = Boolean(m.on);
      ensureOverlay();
      if (!inspecting && overlay && label) {
        overlay.style.display = 'none';
        label.style.display = 'none';
      }
      document.body.style.cursor = inspecting ? 'crosshair' : '';
    }
    if (m.type === 'navigate' && typeof m.path === 'string') {
      // Multi-page site: navigating means loading the other page.
      location.assign(m.path);
    }
  });

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);

  const reportRoute = () => post({ type: 'route', route: location.pathname, title: document.title });
  const origPush = history.pushState.bind(history);
  history.pushState = (...args) => {
    origPush(...args);
    setTimeout(reportRoute, 0);
  };
  const origReplace = history.replaceState.bind(history);
  history.replaceState = (...args) => {
    origReplace(...args);
    setTimeout(reportRoute, 0);
  };
  window.addEventListener('popstate', reportRoute);
  window.addEventListener('load', () => post({ type: 'ready', route: location.pathname }));
  window.addEventListener('error', (e) => post({ type: 'error', message: e.message, stack: String(e.error?.stack ?? '').slice(0, 1500) }));
  window.addEventListener('unhandledrejection', (e) => post({ type: 'error', message: String(e.reason?.message ?? e.reason) }));
  setTimeout(reportRoute, 0);
}

