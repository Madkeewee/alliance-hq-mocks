/* d5 Region Map: shared shell for home, calc and planner. Data and logic come from window.HQ (never edited). */
window.D5 = (function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const svgNS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, text) => {
    const n = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  };
  const h = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const phone = () => window.matchMedia("(max-width: 899px)").matches;

  // One drawn glyph set for the whole direction: filled, flat, on the bone ink. Used with <use href="#sym-…">.
  const SPRITE = `<svg hidden aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <symbol id="sym-pennant" viewBox="0 0 44 56"><path d="M2 2h40v38L22 54 2 40z" fill="var(--pennant, var(--ally))" stroke="var(--bone)" stroke-width="2.5" stroke-linejoin="round"/></symbol>
  <symbol id="sym-mine" viewBox="-12 -12 24 24"><path d="M0-10 10 0 0 10-10 0z" fill="var(--bone)"/></symbol>
  <symbol id="sym-boost" viewBox="-14 -14 28 28"><path d="M0-12 12 0 0 12-12 0z" fill="none" stroke="var(--amber)" stroke-width="2.5"/><path d="M0-6 6 0 0 6-6 0z" fill="var(--bone)"/></symbol>
  <symbol id="sym-pass" viewBox="-10 -12 20 24"><rect x="-8" y="-10" width="5" height="20" fill="var(--bone)"/><rect x="3" y="-10" width="5" height="20" fill="var(--bone)"/></symbol>
  <symbol id="sym-post" viewBox="-8 -8 16 16"><rect x="-6" y="-6" width="12" height="12" fill="var(--bone)" fill-opacity=".8"/></symbol>
  <symbol id="sym-lock" viewBox="0 0 16 18"><rect x="2" y="7" width="12" height="10" rx="1" fill="currentColor"/><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
  <symbol id="sym-wood" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--ink)"/><path d="M6 12h14a6 6 0 0 1 0 12H6z" fill="var(--bone)"/><circle cx="20" cy="18" r="6" fill="var(--bone)" stroke="var(--ink)" stroke-width="1.5"/><circle cx="20" cy="18" r="3" fill="none" stroke="var(--ink)" stroke-width="1.5"/><circle cx="20" cy="18" r=".9" fill="var(--ink)"/></symbol>
  <symbol id="sym-iron" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--ink)"/><path d="M8 20l3-8h10l3 8z" fill="var(--bone)"/><path d="M8 20h16v3H8z" fill="var(--bone-2)"/><path d="M12.5 14h7" stroke="var(--ink)" stroke-width="1.5"/></symbol>
  <symbol id="sym-electricity" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--ink)"/><path d="M18 5 8 18h7l-1 9 10-13h-7z" fill="var(--amber)"/></symbol>
  <symbol id="sym-coin" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--ink)"/><circle cx="16" cy="16" r="10" fill="var(--gold)"/><circle cx="16" cy="16" r="6.5" fill="none" stroke="var(--ink)" stroke-width="1.5"/><path d="M16 11v10M13 13.5h5M13 18.5h5" stroke="var(--ink)" stroke-width="1.5"/></symbol>
  <symbol id="sym-badge" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--ink)"/><path d="M8 7h16v11c0 4-4 7-8 9-4-2-8-5-8-9z" fill="var(--bone)"/><path d="M16 11l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="var(--ink)"/></symbol>
  <symbol id="sym-crystal" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--ink)"/><path d="M16 4l7 9-7 15-7-15z" fill="var(--bone)"/><path d="M9 13h14M16 4v24M12.5 13l3.5 15 3.5-15" fill="none" stroke="var(--ink)" stroke-width="1.2"/></symbol>
  <symbol id="sym-clock" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--ink)"/><circle cx="16" cy="17" r="10" fill="var(--bone)"/><path d="M16 17V9A8 8 0 0 1 24 17z" fill="var(--amber)"/><path d="M16 17l-5 3" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/><rect x="13" y="4" width="6" height="3" fill="var(--bone)"/></symbol>
  <symbol id="sym-scales" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="var(--ink)"/><path d="M8 10q8 4 16 0v4q-8 4-16 0z M8 17q8 4 16 0v4q-8 4-16 0z" fill="var(--bone)"/></symbol>
  <symbol id="sym-star" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 17l-6.5 4 2-7.5L2 9h7z" fill="currentColor"/></symbol>
</svg>`;

  const PAGES = { home: "home.html", season: "#", tips: "#", tools: "calc.html", planner: "planner.html" };
  let A = null, lang = localStorage.getItem("hq-mock-lang") || "en";
  const allianceFns = [], langFns = [];

  function brand() {
    $$("[data-brand-tag]").forEach(n => { n.textContent = A.tag; });
    $$("[data-brand-name]").forEach(n => { n.textContent = A.name; });
    $$("[data-brand-brand]").forEach(n => { n.textContent = A.brand; });
    $$("[data-brand-motto]").forEach(n => { n.textContent = A.motto ? (HQ.motto[lang] || A.motto) : HQ.season.game; n.hidden = false; });
    $$("[data-art]").forEach(img => { img.src = A.art[img.dataset.art] || A.art.hero; });
    $$(".mock button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.a === A.tag)));
  }
  function navLabels(nav) {
    $$("[data-nav]").forEach(n => {
      const key = n.dataset.nav, label = nav[key] || HQ.nav.en[key];
      const span = n.querySelector("span.l"); (span || n).textContent = label;
    });
  }
  function soon(e) {
    e.preventDefault();
    const s = $("#soon"); if (!s) return;
    s.hidden = false; clearTimeout(s._t); s._t = setTimeout(() => { s.hidden = true; }, 2600);
  }

  function mount(page) {
    document.body.insertAdjacentHTML("afterbegin", SPRITE);
    document.body.dataset.page = page;
    const sel = $("#lang");
    if (sel) {
      sel.innerHTML = HQ.languages.map(([c, n]) => `<option value="${c}" lang="${c}">${n}</option>`).join("");
      sel.addEventListener("change", () => HQ.setLanguage(sel.value));
    }
    $$("[data-nav]").forEach(a => {
      const key = a.dataset.nav;
      if (PAGES[key] === "#") { a.setAttribute("href", "#"); a.addEventListener("click", soon); }
      else a.setAttribute("href", "./" + PAGES[key]);
      if (key === page) { a.classList.add("is-current"); a.setAttribute("aria-current", "page"); }
    });
    $$(".mock button").forEach(b => b.addEventListener("click", () => HQ.setAlliance(b.dataset.a)));
    document.addEventListener("hq:alliance", e => { A = e.detail; brand(); allianceFns.forEach(f => f(A)); });
    document.addEventListener("hq:lang", e => {
      lang = e.detail.code; navLabels(e.detail.nav);
      if (sel) sel.value = lang;
      if (A) brand();
      langFns.forEach(f => f(lang));
    });
    HQ.init();
  }

  /* countdown helpers shared by home */
  const pad = n => String(n).padStart(2, "0");
  function remain(at) {
    let s = Math.max(0, Math.floor((at - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const hh = Math.floor(s / 3600); s -= hh * 3600;
    const mm = Math.floor(s / 60); s -= mm * 60;
    return { d, text: `${pad(hh)}:${pad(mm)}:${pad(s)}` };
  }

  return {
    $, $$, el, h, esc, phone, mount, remain,
    alliance: () => A, lang: () => lang,
    onAlliance: f => allianceFns.push(f), onLang: f => langFns.push(f)
  };
})();
