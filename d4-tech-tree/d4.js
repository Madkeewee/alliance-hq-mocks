/* d4-tech-tree shared shell: stamped glyphs, hex plates, connectors, nav, language, mock control. Data from ../shared/hq.js. */
window.D4 = (function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = matchMedia("(max-width: 860px)");

  /* own stamped pictograms on a 24-unit grid; each drawn twice (shade under, face on top) */
  const ICONS = {
    people: "M9 3.5a3.4 3.4 0 110 6.8 3.4 3.4 0 010-6.8zm8 1.8a2.7 2.7 0 110 5.4 2.7 2.7 0 010-5.4zM2 20.5c0-4 3-7 7-7s7 3 7 7V22H2v-1.5zm15-1.2c0-1.9-.5-3.6-1.5-5.1.6-.3 1.4-.5 2.3-.5 2.7 0 4.7 2.1 4.7 4.8V20h-5.5v-.7z",
    tower: "M8 2.5h8v3.2h-1.4v2.1H16l1.6 13.7H6.4L8 7.8h1.4V5.7H8V2.5zm2.6 3.2v2.1h2.8V5.7h-2.8zM10.8 14v4.3h2.4V14h-2.4z",
    mines: "M1 21L8.6 6.8l3.5 6.1 2.6-3.6L23 21H1zm15.6-18.5L19.2 5l-1 5h-3.3l-1-5 2.7-2.5z",
    scales: "M11 2h2v3h7v2h-2.2l2.7 6.3c.3.7-.2 1.7-1 1.7h-6c-.8 0-1.3-1-1-1.7L15.2 7H13v12h4.5v2h-11v-2H11V7H8.8l2.7 6.3c.3.7-.2 1.7-1 1.7h-6c-.8 0-1.3-1-1-1.7L6.2 7H4V5h7V2zm6.5 6.6L16 12h3l-1.5-3.4zm-13 0L3 12h3L4.5 8.6z",
    swords: "M2.5 2h5l6.3 6.3-2.4 2.4 2.2 2.2 1.5-1.5 1.9 1.9-1.4 1.4 3.6 3.6 1.9-1.9L22.5 18l-4.5 4.5-1.9-1.9 1.9-1.9-3.6-3.6-1.4 1.4-1.9-1.9 1.5-1.5-2.2-2.2-2.4 2.4L2.5 7.1V2zm19 0v5.1l-4.1 4.1-2.5-2.5L19 4.6V4h-.6l-4.1 4.1-2.5-2.5L15.9 2h5.6zM5.2 15.2l2.4 2.4-1.8 1.8 1.9 1.9-1.6 1.6L4.2 21l-1.7 1.7L1 21.2 2.7 19.5 1 17.8l1.6-1.6 1.7 1.7 1.8-1.8z",
    hourglass: "M4 2h16v4.2l-5 5.8 5 5.8V22H4v-4.2l5-5.8-5-5.8V2zm3 3v.6L12 11l5-5.4V5H7zm5 8.6L7 19v.5h10V19l-5-5.4z",
    gate: "M2 6h20v2.5h-1V22h-3v-5h-3v5h-2v-5H9v5H7v-5H5v5H3V8.5H2V6zm3 4.5v4h2v-4H5zm4 0v4h2v-4H9zm4 0v4h2v-4h-2zm4 0v4h2v-4h-2zM3 2h18v2.5H3V2z",
    core: "M12 1.2l9.4 5.4v10.8L12 22.8l-9.4-5.4V6.6L12 1.2zm0 5.3a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm0 2.6a2.9 2.9 0 110 5.8 2.9 2.9 0 010-5.8z",
    derrick: "M8 22l2.4-17h3.2L16 22h-2.2l-.4-3.3h-2.8L10.2 22H8zm2.9-5.3h2.2l-.5-4h-1.2l-.5 4zM6 4h12v2H6V4zm12.2 10.5c0-2 2.3-4.5 2.3-4.5s2.3 2.5 2.3 4.5a2.3 2.3 0 11-4.6 0z",
    scale: "M12 2.5l6.5 3.2L21 12l-2.5 6.3L12 21.5l-6.5-3.2L3 12l2.5-6.3L12 2.5zm0 3.2L7.8 7.8 6.2 12l1.6 4.2L12 18.3l4.2-2.1 1.6-4.2-1.6-4.2L12 5.7zM12 8l2.8 1.4.7 2.6-.7 2.6L12 16l-2.8-1.4-.7-2.6.7-2.6L12 8z",
    wood: "M12 3.5c5.2 0 9 1.9 9 4.3v8.4c0 2.4-3.8 4.3-9 4.3s-9-1.9-9-4.3V7.8c0-2.4 3.8-4.3 9-4.3zm0 2.3c-4.2 0-6.7 1.2-6.7 2s2.5 2 6.7 2 6.7-1.2 6.7-2-2.5-2-6.7-2zm0 1a3.4 1 0 100 2 3.4 1 0 000-2z",
    iron: "M6 6.5h12l4 10.5H2L6 6.5zm1.4 2.3L5 14.7h14l-2.4-5.9H7.4zM3 18h18v1.8H3V18z",
    electricity: "M12 1.5a10.5 10.5 0 110 21 10.5 10.5 0 010-21zM13.6 5L7 13.5h4.1L10 19l6.9-8.5h-4.2L13.6 5z",
    coin: "M12 1.5a10.5 10.5 0 110 21 10.5 10.5 0 010-21zm0 3.2a7.3 7.3 0 100 14.6 7.3 7.3 0 000-14.6zM10.6 7.5h2.8v9h-2.8v-9z",
    badge: "M12 1.5l8.5 3.2v6.1c0 5.2-3.6 9.1-8.5 11.7C7.1 19.9 3.5 16 3.5 10.8V4.7L12 1.5zm0 4.8l-1.4 3-3.3.4 2.4 2.3-.6 3.3 2.9-1.6 2.9 1.6-.6-3.3 2.4-2.3-3.3-.4-1.4-3z",
    crystal: "M12 1.5l6.5 7-6.5 14-6.5-14 6.5-7zm0 3.3L8.4 8.5h7.2L12 4.8zM8.1 10.3l3.9 8.4 3.9-8.4H8.1z",
    clock: "M12 1.5a10.5 10.5 0 110 21 10.5 10.5 0 010-21zm0 3a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm-1.1 2.6h2.2v4.5l3.2 1.9-1.1 1.9-4.3-2.5V7.1z",
    book: "M3 3h7.2A2.4 2.4 0 0112 4.4 2.4 2.4 0 0113.8 3H21v15.5h-7.2A1.8 1.8 0 0012 20.3a1.8 1.8 0 00-1.8-1.8H3V3zm2 2v11.5h5.2c.7 0 1.3.2 1.8.5V5.6a.6.6 0 00-.6-.6H5zm14 0h-5.4a.6.6 0 00-.6.6V17c.5-.3 1.1-.5 1.8-.5H19V5z",
    gear: "M12 1.5l2 3.2 3.6-1 1 3.6 3.2 2L20.4 12l1.4 2.7-3.2 2-1 3.6-3.6-1-2 3.2-2-3.2-3.6 1-1-3.6-3.2-2L3.6 12 2.2 9.3l3.2-2 1-3.6 3.6 1 2-3.2zm0 6a4.5 4.5 0 100 9 4.5 4.5 0 000-9z",
    pin: "M12 1.5c3.9 0 7 3 7 6.8 0 5-7 14.2-7 14.2S5 13.3 5 8.3c0-3.8 3.1-6.8 7-6.8zm0 4a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6z",
    check: "M5 12.5l4.2 4.2L19 7",
    lock: "M7 10V7.5a5 5 0 0110 0V10h1.5v11h-13V10H7zm2.2 0h5.6V7.5a2.8 2.8 0 00-5.6 0V10z",
    swap: "M7 3l4 4-1.4 1.4L8 6.8V16H6V6.8L4.4 8.4 3 7l4-4zm10 18l-4-4 1.4-1.4 1.6 1.6V8h2v9.2l1.6-1.6L21 17l-4 4z"
  };
  const ico = (n, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path class="shade" d="${ICONS[n]}" fill-rule="evenodd" transform="translate(0 1.3)"/><path class="face" d="${ICONS[n]}" fill-rule="evenodd"/></svg>`;
  const dot = state => state === "done"
    ? `<span class="dot"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS.check}" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`
    : state === "locked" ? `<span class="dot lock"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS.lock}" fill="currentColor"/></svg></span>` : "";
  const plate = (icon, state, inner) => `<span class="plate-wrap"><span class="plate"><span class="plate-in">${inner || ico(icon)}</span></span>${dot(state)}</span>`;
  const insignia = tag => `<svg viewBox="0 0 48 48" aria-hidden="true"><polygon points="24,2 43,13 43,35 24,46 5,35 5,13" fill="var(--plate)" stroke="var(--accent)" stroke-width="2.5"/><polygon points="24,8 38,16 38,32 24,40 10,32 10,16" fill="none" stroke="var(--brass)" stroke-width="1"/><text x="24" y="29" text-anchor="middle" font-family="Big Shoulders Display, Encode Sans Semi Condensed, sans-serif" font-size="15" font-weight="700" fill="var(--frost)">${esc(tag)}</text></svg>`;

  /* orthogonal connectors measured from laid-out plates */
  function rectOf(el, root) {
    const r = el.getBoundingClientRect(), o = root.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  }
  function route(a, b, others) {
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
    if (Math.abs(ax - bx) < 6) return `M${ax} ${a.y + a.h}V${b.y}`;
    if (Math.abs(ay - by) < 6) return ax < bx ? `M${a.x + a.w} ${ay}H${b.x}` : `M${a.x} ${ay}H${b.x + b.w}`;
    const nearX = ax < bx ? b.x : b.x + b.w;
    const x1 = Math.min(ax, nearX), x2 = Math.max(ax, nearX);
    const blocked = others.some(r => r !== a && r !== b && by > r.y && by < r.y + r.h && x2 > r.x && x1 < r.x + r.w);
    if (!blocked) return `M${ax} ${a.y + a.h}V${by}H${nearX}`;
    const gy = b.y - 10;
    return `M${ax} ${a.y + a.h}V${gy}H${bx}V${b.y}`;
  }
  function drawWires(root, pairs, cls) {
    const svg = $(":scope > .wires", root);
    if (!svg) return null;
    if (!pairs.length) { svg.innerHTML = ""; return svg; }
    const plates = pairs.flatMap(([a, b]) => [a, b]).filter((v, i, arr) => arr.indexOf(v) === i);
    const rects = new Map(plates.map(p => [p, rectOf(p, root)]));
    const all = [...rects.values()];
    svg.setAttribute("viewBox", `0 0 ${root.clientWidth} ${root.clientHeight}`);
    svg.innerHTML = pairs.map(([a, b, key]) => `<path class="${cls(a, b, key)}" d="${route(rects.get(a), rects.get(b), all)}"/>`).join("");
    return svg;
  }

  /* countdowns from the sample offsets */
  const base = Date.now();
  const targets = Object.fromEntries(HQ.season.sample.events.map(e => [e.kind, base + e.inMinutes * 60000]));
  const pad = v => String(v).padStart(2, "0");
  const fmtCountdown = ms => {
    const t = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(t / 86400), h = Math.floor(t % 86400 / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
    return (d ? `${d}d ` : "") + `${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  function tick() { const now = Date.now(); $$("[data-timer]").forEach(el => { el.textContent = fmtCountdown(targets[el.dataset.timer] - now); }); }
  const DAY = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
  const humanWhen = w => w.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/, (_, d) => DAY[d]).replace(/server$/, "server time");

  /* toast */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* store */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable: values stay in memory */ } }
  };

  /* shell: strip, title plate, nav tabs + bottom bar, language, mock pill, footer */
  const NAV = [["home", "home.html", "scale"], ["season", "#", "mines"], ["tips", "#", "book"], ["tools", "calc.html", "gear"], ["planner", "planner.html", "pin"]];
  function shell({ page, art, onAlliance, onLang }) {
    const tabs = $(".tabs"), bar = $(".bar");
    const link = ([key, href, icon], withIcon) => `<a href="${href}" data-nav="${key}"${key === page ? ' aria-current="page"' : ""}${href === "#" ? " data-soon" : ""}>${withIcon ? ico(icon) : ""}<span>${esc(HQ.nav.en[key])}</span></a>`;
    if (tabs) tabs.innerHTML = NAV.map(n => link(n, false)).join("");
    if (bar) bar.innerHTML = NAV.map(n => link(n, true)).join("");
    const langSel = $("#lang");
    langSel.innerHTML = HQ.languages.map(([c, n]) => `<option value="${c}" lang="${c}">${n}</option>`).join("");
    langSel.addEventListener("change", () => HQ.setLanguage(langSel.value));
    $$(".mock button").forEach(b => b.addEventListener("click", () => HQ.setAlliance(b.dataset.a)));
    document.addEventListener("click", e => {
      const a = e.target.closest("[data-soon]");
      if (!a) return;
      e.preventDefault();
      toast(`${a.textContent.trim()}: coming in the full build`);
    });
    function setMotto() {
      const a = HQ.alliances[document.documentElement.dataset.alliance];
      const m = $("#motto"); if (!m) return;
      m.textContent = a.motto ? (HQ.motto[document.documentElement.lang] || a.motto) : "";
    }
    document.addEventListener("hq:alliance", e => {
      const a = e.detail;
      document.title = `${a.tag} Alliance HQ`;
      $("#brandName").textContent = a.name;
      $("#allianceName").textContent = a.name;
      $("#brandInsignia").innerHTML = insignia(a.tag);
      const ti = $("#titleInsignia"); if (ti) ti.innerHTML = insignia(a.tag);
      $("#footBrand").textContent = a.brand;
      $("#groundArt").src = a.art[art] || a.art.hero;
      $$(".mock button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.a === a.tag)));
      setMotto();
      onAlliance && onAlliance(a);
    });
    document.addEventListener("hq:lang", e => {
      const { code, nav } = e.detail;
      langSel.value = code;
      $$("[data-nav]").forEach(a => { a.querySelector("span").textContent = nav[a.dataset.nav] || HQ.nav.en[a.dataset.nav]; });
      setMotto();
      onLang && onLang(e.detail);
    });
    HQ.init();
    tick(); setInterval(tick, 1000);
    return document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  }

  return { $, $$, esc, reduced, phone, ICONS, ico, plate, dot, insignia, rectOf, route, drawWires, fmtCountdown, humanWhen, toast, store, shell };
})();
