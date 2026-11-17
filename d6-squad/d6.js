/* d6 Squad Select — shared chrome: rail labels, language, mock pill, portraits, drawn glyphs. Reads window.HQ, never edits it. */
(function () {
  "use strict";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = id => document.getElementById(id);

  /* ---------- drawn pieces (filled, two-tone) ---------- */
  const B = "#efe7d4", F = "#151a21";
  const glyphs = {
    wood: `<circle cx="12" cy="12" r="10" fill="${B}"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="${F}" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" fill="${F}"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="${F}" stroke-width="1.6"/>`,
    iron: `<path d="M3.5 17.5 7 6.5h10l3.5 11z" fill="${B}"/><path d="M8.5 9.5h7M7 13.5h10" stroke="${F}" stroke-width="1.5"/>`,
    electricity: `<circle cx="12" cy="12" r="10.5" fill="${B}"/><path d="M13.5 4 7 13.5h4.5l-1 6.5 6.5-9.5H12.5z" fill="${F}"/>`,
    coin: `<circle cx="12" cy="12" r="10.5" fill="${B}"/><circle cx="12" cy="12" r="7" fill="none" stroke="${F}" stroke-width="1.6"/><path d="M12 7.5v9M9.5 10h4a1.6 1.6 0 0 1 0 3.2h-3a1.6 1.6 0 0 0 0 3.2h4" fill="none" stroke="${F}" stroke-width="1.6"/>`,
    badge: `<path d="M12 1.5 21 5v6.2c0 5.2-3.8 8.9-9 11.3-5.2-2.4-9-6.1-9-11.3V5z" fill="${B}"/><path d="m12 7 1.5 3.2 3.5.4-2.6 2.4.7 3.5L12 14.8l-3.1 1.7.7-3.5L7 10.6l3.5-.4z" fill="${F}"/>`,
    crystal: `<path d="M12 1.5 21 9l-9 13.5L3 9z" fill="${B}"/><path d="M3 9h18M12 1.5 8.5 9l3.5 13.5L15.5 9z" fill="none" stroke="${F}" stroke-width="1.3"/>`,
    clock: `<circle cx="12" cy="12" r="10.5" fill="${B}"/><path d="M12 12V2.5A9.5 9.5 0 0 1 21.5 12z" fill="${F}" opacity=".3"/><circle cx="12" cy="12" r="1.6" fill="${F}"/><path d="M12 12V6M12 12l4 2.5" stroke="${F}" stroke-width="2.2" stroke-linecap="round"/>`,
    research: `<path d="M9 2h6v2h-1v6.2l5.3 9.2A2 2 0 0 1 17.6 22H6.4a2 2 0 0 1-1.7-2.6L10 10.2V4H9z" fill="${B}"/><path d="M8.2 16.5h7.6" stroke="${F}" stroke-width="1.6"/><circle cx="11" cy="19" r="1" fill="${F}"/><circle cx="14" cy="18" r=".8" fill="${F}"/>`,
    goal: `<circle cx="12" cy="12" r="10.5" fill="${B}"/><circle cx="12" cy="12" r="6.8" fill="${F}"/><circle cx="12" cy="12" r="3" fill="${B}"/>`,
    capture: `<path d="M5 2h2.4v20H5z" fill="${B}"/><path d="M7.4 3.5H20l-3.2 4.2L20 12H7.4z" fill="${B}"/><path d="M10 6h6" stroke="${F}" stroke-width="1.4"/>`,
    planner: `<path d="M3 5.5 9 3l6 2.5 6-2.5v15.5L15 21l-6-2.5L3 21z" fill="${B}"/><path d="M9 3v15.5M15 5.5V21" stroke="${F}" stroke-width="1.3"/>`,
    copy: `<rect x="8" y="3" width="13" height="15" fill="${B}"/><rect x="3" y="7" width="13" height="15" fill="${B}" stroke="${F}" stroke-width="1.4"/>`
  };
  const icon = (name, cls = "ico") => `<span class="${cls}" aria-hidden="true"><svg viewBox="0 0 24 24">${glyphs[name] || ""}</svg></span>`;
  const chevrons = n => {
    const rows = Array.from({ length: n }, (_, i) => `<path d="M1 ${5 + i * 5} l6 -4 l6 4" />`).join("");
    return `<svg width="14" height="${n * 5 + 4}" viewBox="0 0 14 ${n * 5 + 4}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">${rows}</svg>`;
  };
  const padlock = `<svg viewBox="0 0 40 48" aria-hidden="true"><rect x="4" y="20" width="32" height="26" fill="${B}"/><path d="M11 20v-7a9 9 0 0 1 18 0v7" fill="none" stroke="${B}" stroke-width="5"/><circle cx="20" cy="32" r="3.5" fill="${F}"/><rect x="18.5" y="33" width="3" height="7" fill="${F}"/></svg>`;
  const silhouette = `<svg class="sil" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="24" r="12" fill="${B}"/><path d="M8 64c2-16 12-24 24-24s22 8 24 24z" fill="${B}"/></svg>`;

  /* ---------- portraits ---------- */
  const fold = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9一-鿿]/g, "");
  function council(tag) {
    const A = HQ.alliances[tag];
    return [{ name: A.r5, rank: 5 }, ...A.r4.map(name => ({ name, rank: 4 }))].map((p, i) => ({ ...p, style: portraitStyle(tag, p, i) }));
  }
  function portraitStyle(tag, p, i) {
    const A = HQ.alliances[tag];
    if (tag === "DGF") {
      if (p.name === "Nínna") return `background-image:url(${A.art.ninna})`;
      const col = i % 4, row = Math.floor(i / 4);
      return `background-image:url(${A.art.sprite});background-size:400% 300%;background-position:${(col * 100) / 3}% ${row * 50}%`;
    }
    const src = p.rank === 5 ? A.art.r5Portrait : A.art.portraits[p.name];
    return src ? `background-image:url(${src})` : "";
  }
  /* Roster names are short forms; use a council portrait only when the name clearly matches, else a silhouette with the initial. */
  function portraitFor(tag, name) {
    const key = fold(name);
    if (key.length >= 4) {
      const hit = council(tag).find(p => { const k = fold(p.name); return k === key || k.includes(key) || key.includes(k); });
      if (hit && hit.style) return hit.style;
    }
    return "";
  }
  const cellHTML = (style, name, extra = "") => style
    ? `<span class="cell ${extra}"><span class="portrait" style="${style}"></span></span>`
    : `<span class="cell ${extra}">${silhouette}<span class="initial" aria-hidden="true">${esc(String(name || "").trim().charAt(0).toUpperCase())}</span></span>`;
  const lockedCell = `<span class="cell locked">${silhouette}<span class="lock">${padlock}</span></span>`;

  /* ---------- chrome shared by every page ---------- */
  function applyAlliance() {
    const tag = document.documentElement.dataset.alliance || "DGF", A = HQ.alliances[tag];
    document.querySelectorAll("[data-tag]").forEach(el => { el.textContent = tag; });
    document.querySelectorAll("[data-alliance-name]").forEach(el => { el.textContent = A.name; });
    document.querySelectorAll("[data-brand]").forEach(el => { el.textContent = A.brand; });
    document.querySelectorAll("[data-mock]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mock === tag)));
    document.querySelectorAll("[data-art]").forEach(el => { const src = A.art[el.dataset.art]; if (src) el.style.setProperty("--art", `url(${src})`); });
    return { tag, A };
  }
  function buildLang() {
    const sel = $("lang");
    if (!sel) return;
    sel.innerHTML = HQ.languages.map(([code, name]) => `<option value="${code}" lang="${code}">${name}</option>`).join("");
    sel.value = localStorage.getItem("hq-mock-lang") || "en";
    sel.addEventListener("change", () => HQ.setLanguage(sel.value));
  }
  document.addEventListener("hq:lang", e => {
    const { code, nav } = e.detail;
    document.querySelectorAll("[data-nav]").forEach(a => { a.textContent = nav[a.dataset.nav] || HQ.nav.en[a.dataset.nav]; });
    const sel = $("lang"); if (sel) sel.value = code;
  });
  document.addEventListener("click", e => {
    const mock = e.target.closest("[data-mock]");
    if (mock) HQ.setAlliance(mock.dataset.mock);
  });
  const numberWords = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

  window.D6 = { esc, icon, glyphs, chevrons, padlock, silhouette, council, portraitStyle, portraitFor, cellHTML, lockedCell, applyAlliance, buildLang, numberWords, fold };
})();
