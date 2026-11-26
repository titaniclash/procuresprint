/* Procuresprint charts — tiny SVG line / column / step charts drawn at real pixel size.
   PSChart.line(el, { labels:[], series:[{name, values:[], color:'var(--ps-cat-1)', dash?, area?}], y:{min?, max?, fmt?}, note? })
   PSChart.columns(el, { labels:[], values:[], color, fmt, highlight? })
   Colours are CSS variables so charts follow the theme. */
{
  const ns = 'http://www.w3.org/2000/svg';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nice = (lo, hi, n = 4) => {
    const span = hi - lo || 1, step0 = span / n, mag = 10 ** Math.floor(Math.log10(step0));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0);
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
    const t = []; for (let v = a; v <= b + step / 2; v += step) t.push(+v.toFixed(10));
    return t;
  };

  function mount(el, draw) {
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('role', 'img');
    el.append(svg);
    const go = () => { const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = draw(W, H); };
    const ro = new ResizeObserver(go); ro.observe(el); go();
    return svg;
  }

  function line(el, o) {
    const all = o.series.flatMap(s => s.values.filter(v => v != null));
    const ticks = nice(o.y?.min ?? Math.min(0, ...all), o.y?.max ?? Math.max(...all));
    const fmt = o.y?.fmt || (v => v);
    const svg = mount(el, (W, H) => {
      const m = { l: 44, r: W < 520 ? 12 : 96, t: 12, b: 28 };
      const x = i => m.l + (i / (o.labels.length - 1)) * (W - m.l - m.r);
      const y0 = ticks[0], y1 = ticks.at(-1);
      const y = v => m.t + (1 - (v - y0) / (y1 - y0)) * (H - m.t - m.b);
      let s = '';
      ticks.forEach(t => { s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--ps-chart-grid)"/><text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${esc(fmt(t))}</text>`; });
      const every = W < 520 ? Math.ceil(o.labels.length / 4) : Math.ceil(o.labels.length / 12);
      o.labels.forEach((l, i) => { if (i % every === 0 || i === o.labels.length - 1) s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
      o.series.forEach(se => {
        const pts = se.values.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean);
        const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
        if (se.area) s += `<path d="${d}L${pts.at(-1)[0]} ${y(y0)}L${pts[0][0]} ${y(y0)}Z" fill="${se.color}" fill-opacity=".10"/>`;
        s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="${se.dash ? 1.5 : 2.25}" ${se.dash ? 'stroke-dasharray="4 4"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
        const last = pts.at(-1);
        s += `<circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="${se.color}"/>`;
        if (W >= 520) s += `<text x="${last[0] + 8}" y="${last[1] + 4}" style="fill:${se.color};font-weight:600">${esc(se.name)}</text>`;
      });
      return s;
    });
    svg.setAttribute('aria-label', o.label || o.series.map(s => s.name).join(', '));
  }

  function columns(el, o) {
    const ticks = nice(0, Math.max(...o.values));
    const fmt = o.fmt || (v => v);
    const svg = mount(el, (W, H) => {
      const m = { l: 44, r: 8, t: 18, b: 28 };
      const n = o.values.length, bw = (W - m.l - m.r) / n;
      const y = v => m.t + (1 - v / ticks.at(-1)) * (H - m.t - m.b);
      let s = '';
      ticks.forEach(t => { s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--ps-chart-grid)"/><text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${esc(fmt(t))}</text>`; });
      o.values.forEach((v, i) => {
        const hi = o.highlight === i, x0 = m.l + i * bw + bw * .2, w = bw * .6;
        s += `<rect x="${x0}" y="${y(v)}" width="${w}" height="${y(0) - y(v)}" rx="2" fill="${hi ? o.color : 'var(--ps-chart-muted)'}"/>`;
        if (hi || W > 600) s += `<text x="${x0 + w / 2}" y="${y(v) - 6}" text-anchor="middle" style="${hi ? 'fill:var(--ps-ink);font-weight:600' : ''}">${esc(fmt(v))}</text>`;
        s += `<text x="${x0 + w / 2}" y="${H - 8}" text-anchor="middle">${esc(o.labels[i])}</text>`;
      });
      return s;
    });
    svg.setAttribute('aria-label', o.label || 'Column chart');
  }

  /* bid ladder for reverse auctions: stepped line of the leading bid over time */
  function step(el, o) {
    const vals = o.points.map(p => p.v);
    const ticks = nice(Math.min(...vals, o.reserve ?? Infinity) * .98, Math.max(...vals) * 1.01);
    const fmt = o.fmt || (v => v);
    const svg = mount(el, (W, H) => {
      const m = { l: 56, r: W < 520 ? 12 : 110, t: 12, b: 28 };
      const tMax = o.duration, x = t => m.l + (t / tMax) * (W - m.l - m.r);
      const y = v => m.t + (1 - (v - ticks[0]) / (ticks.at(-1) - ticks[0])) * (H - m.t - m.b);
      let s = '';
      ticks.forEach(t => { s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--ps-chart-grid)"/><text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${esc(fmt(t))}</text>`; });
      for (let t = 0; t <= tMax; t += o.tickEvery) s += `<text x="${x(t)}" y="${H - 8}" text-anchor="middle">${t}m</text>`;
      if (o.reserve != null) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(o.reserve)}" y2="${y(o.reserve)}" stroke="var(--ps-warning-solid)" stroke-dasharray="5 4"/>${W >= 520 ? `<text x="${W - m.r + 8}" y="${y(o.reserve) + 4}" style="fill:var(--ps-warning-fg);font-weight:600">Target ${esc(fmt(o.reserve))}</text>` : ''}`;
      let d = ''; o.points.forEach((p, i) => { d += i ? `H${x(p.t).toFixed(1)}V${y(p.v).toFixed(1)}` : `M${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`; });
      const now = o.now ?? o.points.at(-1).t; d += `H${x(now).toFixed(1)}`;
      s += `<path d="${d}" fill="none" stroke="var(--ps-cat-1)" stroke-width="2.25" stroke-linejoin="round"/>`;
      o.points.forEach(p => { s += `<circle cx="${x(p.t)}" cy="${y(p.v)}" r="3" fill="var(--ps-surface)" stroke="var(--ps-cat-1)" stroke-width="1.75"/>`; });
      const last = o.points.at(-1);
      s += `<line x1="${x(now)}" x2="${x(now)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--ps-chart-axis)" stroke-dasharray="2 3"/>`;
      if (W >= 520) s += `<text x="${x(now) + 8}" y="${y(last.v) - 10}" style="fill:var(--ps-ink);font-weight:600">Leading ${esc(fmt(last.v))}</text>`;
      return s;
    });
    svg.setAttribute('aria-label', o.label || 'Bid history');
  }

  window.PSChart = { line, columns, step };
}

