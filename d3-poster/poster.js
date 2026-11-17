/* d3-poster · shared chrome for home, calc and planner. Data and logic come from ../shared/hq.js (window.HQ). */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = n => String(n).padStart(2, "0");
  const allianceCbs = [], langCbs = [];

  function portraitHTML(a, name, index) {
    if (a.tag === "GIR") {
      const src = index === -1 ? a.art.r5Portrait : a.art.portraits[name];
      return src ? `<img src="${src}" alt="" width="77" height="77">` : "";
    }
    if (name === "Nínna") return `<img src="${a.art.ninna}" alt="" width="288" height="288">`;
    const cell = index + 1; // r5 = cell 0, r4[i] = cell i + 1 on the 4x3 sheet
    const x = (cell % 4) * 100 / 3, y = Math.floor(cell / 4) * 50;
    return `<span class="sprite" style="display:block;width:100%;height:100%;background:url('${a.art.sprite}') ${x}% ${y}% / 400% 300% no-repeat"></span>`;
  }

  function currentAlliance() { return HQ.alliances[document.documentElement.dataset.alliance || "DGF"]; }

  /* ---------- chrome ---------- */
  function renderChrome(a) {
    document.title = `${a.brand}: ${document.body.dataset.page || "HQ"}`;
    document.querySelectorAll("[data-brand]").forEach(el => { el.textContent = a.brand; });
    const rail = $("rail");
    if (rail) rail.innerHTML = Array.from({ length: 120 }, () => `<span>${esc(a.tag)}</span>`).join("");
    document.querySelectorAll(".mock button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.a === a.tag)));
  }

  const sel = $("lang");
  if (sel) {
    sel.innerHTML = HQ.languages.map(([code, name]) => `<option value="${code}" lang="${code}">${esc(name)}</option>`).join("");
    sel.addEventListener("change", () => HQ.setLanguage(sel.value));
  }

  document.addEventListener("hq:lang", e => {
    const { code, nav } = e.detail;
    if (sel) sel.value = code;
    document.querySelectorAll("[data-nav]").forEach(el => { el.textContent = nav[el.dataset.nav] || el.textContent; });
    langCbs.forEach(fn => fn(code, nav));
  });
  document.addEventListener("hq:alliance", e => { renderChrome(e.detail); allianceCbs.forEach(fn => fn(e.detail)); });

  // Season and Tips are out of scope: say so, once, near the link.
  document.querySelectorAll("[data-soon]").forEach(el => el.addEventListener("click", ev => {
    ev.preventDefault();
    const id = (el.getAttribute("href") || "").slice(1);
    const target = document.getElementById(id);
    const local = target && target.querySelector(".soon");
    const out = local || $("soon");
    if (out) out.textContent = "Coming in the full build.";
    if (target && target !== el && local) target.scrollIntoView({ block: "center" });
  }));

  document.querySelectorAll(".mock button").forEach(b => b.addEventListener("click", () => HQ.setAlliance(b.dataset.a)));

  window.Poster = {
    esc, pad, portraitHTML, currentAlliance,
    onAlliance(fn) { allianceCbs.push(fn); },
    onLang(fn) { langCbs.push(fn); },
    // Status line for copy confirmations and similar; one per page.
    say(text) { const s = $("status"); if (s) s.textContent = text; }
  };

  // Page scripts run before DOMContentLoaded (scripts sit at the end of body), so init fires after they register.
  document.addEventListener("DOMContentLoaded", () => HQ.init());
})();
