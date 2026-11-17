/* d2-command shared: drawn SVG defs, the HUD chrome, language dialog, toast, mock pill. Pages call D2.onAlliance / D2.onLang then D2.start(). */
window.D2 = (function () {
  "use strict";
  const $ = (s, root) => (root || document).querySelector(s);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const SVGNS = "http://www.w3.org/2000/svg";
  const svgUse = (id, cls, label) => {
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    if (cls) svg.setAttribute("class", cls);
    if (label) { svg.setAttribute("role", "img"); svg.setAttribute("aria-label", label); } else svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVGNS, "use");
    use.setAttribute("href", "#" + id);
    svg.append(use);
    return svg;
  };

  /* ---------- drawn symbols: insignia, HQ shield, emblems, resources ---------- */
  const DEFS = `<svg class="defs" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="g-iron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aeb4ba"/><stop offset="1" stop-color="#5d646b"/></linearGradient>
    <linearGradient id="g-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d3d8dc"/><stop offset="1" stop-color="#737b82"/></linearGradient>
    <linearGradient id="g-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6bb5e"/><stop offset="1" stop-color="#9a6d22"/></linearGradient>
    <linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d97c"/><stop offset=".55" stop-color="#d4a53f"/><stop offset="1" stop-color="#a7772a"/></linearGradient>
    <linearGradient id="g-accent" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent-hi)"/><stop offset="1" stop-color="var(--accent-lo)"/></linearGradient>
    <linearGradient id="g-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9ad6a"/><stop offset="1" stop-color="#9a6a35"/></linearGradient>
    <linearGradient id="g-volt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe88a"/><stop offset="1" stop-color="#e0a020"/></linearGradient>
    <linearGradient id="g-crystal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6bdff"/><stop offset="1" stop-color="#6a3fb0"/></linearGradient>
    <path id="chev" d="M14 42 L32 26 L50 42 L50 51 L32 35 L14 51 Z"/>
    <path id="shield" d="M32 4 L57 12 V32 C57 46.5 45.5 57 32 61 C18.5 57 7 46.5 7 32 V12 Z"/>
    <symbol id="r1" viewBox="0 0 64 64"><use href="#chev" fill="url(#g-iron)" stroke="#111315" stroke-width="2" stroke-linejoin="round"/></symbol>
    <symbol id="r2" viewBox="0 0 64 64"><g fill="url(#g-steel)" stroke="#111315" stroke-width="2" stroke-linejoin="round"><use href="#chev" y="-7"/><use href="#chev" y="5"/></g></symbol>
    <symbol id="r3" viewBox="0 0 64 64"><g fill="url(#g-brass)" stroke="#111315" stroke-width="2" stroke-linejoin="round"><use href="#chev" y="-13"/><use href="#chev" y="-1"/><use href="#chev" y="11"/></g></symbol>
    <symbol id="r4" viewBox="0 0 64 64">
      <use href="#shield" fill="#22262a" stroke="#111315" stroke-width="2.5" stroke-linejoin="round"/>
      <use href="#shield" fill="none" stroke="url(#g-brass)" stroke-width="3" transform="translate(32 32) scale(.86) translate(-32 -32)"/>
      <g fill="url(#g-brass)" stroke="#111315" stroke-width="1.5" stroke-linejoin="round" transform="translate(32 33) scale(.62) translate(-32 -32)"><use href="#chev" y="-12"/><use href="#chev" y="0"/><use href="#chev" y="12"/></g>
    </symbol>
    <symbol id="r5" viewBox="0 0 64 64">
      <use href="#shield" fill="#22262a" stroke="#111315" stroke-width="2.5" stroke-linejoin="round"/>
      <use href="#shield" fill="none" stroke="url(#g-gold)" stroke-width="3" transform="translate(32 32) scale(.86) translate(-32 -32)"/>
      <path d="M15 44 C10 36 10 26 15 19" fill="none" stroke="url(#g-gold)" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="3.5 3"/>
      <path d="M49 44 C54 36 54 26 49 19" fill="none" stroke="url(#g-gold)" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="3.5 3"/>
      <polygon points="32,15 36.4,25.8 48,26.6 39,34 41.9,45.4 32,39.2 22.1,45.4 25,34 16,26.6 27.6,25.8" fill="url(#g-gold)" stroke="#111315" stroke-width="1.5" stroke-linejoin="round"/>
    </symbol>
    <symbol id="hq" viewBox="0 0 64 64">
      <use href="#shield" fill="url(#g-accent)" stroke="#111315" stroke-width="2.5" stroke-linejoin="round"/>
      <use href="#shield" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2" transform="translate(32 32) scale(.86) translate(-32 -32)"/>
    </symbol>
    <symbol id="slot-brass" viewBox="0 0 64 64"><use href="#shield" fill="url(#g-brass)" stroke="#111315" stroke-width="2.5" stroke-linejoin="round"/></symbol>
    <symbol id="slot-iron" viewBox="0 0 64 64"><use href="#shield" fill="#2a2f33" stroke="#111315" stroke-width="2.5" stroke-linejoin="round"/><use href="#shield" fill="none" stroke="url(#g-iron)" stroke-width="2.5" transform="translate(32 32) scale(.84) translate(-32 -32)"/></symbol>
    <symbol id="x" viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></symbol>
    <symbol id="ev-swords" viewBox="0 0 64 64"><g stroke="#111315" stroke-width="2" stroke-linejoin="round"><path d="M12 12 L46 46 L52 40 L18 6 Z" fill="url(#g-steel)"/><path d="M52 12 L18 46 L12 40 L46 6 Z" fill="url(#g-steel)"/><path d="M40 52 L46 46 L52 52 L46 58 Z M24 52 L18 46 L12 52 L18 58 Z" fill="url(#g-brass)"/></g></symbol>
    <symbol id="ev-barrel" viewBox="0 0 64 64"><path d="M16 8 H48 L53 32 L48 56 H16 L11 32 Z" fill="url(#g-iron)" stroke="#111315" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 22 H52 M12 42 H52" stroke="#111315" stroke-width="3"/><path d="M32 24 C26 31 25 36 32 41 C39 36 38 31 32 24 Z" fill="#0c0d0e"/></symbol>
    <symbol id="ev-skull" viewBox="0 0 64 64"><path d="M32 6 C18 6 10 16 10 28 C10 36 14 40 18 44 V54 H46 V44 C50 40 54 36 54 28 C54 16 46 6 32 6 Z" fill="url(#g-steel)" stroke="#111315" stroke-width="2.5" stroke-linejoin="round"/><circle cx="24" cy="30" r="5" fill="#111315"/><circle cx="40" cy="30" r="5" fill="#111315"/><path d="M29 42 h6 l-3 -5 z" fill="#111315"/><path d="M24 54 v-6 M32 54 v-6 M40 54 v-6" stroke="#111315" stroke-width="2.5"/></symbol>
    <symbol id="ic-crystal" viewBox="0 0 64 64"><path d="M32 4 L50 22 L32 60 L14 22 Z" fill="url(#g-crystal)" stroke="#111315" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 22 H50 M32 4 L24 22 L32 60 M32 4 L40 22 L32 60" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/></symbol>
    <symbol id="ic-clock" viewBox="0 0 64 64"><path d="M4 26 H14 M2 34 H14 M4 42 H14" stroke="url(#g-brass)" stroke-width="3.5" stroke-linecap="round"/><path d="M26 8 H40 M33 4 V12" stroke="#111315" stroke-width="4.5" stroke-linecap="round"/><circle cx="34" cy="34" r="23" fill="url(#g-steel)" stroke="#111315" stroke-width="2.5"/><circle cx="34" cy="34" r="17" fill="#1c1f22"/><path d="M34 22 V34 L43 40" stroke="url(#g-gold)" stroke-width="4" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="ic-wood" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#6b3f1f" stroke="#111315" stroke-width="2.5"/><circle cx="32" cy="32" r="19" fill="url(#g-wood)"/><circle cx="32" cy="32" r="12" fill="none" stroke="#8c5e2c" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="#8c5e2c"/><path d="M32 13 L34 24" stroke="#6b3f1f" stroke-width="2"/></symbol>
    <symbol id="ic-iron" viewBox="0 0 64 64"><path d="M8 46 L17 20 H47 L56 46 Z" fill="url(#g-steel)" stroke="#111315" stroke-width="2.5" stroke-linejoin="round"/><path d="M17 20 H47 L43 28 H21 Z" fill="rgba(255,255,255,.28)"/><path d="M10 46 H54" stroke="#111315" stroke-width="2"/></symbol>
    <symbol id="ic-volt" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#2a2f33" stroke="#111315" stroke-width="2.5"/><path d="M36 8 L18 36 H30 L27 56 L46 27 H34 Z" fill="url(#g-volt)" stroke="#111315" stroke-width="2" stroke-linejoin="round"/></symbol>
    <symbol id="ic-coin" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="url(#g-gold)" stroke="#111315" stroke-width="2.5"/><circle cx="32" cy="32" r="18" fill="none" stroke="#8a6220" stroke-width="3"/><path d="M32 18 L39 32 L32 46 L25 32 Z" fill="#8a6220"/></symbol>
    <symbol id="ic-badge" viewBox="0 0 64 64"><path d="M20 3 H44 L37 28 H27 Z" fill="#a83b2a" stroke="#111315" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="42" r="18" fill="url(#g-brass)" stroke="#111315" stroke-width="2.5"/><polygon points="32,31 34.6,37.6 41.5,38 36.2,42.4 38,49.2 32,45.5 26,49.2 27.8,42.4 22.5,38 29.4,37.6" fill="#5c3f10"/></symbol>
    <symbol id="ic-lock" viewBox="0 0 64 64"><path d="M21 30 V20 a11 11 0 0 1 22 0 V30" fill="none" stroke="url(#g-iron)" stroke-width="6"/><rect x="13" y="28" width="38" height="30" rx="3" fill="url(#g-steel)" stroke="#111315" stroke-width="2.5"/><circle cx="32" cy="42" r="4.5" fill="#111315"/><path d="M32 44 V51" stroke="#111315" stroke-width="4" stroke-linecap="round"/></symbol>
  </defs></svg>`;
  document.body.insertAdjacentHTML("afterbegin", DEFS);

  // One orchestrated moment: panels slot in once, staggered by --i. A transition, not an animation, so nothing stays composited afterwards.
  const root = document.documentElement;
  root.classList.add("is-staging");
  requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add("is-ready"); root.classList.remove("is-staging"); }));

  /* ---------- toast ---------- */
  const toast = $("#toast");
  let toastTimer;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  document.addEventListener("click", (e) => {
    const soon = e.target.closest("[data-soon]");
    if (!soon) return;
    e.preventDefault();
    say(`${soon.dataset.soon}: coming in the full build.`);
  });

  /* ---------- chrome state ---------- */
  let alliance = null, lang = "en";
  const subs = { alliance: [], lang: [] };
  const pageTitle = document.body.dataset.title || "";
  const groundKey = document.body.dataset.ground || "hero";

  function renderChrome(a) {
    document.title = pageTitle ? `${pageTitle}, ${a.brand}` : a.brand;
    const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
    set("hqTag", a.tag); set("allianceName", a.name); set("brand", a.brand);
    const g = $("#groundArt"); if (g) g.src = a.art[groundKey] || a.art.hero;
    renderMotto();
    document.querySelectorAll(".mock [data-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.set === a.tag)));
  }
  function renderMotto() {
    const m = $("#motto"); if (!m || !alliance) return;
    m.textContent = alliance.motto ? (alliance.tag === "DGF" && HQ.motto[lang] ? HQ.motto[lang] : alliance.motto) : "";
  }
  function renderNav(nav) {
    document.querySelectorAll("[data-nav]").forEach((n) => {
      const label = nav[n.dataset.nav];
      if (!label) return;
      (n.querySelector("b") || n).textContent = label;
    });
  }

  /* ---------- language dialog ---------- */
  const dlg = $("#langDlg"), grid = $("#langGrid"), langBtn = $("#langBtn");
  function renderLangGrid() {
    grid.textContent = "";
    for (const [code, name] of HQ.languages) {
      const b = el("button", `btn ${code === lang ? "btn-green" : "btn-steel"}`, name);
      b.type = "button"; b.lang = code; b.dataset.code = code;
      if (code === lang) b.setAttribute("aria-current", "true");
      b.addEventListener("click", () => { HQ.setLanguage(code); dlg.close(); });
      grid.append(b);
    }
  }
  if (dlg) {
    langBtn.addEventListener("click", () => { renderLangGrid(); dlg.showModal(); });
    $("#langClose").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  }

  document.querySelectorAll(".mock [data-set]").forEach((b) => b.addEventListener("click", () => HQ.setAlliance(b.dataset.set)));

  document.addEventListener("hq:alliance", (e) => { alliance = e.detail; renderChrome(alliance); subs.alliance.forEach((f) => f(alliance)); });
  document.addEventListener("hq:lang", (e) => {
    lang = e.detail.code;
    renderNav(e.detail.nav);
    if (langBtn) { langBtn.textContent = (HQ.languages.find(([c]) => c === lang) || ["en", "English"])[1]; langBtn.lang = lang; }
    renderMotto();
    subs.lang.forEach((f) => f(e.detail));
  });

  /* ---------- small helpers for pages ---------- */
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable: values live for the session only */ } },
    del(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
  };
  const int = (v, max = 1e9) => { const n = Math.floor(Number(String(v).replace(/[^\d]/g, ""))); return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0; };

  return {
    $, el, svgUse, say, store, int,
    onAlliance(f) { subs.alliance.push(f); }, onLang(f) { subs.lang.push(f); },
    get alliance() { return alliance; }, get lang() { return lang; },
    start() { HQ.init(); }
  };
})();
