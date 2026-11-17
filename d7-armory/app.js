/* d7 Armory Grid: shared shell (nav, picker, bottom bar, status, mock pill), pictograms and helpers.
 * Data and logic come from ../shared/hq.js. Pages: home, calc, planner. */
(function () {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = (id) => document.getElementById(id);

  /* ---------- filled pictograms (viewBox 0 0 24 24) ---------- */
  const PICT = {
    // event kinds
    bgb: '<path d="M12 1.5 19.5 6l2 8.5L15 22.5l-8-1.5-5.5-8L4.5 5z"/>',
    settlement: '<path d="M8.5 22.5 3.5 10l5.5-8.5 4.5 9z"/><path d="M14.5 22.5l-2-9.5 5-7.5 5 10z"/>',
    battle: '<path d="M12 1.5 21.5 5v6.2c0 5.3-4 9.4-9.5 11.3C6.5 20.6 2.5 16.5 2.5 11.2V5z"/>',
    invasion: '<path d="M2 4h5.5l6 8-6 8H2l6-8z"/><path d="M11 4h5.5l6 8-6 8H11l6-8z"/>',
    // nav
    home: '<path d="M3 3h13l5 5v13H3z"/>',
    season: '<path d="M4 2h3v20H4z"/><path d="M8 3h13l-3.5 4.5L21 12H8z"/>',
    tips: '<path d="M3 4h8v16H3z"/><path d="M13 4h8v16h-8z"/>',
    tools: '<path d="M3 3h18v6H3z"/><path d="M3 11h5v4H3z M9.5 11h5v4h-5z M16 11h5v10h-5z M3 17h5v4H3z M9.5 17h5v4h-5z"/>',
    planner: '<path fill-rule="evenodd" d="M12 1.5a7.5 7.5 0 0 0-7.5 7.5c0 5.5 7.5 13.5 7.5 13.5S19.5 14.5 19.5 9A7.5 7.5 0 0 0 12 1.5zm0 10.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>',
    // resources
    wood: '<path d="M2 7h13v10H2z"/><circle cx="17" cy="12" r="5.5"/><circle cx="17" cy="12" r="2.2" fill="var(--ground)"/>',
    iron: '<path d="M6.5 6h11l4 12h-19z"/><path d="M8 8.5h8l1 3H7z" fill="var(--ground)" opacity=".5"/>',
    electricity: '<path d="M13.5 1.5 3.5 14h6.5L8.5 22.5 20.5 9.5H14z"/>',
    coin: '<circle cx="12" cy="12" r="10.5"/><circle cx="12" cy="12" r="6.5" fill="var(--ground)"/><circle cx="12" cy="12" r="3.5"/>',
    badges: '<path d="M12 1.5l2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 15.2l-5.4 3 1.2-6.1L3.3 7.9l6.1-.8z"/>',
    crystals: '<path d="M8.5 22.5 3.5 10l5.5-8.5 4.5 9z"/><path d="M14.5 22.5l-2-9.5 5-7.5 5 10z"/>',
    speedup: '<circle cx="12" cy="12" r="10.5"/><path d="M12 12V3.5A8.5 8.5 0 0 1 20.5 12z" fill="var(--ground)" opacity=".75"/><path d="M11 6h2v6.6l4 2.4-1 1.7-5-3z" fill="var(--ground)"/>',
    swap: '<path d="M3 7h13l-3-3 1.5-1.5L20 8l-5.5 5.5L13 12l3-3H3z"/><path d="M21 17H8l3 3-1.5 1.5L4 16l5.5-5.5L11 12l-3 3h13z"/>',
    lang: '<path d="M2 3h13v9H8l-4 3v-3H2z"/><path d="M17 8h5v9h-2v3l-4-3h-6v-3h7z"/>'
  };
  const pict = (name, cls = "pict") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${PICT[name] || ""}</svg>`;

  /* ---------- state ---------- */
  const page = document.body.dataset.page || "home";
  let A = HQ.alliances[HQ.currentAlliance()];
  let lang = localStorage.getItem("hq-mock-lang") || "en";

  /* ---------- shell ---------- */
  function navItems() {
    const n = HQ.nav[lang] || HQ.nav.en;
    return [
      ["home", "home.html", n.home, "home"], ["season", "#", n.season, "season", true], ["tips", "#", n.tips, "tips", true],
      ["tools", "calc.html", n.tools, "calc"], ["planner", "planner.html", n.planner, "planner"]
    ];
  }
  function renderShell() {
    const shell = $("shell");
    if (!shell.dataset.built) {
      shell.innerHTML = `
        <a class="skip" href="#main">Skip to content</a>
        <header class="top">
          <a class="brand" href="home.html"><span class="tagplate" id="brandTag"></span><span class="brandname" id="brandName"></span></a>
          <nav class="tabs" aria-label="Main"><ul id="nav" role="list"></ul></nav>
          <div class="lang">
            <label class="vh" for="lang">Language</label>
            <span class="langwrap">${pict("lang", "lang-pict")}<span class="langname" id="langName" aria-hidden="true"></span><select id="lang"></select></span>
          </div>
        </header>
        <p class="status" id="status" role="status" aria-live="polite"></p>`;
      const bar = document.createElement("nav");
      bar.className = "bar"; bar.id = "bar"; bar.setAttribute("aria-label", "Main");
      document.body.append(bar);
      const mock = document.createElement("div");
      mock.className = "mock"; mock.setAttribute("aria-label", "Mock controls");
      mock.innerHTML = `Mock · Alliance: <button type="button" data-mock="DGF">DGF</button> | <button type="button" data-mock="GIR">GIR</button>`;
      document.body.append(mock);
      const sel = $("lang");
      sel.innerHTML = HQ.languages.map(([c, label]) => `<option value="${c}" lang="${c}">${esc(label)}</option>`).join("");
      sel.addEventListener("change", (e) => HQ.setLanguage(e.target.value));
      shell.dataset.built = "1";
    }
    $("brandTag").textContent = A.tag;
    $("brandName").textContent = A.name;
    document.querySelectorAll("[data-mock]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mock === A.tag)));
    renderNav();
  }
  function renderNav() {
    const items = navItems();
    $("nav").innerHTML = items.map(([k, href, label, p, soon]) =>
      `<li><a class="tab" href="${href}" ${p === page ? 'aria-current="page"' : ""} ${soon ? 'data-soon="1"' : ""}>${esc(label)}</a></li>`).join("");
    $("bar").innerHTML = `<ul role="list">${items.map(([k, href, label, p, soon]) =>
      `<li><a class="bar-item" href="${href}" ${p === page ? 'aria-current="page"' : ""} ${soon ? 'data-soon="1"' : ""}>${pict(k)}<span>${esc(label)}</span></a></li>`).join("")}</ul>`;
    const sel = $("lang"); sel.value = lang;
    $("langName").textContent = (HQ.languages.find(([c]) => c === lang) || HQ.languages[0])[1];
  }

  /* ---------- status line ---------- */
  let statusTimer;
  function say(msg, ms = 2800) {
    const s = $("status");
    s.textContent = msg; s.classList.add("show");
    clearTimeout(statusTimer); statusTimer = setTimeout(() => s.classList.remove("show"), ms);
  }

  /* ---------- countdown ---------- */
  function parts(ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
  }
  const two = (n) => String(n).padStart(2, "0");
  function countHTML(ms) {
    const p = parts(ms);
    return `${p.d ? `<span class="d">${p.d}d</span>` : ""}<span class="g">${two(p.h)}</span><span class="sep">:</span><span class="g">${two(p.m)}</span><span class="sep">:</span><span class="g">${two(p.s)}</span>`;
  }
  function countText(ms) { const p = parts(ms); return `${p.d ? p.d + " days " : ""}${two(p.h)}:${two(p.m)}:${two(p.s)}`; }
  function tick() {
    const now = Date.now();
    document.querySelectorAll("[data-target]").forEach((el) => {
      const ms = Number(el.dataset.target) - now;
      el.innerHTML = countHTML(ms); el.setAttribute("aria-label", countText(ms));
    });
  }

  /* ---------- storage ---------- */
  const store = {
    get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; } },
    set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch { return false; } }
  };
  const num = (v) => { const n = Number(String(v).replace(/[,\s]/g, "")); return Number.isFinite(n) && n >= 0 ? Math.min(n, 1e12) : 0; };

  /* ---------- footer ---------- */
  function footer(extra = "") {
    return `<p id="footBrand">${esc(A.brand)}</p>
      <p>Unofficial Dark War: Survival community guide created by AI pilot Madkeewee.</p>
      ${extra}<a class="totop" href="#main">Back to top</a>`;
  }

  /* ---------- global events ---------- */
  document.addEventListener("click", (ev) => {
    const soon = ev.target.closest("[data-soon]");
    if (soon) { ev.preventDefault(); say("Coming in the full build"); return; }
    const mock = ev.target.closest("[data-mock]");
    if (mock) HQ.setAlliance(mock.dataset.mock);
  });
  document.addEventListener("hq:alliance", (e) => { A = e.detail; renderShell(); document.dispatchEvent(new CustomEvent("d7:alliance", { detail: A })); });
  document.addEventListener("hq:lang", (e) => { lang = e.detail.code; renderNav(); document.dispatchEvent(new CustomEvent("d7:lang", { detail: { code: lang } })); });

  window.D7 = { esc, $, pict, PICT, say, countHTML, countText, tick, parts, store, num, footer,
    get A() { return A; }, get lang() { return lang; }, renderShell };
  renderShell();
  setInterval(tick, 1000);
})();
