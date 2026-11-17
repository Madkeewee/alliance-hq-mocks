/* d8-timetable calculators: item cells in, board readouts out. Maths from HQ.calculators. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = Shell.esc;
  const C = HQ.calculators;
  const KEY = "d8-calc";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  const pad = n => String(n).padStart(2, "0");
  const num = v => Math.max(0, Number(v) || 0);

  function clock(minutes) {
    const m = Math.max(0, Math.ceil(minutes));
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return `${d ? `<span class="dd">${d}d</span>` : ""}${pad(h)}:${pad(mm)}:00`;
  }
  const big = (label, html, sub) => `<div class="cellout"><span class="big">${html}</span><span class="lbl">${label}</span>${sub ? `<span class="sub">${sub}</span>` : ""}</div>`;

  function persist(section, values) { saved[section] = values; localStorage.setItem(KEY, JSON.stringify(saved)); }
  function readForm(form) {
    const o = {};
    new FormData(form).forEach((v, k) => { o[k] = num(v); });
    return o;
  }
  function fill(form, values) {
    Object.entries(values).forEach(([k, v]) => { const el = form.elements[k]; if (el) el.value = v; });
  }

  /* ---- Speedup inventory ---- */
  const spDenoms = [
    { name: "one", label: "1-minute items", unit: 1 }, { name: "five", label: "5-minute items", unit: 5 },
    { name: "sixty", label: "1-hour items", unit: 60 }, { name: "extra", label: "Other speedups", note: "total minutes", plain: true }
  ];
  function spInit() {
    $("sp-title").textContent = C.speedups.title;
    $("sp-desc").textContent = C.speedups.description;
    $("sp-cells").innerHTML = spDenoms.map(d => `
      <div class="cell">
        <span class="g">${GLYPHS.clock}</span>
        <label class="l" for="sp-${d.name}">${d.label}${d.note ? `<small>${d.note}</small>` : ""}</label>
        <div class="ctl ${d.plain ? "ctl--plain" : ""}">
          ${d.plain ? "" : `<button type="button" data-step="-1" data-for="sp-${d.name}" aria-label="One fewer ${d.label}">−</button>`}
          <input class="in" id="sp-${d.name}" name="${d.name}" type="number" inputmode="numeric" min="0" value="0">
          ${d.plain ? "" : `<button type="button" data-step="1" data-for="sp-${d.name}" aria-label="One more ${d.label}">+</button>`}
        </div>
      </div>`).join("");
    const form = $("sp-form");
    const s = saved.speedups || toForm(C.speedups.preset);
    fill(form, s);
    form.addEventListener("input", spRun);
    form.addEventListener("click", e => {
      const b = e.target.closest("[data-step]");
      if (!b) return;
      const el = $(b.dataset.for);
      el.value = Math.max(0, num(el.value) + Number(b.dataset.step));
      spRun();
    });
    spRun();
  }
  function toForm(p) { return { one: p.one, five: p.five, sixty: p.sixty, extra: p.extra, td: Math.floor(p.timer / 1440), th: Math.floor((p.timer % 1440) / 60), tm: p.timer % 60 }; }
  function spRun() {
    const v = readForm($("sp-form"));
    persist("speedups", v);
    const timer = v.td * 1440 + v.th * 60 + v.tm;
    const r = C.speedups.calc({ one: v.one, five: v.five, sixty: v.sixty, extra: v.extra, timer });
    const pct = Math.round(r.covered * 100);
    const short = r.shortMinutes;
    const items = short
      ? `<span class="big">${HQ.amount(Math.ceil(short / 60))}</span><p><b>more 1-hour items</b> would cover it, or ${HQ.amount(Math.ceil(short / 5))} five-minute items, or ${HQ.amount(short)} one-minute items.</p>`
      : `<span class="big ok">Covered</span><p>${timer ? `<b>${HQ.duration(r.totalMinutes - timer)}</b> of speedups to spare.` : "Enter the upgrade timer to compare."}</p>`;
    $("sp-out").innerHTML = `
      <div class="tri">
        ${big("Available", clock(r.totalMinutes), HQ.duration(r.totalMinutes))}
        ${big("Upgrade timer", clock(timer), HQ.duration(timer))}
        ${big("Still needed", clock(short), HQ.duration(short))}
      </div>
      <div class="cover"><span class="track" aria-hidden="true"><span class="fill" style="width:${pct}%"></span></span><span>Covered <b>${pct}%</b></span></div>
      <div class="items">${items}</div>`;
  }

  /* ---- Research budget ---- */
  const reCols = [["wood", "Wood"], ["iron", "Iron"], ["electricity", "Electricity"], ["coin", "Coin"], ["badge", "Badges"], ["clock", "Minutes"]];
  function reInit() {
    $("re-title").textContent = C.research.title;
    $("re-desc").textContent = C.research.description;
    $("re-heads").innerHTML = `<span>#</span>${reCols.map(([g, l]) => `<span>${GLYPHS[g]}${l}</span>`).join("")}<span>x</span>`;
    const s = saved.research || { steps: C.research.preset.steps, speed: C.research.preset.speed, discount: C.research.preset.discount, speedups: C.research.preset.speedups };
    reSetSteps(s.steps);
    fill($("re-form"), { speed: s.speed, discount: s.discount, speedups: s.speedups });
    $("re-form").addEventListener("input", reRun);
    $("re-add").addEventListener("click", () => { reAddStep([0, 0, 0, 0, 0, 0]); reRun(); $("re-steps").lastElementChild.querySelector("input").focus(); });
    $("re-steps").addEventListener("click", e => {
      const rm = e.target.closest(".rm");
      if (!rm) return;
      if ($("re-steps").children.length > 1) rm.closest(".step").remove(); else rm.closest(".step").querySelectorAll("input").forEach(i => { i.value = 0; });
      reNumber(); reRun();
    });
    reRun();
  }
  function reSetSteps(steps) { $("re-steps").innerHTML = ""; steps.forEach(s => reAddStep(s)); }
  function reAddStep(vals) {
    const li = document.createElement("li");
    li.className = "step";
    li.innerHTML = `<span class="num"></span>${reCols.map(([g, l], i) => `<label><span class="mlabel">${l}</span><input class="in" type="number" inputmode="numeric" min="0" value="${vals[i] ?? 0}" aria-label="${l}, step"></label>`).join("")}<button type="button" class="rm" aria-label="Remove step">×</button>`;
    $("re-steps").append(li);
    reNumber();
  }
  function reNumber() { [...$("re-steps").children].forEach((li, i) => { li.querySelector(".num").textContent = i + 1; li.querySelectorAll("input").forEach(inp => { inp.setAttribute("aria-label", inp.getAttribute("aria-label").replace(/step.*/, `step ${i + 1}`)); }); }); }
  function reRun() {
    const steps = [...$("re-steps").children].map(li => [...li.querySelectorAll("input")].map(i => num(i.value)));
    const f = $("re-form").elements;
    const v = { steps, speed: num(f.speed.value), discount: Math.min(100, num(f.discount.value)), speedups: num(f.speedups.value) };
    persist("research", v);
    const r = C.research.calc(v);
    const res = [["wood", "wood", r.wood], ["iron", "iron", r.iron], ["electricity", "electricity", r.electricity], ["coin", "coin", r.coin], ["badge", "badges", r.badges]];
    $("re-out").innerHTML = `
      <div class="res">${res.map(([g, l, n]) => `<div class="cellout">${GLYPHS[g]}<span class="big">${HQ.amount(n)}</span><span class="lbl">${l}</span></div>`).join("")}</div>
      <div class="times">${big("Research time", clock(r.timeMinutes), HQ.duration(r.timeMinutes))}${big("After speedups", clock(r.afterMinutes), HQ.duration(r.afterMinutes))}</div>`;
  }

  /* ---- The compact three ---- */
  const small = {
    goal: { form: "go-form", out: "go-out", title: "go-title", desc: "go-desc",
      render(r) { return r.remaining === 0 ? big("Target reached", "0", "Nothing more to gather.") : r.etaMinutes ? `${big("Still needed", HQ.amount(r.remaining))}${big("Time to target", clock(r.etaMinutes), HQ.duration(r.etaMinutes))}` : big("Still needed", HQ.amount(r.remaining), "Add a positive rate for a time to target."); } },
    crystals: { form: "cr-form", out: "cr-out", title: "cr-title", desc: "cr-desc",
      render(r) { return `${big("Crystals at settlement", HQ.amount(r.total))}<p class="sub">Regular ${HQ.amount(r.regular)}, boosted ${HQ.amount(r.boosted)}, passes ${HQ.amount(r.passes)}.</p>`; } },
    capture: { form: "ca-form", out: "ca-out", title: "ca-title", desc: "ca-desc",
      render(r) { return big("Further control needed", clock(r.leftMinutes), `About ${HQ.duration(r.leftMinutes)} uninterrupted.`); } }
  };
  function smallInit(key) {
    const s = small[key], form = $(s.form);
    $(s.title).textContent = C[key].title;
    $(s.desc).textContent = C[key].description;
    fill(form, saved[key] || C[key].preset);
    const run = () => { const v = readForm(form); if (key === "capture" && !v.full) v.full = 30; persist(key, v); $(s.out).innerHTML = `<div class="tri-small">${s.render(C[key].calc(v))}</div>`; };
    form.addEventListener("input", run);
    small[key].run = run;
    run();
  }

  /* ---- Load example / reset ---- */
  document.addEventListener("click", e => {
    const load = e.target.closest("[data-load]"), reset = e.target.closest("[data-reset]");
    const key = (load || reset)?.dataset[load ? "load" : "reset"];
    if (!key) return;
    if (key === "speedups") { fill($("sp-form"), load ? toForm(C.speedups.preset) : { one: 0, five: 0, sixty: 0, extra: 0, td: 0, th: 0, tm: 0 }); spRun(); }
    else if (key === "research") {
      if (load) { reSetSteps(C.research.preset.steps); fill($("re-form"), C.research.preset); }
      else { reSetSteps([[0, 0, 0, 0, 0, 0]]); fill($("re-form"), { speed: 0, discount: 0, speedups: 0 }); }
      reRun();
    } else { fill($(small[key].form), C[key].preset); small[key].run(); }
  });

  /* ---- ATLANTIS HUB ---- */
  $("more-rows").innerHTML = HQ.externalTools.map(t => `
    <li class="row row--notile"><div class="what"><h3 class="ev-name"><a href="${t.url}" target="_blank" rel="noopener">${esc(t.title)}<span class="visually-hidden"> (opens in a new tab)</span></a></h3><p class="ev-note">${esc(t.note)}</p></div>
      <p class="edge"><small>atlantisdws.com, new tab</small></p></li>`).join("");

  /* strip current */
  const markStrip = () => document.querySelectorAll("#calc-strip a").forEach(a => { if (a.getAttribute("href") === location.hash) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
  window.addEventListener("hashchange", markStrip);

  spInit(); reInit(); ["goal", "crystals", "capture"].forEach(smallInit); markStrip();
  Shell.mount({ page: "tools", title: "Calculators" });
})();
