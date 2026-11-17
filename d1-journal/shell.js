/* d1-journal shell: shared by home, calc and planner. Header strip, nav, language, mock pill, torn edges, icons.
 * Data comes from HQ (../shared/hq.js). Page scripts register their own hq:alliance / hq:lang listeners, then call HQ.init(). */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- torn paper edges: four tear profiles, seeded so each sheet is its own ---------- */
  function rng(seed) { let t = seed * 2654435761 >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  // profiles: 0 fine tear, 1 rough tear, 2 cut top edge + torn rest, 3 ragged with one deep notch on the bottom edge
  function tear(seed, scale = 1) {
    const r = rng(seed), profile = seed % 4;
    const amp = [4, 9, 6, 7][profile] * scale, n = [14, 7, 10, 9][profile];
    const j = () => (r() - .5) * 2 * amp;
    const top = i => profile === 2 ? 0 : Math.max(0, j() + amp / 2);
    const bottom = i => {
      const base = Math.max(0, j() + amp / 2);
      return profile === 3 && i === Math.floor(n * .7) ? base + amp * 2.2 : base;
    };
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(`calc(${(i / n * 100).toFixed(1)}% + ${j().toFixed(1)}px) ${top(i).toFixed(1)}px`);
    for (let i = 1; i < n; i++) pts.push(`calc(100% - ${Math.max(0, j() + amp / 2).toFixed(1)}px) calc(${(i / n * 100).toFixed(1)}% + ${j().toFixed(1)}px)`);
    for (let i = n; i >= 0; i--) pts.push(`calc(${(i / n * 100).toFixed(1)}% + ${j().toFixed(1)}px) calc(100% - ${bottom(i).toFixed(1)}px)`);
    for (let i = n - 1; i > 0; i--) pts.push(`${Math.max(0, j() + amp / 2).toFixed(1)}px calc(${(i / n * 100).toFixed(1)}% + ${j().toFixed(1)}px)`);
    return `polygon(${pts.join(",")})`;
  }
  let auto = 0;
  function tearAll(root = document) {
    root.querySelectorAll(".torn").forEach(el => {
      if (!el.dataset.seed) el.dataset.seed = String(300 + (auto++) * 7);
      el.style.setProperty("--tear", tear(Number(el.dataset.seed), el.classList.contains("strip") || el.classList.contains("slip") ? .8 : 1));
    });
    root.querySelectorAll(".brush-line, .brush-sub, .brush-cap").forEach((el, i) => { if (!el.style.getPropertyValue("--tear")) el.style.setProperty("--tear", tear(101 + i * 4, 1.3)); });
  }

  /* ---------- nav + language ---------- */
  const page = document.body.dataset.page || "home";
  const links = [["home", "home.html"], ["season", "#"], ["tips", "#"], ["tools", "calc.html"], ["planner", "planner.html"]];
  function drawNav(labels) {
    const html = links.map(([k, href]) => `<a href="${href}" ${k === page ? 'aria-current="page"' : ""} ${href === "#" ? "data-soon" : ""}>${esc(labels[k])}</a>`).join("");
    $("#navTop").innerHTML = html; $("#navBottom").innerHTML = html;
    document.querySelectorAll("[data-nav]").forEach(el => { el.textContent = labels[el.dataset.nav]; });
  }
  function drawLangList(current) {
    $("#langList").innerHTML = HQ.languages.map(([code, name]) =>
      `<li role="option" aria-selected="${code === current}"><button type="button" data-code="${code}" lang="${code}" aria-selected="${code === current}">${esc(name)}</button></li>`).join("");
    $("#langName").textContent = (HQ.languages.find(l => l[0] === current) || HQ.languages[0])[1];
  }
  const langBtn = $("#langBtn"), langList = $("#langList");
  function closeLang() { langList.hidden = true; langBtn.setAttribute("aria-expanded", "false"); }
  langBtn.addEventListener("click", () => { const open = langList.hidden; langList.hidden = !open; langBtn.setAttribute("aria-expanded", String(open)); if (open) langList.querySelector("[aria-selected='true']")?.focus(); });
  langList.addEventListener("click", e => { const b = e.target.closest("button[data-code]"); if (!b) return; HQ.setLanguage(b.dataset.code); closeLang(); langBtn.focus(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !langList.hidden) { closeLang(); langBtn.focus(); } });
  document.addEventListener("click", e => { if (!e.target.closest("#lang")) closeLang(); });

  /* ---------- "Coming in the full build" for Season and Tips ---------- */
  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-soon]"); if (!a) return;
    e.preventDefault();
    const msg = $("#soonMsg"); if (!msg) return;
    msg.textContent = "Coming in the full build.";
    msg.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  /* ---------- brand strip + mock pill ---------- */
  function drawBrand(a) {
    document.title = `${a.title} HQ`;
    $("#tagStamp").textContent = a.tag;
    $("#brandName").textContent = a.name;
    const fb = $("#footBrand"); if (fb) fb.textContent = a.brand;
    document.querySelectorAll(".mock button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.a === a.tag)));
    drawMotto();
  }
  function drawMotto() {
    const a = HQ.alliances[document.documentElement.dataset.alliance];
    const el = $("#brandMotto"); if (!el || !a) return;
    el.textContent = a.motto ? (HQ.motto[document.documentElement.lang] || a.motto) : "";
  }
  document.addEventListener("hq:alliance", e => drawBrand(e.detail));
  document.addEventListener("hq:lang", e => { drawNav(e.detail.nav); drawLangList(e.detail.code); drawMotto(); });
  document.querySelectorAll(".mock button").forEach(b => b.addEventListener("click", () => HQ.setAlliance(b.dataset.a)));

  window.Journal = { $, esc, tear, tearAll, pad: n => String(n).padStart(2, "0") };
})();
